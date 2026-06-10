// WhatsApp Business Cloud API webhook → ORKA ERP
//
// Flujo rediseñado:
//   1. Meta envía cada mensaje del número/grupo del bot a este webhook.
//   2. NOMINACIÓN (texto) → crea entrada en nomination_queue con status PENDING_APPROVAL.
//      No crea sales aún. Espera aprobación.
//   3. APROBACIÓN (texto "aprobado", "adelante", etc.) → convierte nominaciones pending
//      a sales con status APPROVED.
//   4. BOL (imagen/PDF) → extrae datos, busca sale APPROVED por truck_number,
//      actualiza a BOL_UPDATED, adjunta documento.
//   5. SALDO/BALANCE (texto "saldo", "balance") → responde con balance actual del cliente.
//   6. PAGO/RECIBO (imagen de comprobante) → registra en payment_receipts.
//   7. CIERRE DIARIO (7am cron) → congela balances en daily_closure_snapshots.
//
// Secrets requeridos (Dashboard → Edge Functions → Secrets):
//   WHATSAPP_VERIFY_TOKEN   - string inventado por ti, se repite en Meta al registrar el webhook
//   WHATSAPP_TOKEN          - token permanente de la app de Meta (System User)
//   WHATSAPP_PHONE_NUMBER_ID- ID del número del bot en Meta
//   ANTHROPIC_API_KEY       - API key de Anthropic (console.anthropic.com)
//   ORKA_COMPANY_ID         - uuid de la company por defecto para ventas nuevas (ORKA_MX)

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";
import { encodeBase64 } from "jsr:@std/encoding/base64";

const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);
const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });

const WA_TOKEN = Deno.env.get("WHATSAPP_TOKEN")!;
const WA_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;
const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN")!;
const COMPANY_ID = Deno.env.get("ORKA_COMPANY_ID");
const GRAPH = "https://graph.facebook.com/v21.0";
const MODEL = "claude-opus-4-8";

// ── Schemas para structured outputs ──────────────────────────────────────────
const MESSAGE_CLASSIFICATION_SCHEMA = {
    type: "object",
    additionalProperties: false,
    properties: {
        kind: {
            type: "string",
            enum: ["nomination", "approval", "balance_inquiry", "payment_evidence", "other"],
            description:
                "nomination = mensaje con líneas de carga (fecha, •producto, N-CLIENTE(TERMINAL)); " +
                "approval = confirmación tipo 'Verde'; balance_inquiry = pregunta por saldo; " +
                "payment_evidence = comprobante de pago; other = otro",
        },
        date: {
            type: ["string", "null"],
            description: "fecha de la nominación en YYYY-MM-DD; '10/06/2026' es DD/MM/YYYY → 2026-06-10",
        },
        nominations: {
            type: "array",
            description:
                "una entrada por cada línea 'N-CLIENTE(TERMINAL)'. El producto con viñeta (•Naphtha) " +
                "aplica a todas las líneas que le siguen hasta el próximo producto.",
            items: {
                type: "object",
                additionalProperties: false,
                properties: {
                    quantity: { type: "integer", description: "número de pipas (el N en 'N-CLIENTE')" },
                    customer: { type: ["string", "null"], description: "código del cliente, ej. TIF" },
                    product: { type: ["string", "null"], description: "producto, ej. Naphtha, Magna, Diesel" },
                    terminal: { type: ["string", "null"], description: "terminal entre paréntesis, ej. MOTUS" },
                },
                required: ["quantity", "customer", "product", "terminal"],
            },
        },
        summary: { type: "string", description: "resumen de una línea en español" },
    },
    required: ["kind", "date", "nominations", "summary"],
} as const;

