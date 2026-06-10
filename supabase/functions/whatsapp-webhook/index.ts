// WhatsApp Business Cloud API webhook → ORKA ERP
//
// Flujo:
//   1. Meta envía cada mensaje del número/grupo del bot a este webhook.
//   2. Texto  → Claude clasifica: ¿es una nominación? → extrae {pipas, producto,
//               cliente, terminal, estatus} → crea ventas en `sales` como INTENTION.
//   3. Imagen/PDF → se asume BOL → Claude vision extrae {BOL#, galones, pipa, fecha}
//               → busca la operación correspondiente → actualiza la venta, sube el
//               archivo a Storage y lo registra en `compliance_documents`.
//   4. Responde por WhatsApp confirmando o pidiendo aclaración.
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
const NOMINATION_SCHEMA = {
    type: "object",
    additionalProperties: false,
    properties: {
        kind: {
            type: "string",
            enum: ["nomination", "status_update", "other"],
            description: "nomination = alguien pide cargar N pipas de un producto para un cliente",
        },
        trucks: { type: "integer", description: "número de pipas solicitadas (0 si no aplica)" },
        product: { type: ["string", "null"], description: "producto mencionado, ej. MAGNA, DIESEL, PREMIUM" },
        customer: { type: ["string", "null"], description: "cliente para quien es la carga" },
        terminal: { type: ["string", "null"], description: "terminal de carga: BLUEWING, TITAN, MOTUS, SUNOCO" },
        status: { type: ["string", "null"], description: "estatus mencionado si es status_update" },
        truck_number: { type: ["string", "null"], description: "número de pipa si se menciona una unidad específica" },
        summary: { type: "string", description: "resumen de una línea en español de lo que pide el mensaje" },
    },
    required: ["kind", "trucks", "product", "customer", "terminal", "status", "truck_number", "summary"],
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

// Fuzzy lookup de un partner/product por nombre mencionado en WhatsApp
async function findPartner(name: string | null): Promise<{ id: string; name: string } | null> {
    if (!name) return null;
    const { data } = await supabase
        .from("partners").select("id, name")
        .ilike("name", `%${name.trim()}%`)
        .limit(1);
    return data?.[0] ?? null;
}

async function findProduct(name: string | null): Promise<{ id: string; name: string } | null> {
    if (!name) return null;
    const { data } = await supabase
        .from("products").select("id, name")
        .ilike("name", `%${name.trim()}%`)
        .limit(1);
    return data?.[0] ?? null;
}

// ── Procesamiento: texto (nominaciones) ───────────────────────────────────────
async function processText(eventId: string, from: string, body: string) {
    const msg = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system:
            "Eres el asistente de operaciones de ORKA México, un comercializador de combustibles. " +
            "Analizas mensajes de WhatsApp de grupos operativos. Una NOMINACIÓN es cuando alguien " +
            "solicita cargar pipas: indica cuántas pipas, de qué producto, para qué cliente, y a veces " +
            "la terminal. Ejemplos: '2 pipas de magna para ALPHA en TITAN', 'necesitamos 3 de diesel " +
            "para CAMPER mañana'. Si el mensaje solo informa avance de una unidad existente es status_update. " +
            "Cualquier otra cosa (saludos, preguntas, temas ajenos) es other.",
        messages: [{ role: "user", content: body }],
        output_config: { format: { type: "json_schema", schema: NOMINATION_SCHEMA } },
    });
    const data = parseStructured(msg);

    if (data.kind !== "nomination" || !data.trucks) {
        await supabase.from("whatsapp_events")
            .update({ classification: data.kind, extraction: data, status: "ignored" })
            .eq("id", eventId);
        return;
    }

    const [customer, product] = await Promise.all([
        findPartner(data.customer),
        findProduct(data.product),
    ]);

    if (!customer || !product || !COMPANY_ID) {
        await supabase.from("whatsapp_events")
            .update({ classification: "nomination", extraction: data, status: "needs_review",
                      error: `cliente=${customer?.name ?? "NO ENCONTRADO"}, producto=${product?.name ?? "NO ENCONTRADO"}` })
            .eq("id", eventId);
        await sendWhatsApp(from,
            `⚠️ Detecté una nominación (${data.summary}) pero no pude identificar ` +
            `${!customer ? `al cliente "${data.customer}"` : ""}${!customer && !product ? " ni " : ""}` +
            `${!product ? `el producto "${data.product}"` : ""}. ¿Puedes confirmar los nombres exactos?`);
        return;
    }

    // Una venta por pipa, en INTENTION — un humano la aprueba en el ERP
    const rows = Array.from({ length: data.trucks }, () => ({
        company_id: COMPANY_ID,
        sale_date: new Date().toISOString().slice(0, 10),
        customer_id: customer.id,
        product_id: product.id,
        gallons: 0,
        rate: 0,
        total_sale: 0,
        status: "INTENTION",
        legacy_external_id: `wa:${eventId}`,
    }));
    const { data: sales, error } = await supabase.from("sales").insert(rows).select("id");
    if (error) throw error;

    await supabase.from("whatsapp_events")
        .update({ classification: "nomination", extraction: data,
                  sale_ids: sales.map((s) => s.id), status: "processed" })
        .eq("id", eventId);

    await sendWhatsApp(from,
        `✅ Registré ${data.trucks} pipa${data.trucks > 1 ? "s" : ""} de ${product.name} ` +
        `para ${customer.name}${data.terminal ? ` en ${data.terminal}` : ""}. ` +
        `Quedan en INTENTION pendientes de aprobación en el ERP.`);
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

    // Buscar la operación: primero por BOL ya asignado, luego por pipa en estatus activo
    let sale: { id: string; company_id: string } | null = null;
    if (data.bol_number) {
        const { data: byBol } = await supabase.from("sales")
            .select("id, company_id").eq("bol_number", data.bol_number).limit(1);
        sale = byBol?.[0] ?? null;
    }
    if (!sale && data.truck_number) {
        const { data: byTruck } = await supabase.from("sales")
            .select("id, company_id")
            .eq("truck_number", data.truck_number)
            .in("status", ["INTENTION", "APPROVED", "LOADING", "ON_TRACK"])
            .order("sale_date", { ascending: false })
            .limit(1);
        sale = byTruck?.[0] ?? null;
    }

    if (!sale) {
        await supabase.from("whatsapp_events")
            .update({ classification: "bol_document", extraction: data, status: "needs_review",
                      error: "No se encontró operación para asignar el BOL" })
            .eq("id", eventId);
        await sendWhatsApp(from,
            `⚠️ Leí el BOL ${data.bol_number ?? "(sin número)"}` +
            `${data.gallons ? ` por ${data.gallons.toLocaleString()} GL` : ""}, pero no encontré ` +
            `una operación activa para la pipa ${data.truck_number ?? "(no identificada)"}. ` +
            `¿A qué unidad corresponde?`);
        return;
    }

    // Actualizar la venta con los datos reales del BOL
    const updates: Record<string, unknown> = { status: "BOL_UPDATED" };
    if (data.bol_number) updates.bol_number = data.bol_number;
    if (data.gallons) updates.gallons = data.gallons;
    if (data.net_barrels) updates.net_barrels = data.net_barrels;
    if (data.truck_number) updates.truck_number = data.truck_number;
    if (data.trailer_number) updates.trailer_number = data.trailer_number;
    await supabase.from("sales").update(updates).eq("id", sale.id);

    // Adjuntar el documento: Storage + compliance_documents
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
        `${data.product ? ` de ${data.product}` : ""}. Documento adjuntado a la operación.`);
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
            await processText(ev.id, from, body);
        } else if (mediaId && (type === "image" || type === "document")) {
            await processDocument(ev.id, from, mediaId);
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