const BOL_SCHEMA = {
    type: "object",
    additionalProperties: false,
    properties: {
        is_bol: { type: "boolean", description: "true si el documento es un BOL (Bill of Lading) de combustible" },
        bol_number: { type: ["string", "null"] },
        gallons: { type: ["number", "null"], description: "galones netos cargados" },
        net_barrels: { type: ["number", "null"] },
        product: { type: ["string", "null"] },
        truck_number: { type: ["string", "null"] },
        trailer_number: { type: ["string", "null"] },
        terminal: { type: ["string", "null"] },
        carrier: { type: ["string", "null"] },
        date: { type: ["string", "null"], description: "fecha del BOL en formato YYYY-MM-DD" },
        customer: { type: ["string", "null"] },
    },
    required: ["is_bol", "bol_number", "gallons", "net_barrels", "product", "truck_number", "trailer_number", "terminal", "carrier", "date", "customer"],
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────
const parseStructured = (msg: Anthropic.Message) => {
    const text = msg.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") throw new Error("Claude no devolvió texto");
    return JSON.parse(text.text);
};

async function sendWhatsApp(to: string, body: string) {
    const res = await fetch(`${GRAPH}/${WA_PHONE_ID}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${WA_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", to, text: { body } }),
    });
    if (!res.ok) console.error("sendWhatsApp:", res.status, await res.text());
}

async function downloadMedia(mediaId: string): Promise<{ bytes: Uint8Array; mime: string }> {
    const meta = await fetch(`${GRAPH}/${mediaId}`, {
        headers: { Authorization: `Bearer ${WA_TOKEN}` },
    }).then((r) => r.json());
    const file = await fetch(meta.url, { headers: { Authorization: `Bearer ${WA_TOKEN}` } });
    return { bytes: new Uint8Array(await file.arrayBuffer()), mime: meta.mime_type };
}

// Fuzzy lookup de un partner/product por nombre mencionado en WhatsApp.
// Filtrado por company_id: los catálogos tienen filas duplicadas por empresa.
async function findPartner(name: string | null): Promise<{ id: string; name: string } | null> {
    if (!name) return null;
    let q = supabase.from("partners").select("id, name").ilike("name", `%${name.trim()}%`);
    if (COMPANY_ID) q = q.eq("company_id", COMPANY_ID);
    const { data } = await q.limit(1);
    return data?.[0] ?? null;
}

async function findProduct(name: string | null): Promise<{ id: string; name: string } | null> {
    if (!name) return null;
    let q = supabase.from("products").select("id, name").ilike("name", `%${name.trim()}%`);
    if (COMPANY_ID) q = q.eq("company_id", COMPANY_ID);
    const { data } = await q.limit(1);
    return data?.[0] ?? null;
}

// ── Procesamiento: texto (clasificación de tipo de mensaje) ──────────────────
async function classifyText(body: string): Promise<any> {
    const msg = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system:
            "Eres el asistente de operaciones de ORKA México. Clasificas mensajes del grupo de WhatsApp " +
            "'ORKA DAY-TO-DAY FLOW'.\n\n" +
            "NOMINACIÓN — formato real del grupo:\n" +
            "10/06/2026\n" +
            "•Naphtha\n" +
            "5-TIF✅(MOTUS)\n" +
            "= el 10-jun-2026, producto Naphtha, 5 pipas para el cliente TIF cargando en la terminal MOTUS.\n" +
            "Reglas: la fecha es DD/MM/YYYY. Cada producto va con viñeta (•) y aplica a las líneas que le siguen. " +
            "Cada línea 'N-CLIENTE(TERMINAL)' es una entrada independiente; un mensaje puede traer varios " +
            "productos y varios clientes. El emoji ✅ dentro de la línea es parte del formato, NO significa aprobado. " +
            "También acepta redacción libre: '2 pipas de magna para ALPHA en TITAN'.\n\n" +
            "APROBACIÓN: la palabra 'Verde' (con o sin 💚) significa que la nominación queda APROBADA. " +
            "También: 'aprobado', 'adelante', 'ok para cargar'.\n" +
            "BALANCE_INQUIRY: pregunta por saldo ('¿cuál es mi saldo?', 'balance?', 'cuánto debo?').\n" +
            "PAYMENT_EVIDENCE: comprobante de pago ('aquí va el transfer', 'foto del recibo').\n" +
            "OTHER: saludos, reacciones, temas ajenos.",
        messages: [{ role: "user", content: body }],
        output_config: { format: { type: "json_schema", schema: MESSAGE_CLASSIFICATION_SCHEMA } },
    });
    return parseStructured(msg);
}

async function processNomination(
    eventId: string,
    from: string,
    data: any,
    contactName: string | undefined
) {
    const entries = (data.nominations ?? []).filter((n: any) => n.quantity > 0);
    if (!entries.length || !COMPANY_ID) {
        await supabase.from("whatsapp_events")
            .update({ classification: "nomination", extraction: data, status: "ignored" })
            .eq("id", eventId);
        return;
    }

    const created: string[] = [];       // líneas confirmadas para la respuesta
    const problems: string[] = [];      // líneas con cliente/producto no identificado
    const nominationIds: string[] = [];

    for (const entry of entries) {
        const [customer, product] = await Promise.all([
            findPartner(entry.customer),
            findProduct(entry.product),
        ]);

        if (!customer || !product) {
            problems.push(
                `${entry.quantity}-${entry.customer ?? "?"}: ` +
                `${!customer ? `cliente "${entry.customer}" no encontrado` : ""}` +
                `${!customer && !product ? ", " : ""}` +
                `${!product ? `producto "${entry.product}" no encontrado` : ""}`
            );
            continue;
        }

        const { data: nomination, error } = await supabase
            .from("nomination_queue")
            .insert({
                company_id: COMPANY_ID,
                customer_id: customer.id,
                product_id: product.id,
                from_number: from,
                sender_name: contactName,
                quantity: entry.quantity,
                terminal: entry.terminal,
                requested_date: data.date ?? null,
                event_id: eventId,
                status: "PENDING_APPROVAL",
            })
            .select("id")
            .single();
        if (error) throw error;

        nominationIds.push(nomination.id);
        created.push(
            `${entry.quantity} × ${product.name} → ${customer.name}` +
            `${entry.terminal ? ` (${entry.terminal})` : ""}`
        );
    }

    await supabase.from("whatsapp_events")
        .update({
            classification: "nomination",
            extraction: data,
            nomination_ids: nominationIds,
            status: problems.length ? "needs_review" : "processed",
            error: problems.length ? problems.join("; ") : null,
        })
        .eq("id", eventId);

    let reply = "";
    if (created.length) {
        reply += `✅ Nominación registrada${data.date ? ` para ${data.date}` : ""}:\n` +
            created.map((l) => `• ${l}`).join("\n") +
            `\nPendiente de aprobación (responder "Verde" para aprobar).`;
    }
    if (problems.length) {
        reply += `${reply ? "\n\n" : ""}⚠️ No pude registrar:\n` +
            problems.map((l) => `• ${l}`).join("\n") +
            `\n¿Confirmas los nombres exactos?`;
    }
    await sendWhatsApp(from, reply);
}

async function processApproval(eventId: string, from: string, data: any) {
    // "Verde" aprueba todas las nominaciones pendientes recientes (últimas 24 horas),
    // igual que en el grupo: la respuesta aprueba el mensaje de nominación completo.
    const { data: pending, error } = await supabase
        .from("nomination_queue")
        .select("id, quantity, requested_date, terminal, company_id, customer_id, product_id, " +
                "partners:customer_id(name), products:product_id(name)")
        .eq("status", "PENDING_APPROVAL")
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: true });

    if (error || !pending?.length) {
        await supabase.from("whatsapp_events")
            .update({
                classification: "approval",
                extraction: data,
                status: "needs_review",
                error: "No se encontró nominación pendiente para aprobar",
            })
            .eq("id", eventId);
        await sendWhatsApp(
            from,
            `⚠️ No encontré una nominación pendiente para aprobar. ¿Cuál deseas aprobar?`
        );
        return;
    }

    const approvedAt = new Date().toISOString();
    const allSaleIds: string[] = [];
    const summaryLines: string[] = [];

    for (const nom of pending) {
        await supabase
            .from("nomination_queue")
            .update({ status: "APPROVED", approved_at: approvedAt })
            .eq("id", nom.id);

        // Una venta por pipa, con status APPROVED — lista para recibir su BOL al salir
        const rows = Array.from({ length: nom.quantity }, () => ({
            company_id: nom.company_id,
            sale_date: nom.requested_date ?? new Date().toISOString().slice(0, 10),
            customer_id: nom.customer_id,
            product_id: nom.product_id,
            nomination_id: nom.id,
            approved_at: approvedAt,
            gallons: 0,
            rate: 0,
            total_sale: 0,
            status: "APPROVED",
        }));
        const { data: sales, error: saleErr } = await supabase
            .from("sales").insert(rows).select("id");
        if (saleErr) throw saleErr;

        allSaleIds.push(...sales.map((s) => s.id));
        const customerName = (nom as any).partners?.name ?? "cliente";
        const productName = (nom as any).products?.name ?? "producto";
        summaryLines.push(
            `${nom.quantity} × ${productName} → ${customerName}` +
            `${nom.terminal ? ` (${nom.terminal})` : ""}`
        );
    }

    await supabase.from("whatsapp_events")
        .update({
            classification: "approval",
            extraction: data,
            nomination_ids: pending.map((n) => n.id),
            sale_ids: allSaleIds,
            status: "processed",
        })
        .eq("id", eventId);

    await sendWhatsApp(
        from,
        `💚 Verde — aprobado:\n` +
            summaryLines.map((l) => `• ${l}`).join("\n") +
            `\nCreé ${allSaleIds.length} operación${allSaleIds.length > 1 ? "es" : ""} en el ERP. ` +
            `Esperando BOL de cada pipa al salir.`
    );
}

async function processBalanceInquiry(
    eventId: string,
    from: string,
    data: any
) {
    // Buscar partner por número de teléfono
    const { data: partners, error } = await supabase
        .from("partners")
        .select("id, name, credit_limit, credit_available")
        .limit(10); // En producción, asociar contacto con partner

    if (error || !partners?.length) {
        await supabase.from("whatsapp_events")
            .update({
                classification: "balance_inquiry",
                extraction: data,
                status: "ignored",
                error: "No se pudo identificar el cliente",
            })
            .eq("id", eventId);
        return;
    }

    const partner = partners[0]; // Simplificación; en producción, usar contacto exacto
    const balance = (partner.credit_limit || 0) - (partner.credit_available || 0);

    await supabase.from("whatsapp_events")
        .update({
            classification: "balance_inquiry",
            extraction: data,
            status: "processed",
        })
        .eq("id", eventId);

    const balanceText =
        balance > 0
            ? `Debes: ${balance.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}`
            : `Crédito disponible: ${Math.abs(balance).toLocaleString("es-MX", { style: "currency", currency: "MXN" })}`;

    await sendWhatsApp(
        from,
        `💰 ${partner.name}: ${balanceText}\nLímite de crédito: ${(partner.credit_limit || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN" })}`
    );
}

async function processPaymentEvidence(
    eventId: string,
    from: string,
    mediaId: string,
    caption: string | undefined
) {
    const { bytes, mime } = await downloadMedia(mediaId);

    // Simplificación: registrar sin confirmar partner. En producción, asociar con contacto.
    const { data: receipt, error } = await supabase
        .from("payment_receipts")
        .insert({
            company_id: COMPANY_ID,
            partner_id: null, // cobranza lo asigna al registrar el pago
            from_number: from,
            receipt_type: "transfer",
            event_id: eventId,
            storage_url: `payment_receipts/${eventId}`,
            file_name: `receipt_${eventId}`,
            file_size: bytes.length,
            status: "RECEIVED",
            notes: caption,
        })
        .select("id")
        .single();

    if (error) throw error;

    // Subir a storage
    await supabase.storage
        .from("bols")
        .upload(`payment_receipts/${eventId}`, bytes, { contentType: mime, upsert: true });

    await supabase.from("whatsapp_events")
        .update({
            classification: "payment_evidence",
            extraction: { caption },
            payment_receipt_ids: [receipt.id],
            status: "processed",
        })
        .eq("id", eventId);

    await sendWhatsApp(
        from,
        `📸 Recibí el comprobante de pago. Nuestro equipo de cobranza lo procesará en el ERP. ` +
            `¿Cuál es el monto y número de referencia?`
    );
}

// ── Procesamiento: imagen/PDF (BOL) ───────────────────────────────────────────
async function processDocument(eventId: string, from: string, mediaId: string) {
    const { bytes, mime } = await downloadMedia(mediaId);
    const b64 = encodeBase64(bytes);

    const block = mime === "application/pdf"
        ? { type: "document" as const, source: { type: "base64" as const, media_type: "application/pdf" as const, data: b64 } }
        : { type: "image" as const, source: { type: "base64" as const, media_type: mime as "image/jpeg" | "image/png" | "image/webp", data: b64 } };

    const msg = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: "Extraes datos de BOLs (Bill of Lading) de cargas de combustible en terminales de Texas. " +
                "Lee con cuidado: número de BOL, galones netos (net gallons), barriles netos, producto, " +
                "número de pipa/truck, trailer, terminal, transportista y fecha.",
        messages: [{ role: "user", content: [block, { type: "text", text: "Extrae los datos de este documento." }] }],
        output_config: { format: { type: "json_schema", schema: BOL_SCHEMA } },
    });
    const data = parseStructured(msg);

    if (!data.is_bol) {
        await supabase.from("whatsapp_events")
            .update({ classification: "other", extraction: data, status: "ignored" })
            .eq("id", eventId);
        return;
    }

    // Buscar operación APPROVED por truck_number (la primera que ya fue aprobada)
    let sale: { id: string; company_id: string } | null = null;
    if (data.truck_number) {
        const { data: byTruck } = await supabase.from("sales")
            .select("id, company_id")
            .eq("truck_number", data.truck_number)
            .in("status", ["APPROVED", "LOADING", "ON_TRACK"])
            .order("sale_date", { ascending: false })
            .limit(1);
        sale = byTruck?.[0] ?? null;
    }

    if (!sale) {
        await supabase.from("whatsapp_events")
            .update({ classification: "bol_document", extraction: data, status: "needs_review",
                      error: "No se encontró operación APPROVED para asignar el BOL" })
            .eq("id", eventId);
        await sendWhatsApp(from,
            `⚠️ Leí el BOL ${data.bol_number ?? "(sin número)"}` +
            `${data.gallons ? ` por ${data.gallons.toLocaleString()} GL` : ""}, pero no encontré ` +
            `una operación aprobada para la pipa ${data.truck_number ?? "(no identificada)"}. ` +
            `¿Está aprobada? ¿Cuál es el número exacto de la pipa?`);
        return;
    }

    // Actualizar venta con datos del BOL
    const updates: Record<string, unknown> = { status: "BOL_UPDATED" };
    if (data.bol_number) updates.bol_number = data.bol_number;
    if (data.gallons) updates.gallons = data.gallons;
    if (data.net_barrels) updates.net_barrels = data.net_barrels;
    if (data.truck_number) updates.truck_number = data.truck_number;
    if (data.trailer_number) updates.trailer_number = data.trailer_number;
    await supabase.from("sales").update(updates).eq("id", sale.id);

    // Adjuntar documento
    const ext = mime === "application/pdf" ? "pdf" : mime.split("/")[1] ?? "bin";
    const path = `${sale.id}/${data.bol_number ?? mediaId}.${ext}`;
    const { error: upErr } = await supabase.storage.from("bols")
        .upload(path, bytes, { contentType: mime, upsert: true });
    if (!upErr) {
        await supabase.from("compliance_documents").insert({
            company_id: sale.company_id,
            sale_id: sale.id,
            document_type: "BOL",
            storage_url: path,
            file_name: path.split("/").pop(),
            file_size: bytes.length,
        });
    }

    await supabase.from("whatsapp_events")
        .update({ classification: "bol_document", extraction: data,
                  sale_ids: [sale.id], status: "processed" })
        .eq("id", eventId);

    await sendWhatsApp(from,
        `📄 BOL ${data.bol_number ?? ""} asignado a la pipa ${data.truck_number ?? "—"}: ` +
        `${data.gallons ? `${data.gallons.toLocaleString()} GL` : "galones por confirmar"}` +
        `${data.product ? ` de ${data.product}` : ""}. Documento registrado.`);
}

// ── Router por mensaje ─────────────────────────────────────────────────────────
async function handleMessage(wa: any, contactName: string | undefined) {
    const from = wa.from as string;

    // Dedupe — Meta reintenta entregas
    const { data: existing } = await supabase.from("whatsapp_events")
        .select("id").eq("wa_message_id", wa.id).limit(1);
    if (existing?.length) return;

    const type = wa.type as string;
    const body = type === "text" ? wa.text?.body
        : wa.image?.caption ?? wa.document?.caption ?? null;
    const mediaId = wa.image?.id ?? wa.document?.id ?? null;

    const { data: ev, error } = await supabase.from("whatsapp_events")
        .insert({ wa_message_id: wa.id, from_number: from, sender_name: contactName,
                  message_type: type, body, media_id: mediaId })
        .select("id").single();
    if (error || !ev) { console.error("log insert:", error); return; }

    try {
        if (type === "text" && body) {
            // Clasificar: nominación, aprobación, saldo, otro
            const classified = await classifyText(body);

            if (classified.kind === "nomination") {
                await processNomination(ev.id, from, classified, contactName);
            } else if (classified.kind === "approval") {
                await processApproval(ev.id, from, classified);
            } else if (classified.kind === "balance_inquiry") {
                await processBalanceInquiry(ev.id, from, classified);
            } else {
                await supabase.from("whatsapp_events")
                    .update({ status: "ignored", classification: classified.kind })
                    .eq("id", ev.id);
            }
        } else if (mediaId && (type === "image" || type === "document")) {
            // Podría ser BOL o comprobante de pago
            // Por ahora, asumir BOL. En producción, preguntar al usuario o usar caption
            const caption = wa.image?.caption ?? wa.document?.caption;
            if (caption?.toLowerCase().includes("pago") || caption?.toLowerCase().includes("transfer")) {
                await processPaymentEvidence(ev.id, from, mediaId, caption);
            } else {
                await processDocument(ev.id, from, mediaId);
            }
        } else {
            await supabase.from("whatsapp_events")
                .update({ status: "ignored", classification: "other" }).eq("id", ev.id);
        }
    } catch (e) {
        console.error("handleMessage:", e);
        await supabase.from("whatsapp_events")
            .update({ status: "error", error: String(e) }).eq("id", ev.id);
    }
}

// ── HTTP entrypoint ────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
    const url = new URL(req.url);

    // Verificación del webhook (la hace Meta una sola vez al registrarlo)
    if (req.method === "GET") {
        if (url.searchParams.get("hub.mode") === "subscribe" &&
            url.searchParams.get("hub.verify_token") === VERIFY_TOKEN) {
            return new Response(url.searchParams.get("hub.challenge") ?? "", { status: 200 });
        }
        return new Response("forbidden", { status: 403 });
    }

    if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

    const payload = await req.json().catch(() => null);
    if (!payload) return new Response("bad request", { status: 400 });

    // Responder 200 de inmediato y procesar en background (Meta exige respuesta rápida)
    const work = (async () => {
        for (const entry of payload.entry ?? []) {
            for (const change of entry.changes ?? []) {
                const value = change.value;
                if (!value?.messages) continue;
                const contactName = value.contacts?.[0]?.profile?.name;
                for (const wa of value.messages) {
                    await handleMessage(wa, contactName);
                }
            }
        }
    })();
    // @ts-ignore EdgeRuntime is provided by the Supabase Edge runtime
    EdgeRuntime.waitUntil(work);

    return new Response("ok", { status: 200 });
});
