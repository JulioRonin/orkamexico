# Bot de WhatsApp — Nominaciones y BOLs automáticos

El bot lee mensajes que llegan al número de WhatsApp Business de ORKA y:

1. **Nominaciones** ("2 pipas de magna para ALPHA en TITAN") → crea las ventas en
   el ERP con estatus `INTENTION` (un humano las aprueba después) y confirma por WhatsApp.
2. **BOLs** (foto o PDF) → extrae BOL#, galones, pipa, etc. con visión de IA, busca la
   operación correspondiente, la actualiza a `BOL_UPDATED`, sube el documento a Storage
   y lo registra en `compliance_documents`.
3. Si algo es ambiguo (cliente no reconocido, pipa sin operación activa) responde
   pidiendo aclaración y marca el evento como `needs_review` en `whatsapp_events`.

Todo queda auditado en la tabla `whatsapp_events`.

## Arquitectura

```
WhatsApp (Cloud API de Meta)
   │  webhook POST
   ▼
Edge Function: whatsapp-webhook (Supabase)
   │  ├─ Claude API (claude-opus-4-8): clasificación + extracción estructurada
   │  ├─ sales / partners / products / compliance_documents (Postgres)
   │  └─ Storage bucket "bols"
   ▼
Respuesta por WhatsApp (Graph API)
```

## Configuración paso a paso

### 1. Crear la app en Meta

1. Ve a [developers.facebook.com](https://developers.facebook.com) → **My Apps → Create App**
   → tipo **Business**.
2. Agrega el producto **WhatsApp** a la app.
3. En **WhatsApp → API Setup** obtén:
   - **Phone Number ID** → será `WHATSAPP_PHONE_NUMBER_ID`
   - Un **token permanente**: crea un *System User* en Business Settings con permiso
     `whatsapp_business_messaging`, genera el token → será `WHATSAPP_TOKEN`
     (el token temporal de la consola expira en 24h, no lo uses en producción).
4. Verifica el número de teléfono del negocio (puede ser un número nuevo dedicado al bot).

### 2. Configurar secrets en Supabase

Dashboard → Project Settings → **Edge Functions → Secrets**:

| Secret | Valor |
|---|---|
| `WHATSAPP_VERIFY_TOKEN` | cualquier string secreto que inventes (ej. `orka-wa-2026`) |
| `WHATSAPP_TOKEN` | token permanente del System User de Meta |
| `WHATSAPP_PHONE_NUMBER_ID` | Phone Number ID de Meta |
| `ANTHROPIC_API_KEY` | API key de [console.anthropic.com](https://console.anthropic.com) |
| `ORKA_COMPANY_ID` | `c44e7cb7-61e0-4f06-972c-c2f7c0d49f30` (ORKA_MX) |

### 3. Infraestructura ya desplegada ✅

Estos pasos **ya están hechos** — solo de referencia:

- Edge Function `whatsapp-webhook` desplegada y activa (JWT deshabilitado;
  la autenticación del webhook la hace el verify token de Meta).
- Tabla `whatsapp_events` creada con RLS.
- Bucket privado de Storage `bols` creado.

### 4. Registrar el webhook en Meta

En la app de Meta → **WhatsApp → Configuration → Webhook**:

- **Callback URL**: `https://nrqurxxctibdnjrudlcn.supabase.co/functions/v1/whatsapp-webhook`
- **Verify token**: el mismo valor que pusiste en `WHATSAPP_VERIFY_TOKEN`
- Click **Verify and save** (Meta hace un GET de verificación; la función lo responde).
- En **Webhook fields** suscribe `messages`.

### 5. Probar

Envía al número del bot:

> 2 pipas de magna para ALPHA en TITAN

Deberías recibir: *"✅ Registré 2 pipas de MAGNA para ALPHA en TITAN. Quedan en
INTENTION pendientes de aprobación en el ERP."* — y verlas en el módulo de
Operaciones.

Luego envía la foto de un BOL. El bot responde con los datos extraídos y la
operación a la que lo asignó.

## Limitación importante: grupos

La Cloud API oficial está pensada para conversaciones con el número del negocio.
**No puede leer grupos arbitrarios donde el número sea un participante común.**
El flujo operativo es: el equipo manda (o reenvía) las nominaciones y BOLs al
número del bot, o se usa un grupo creado vía la API donde el bot participa
(soporte de grupos en la API aún es limitado/beta de Meta).

## Monitoreo

- **Tabla `whatsapp_events`**: cada mensaje con su clasificación, extracción JSON,
  ventas creadas/actualizadas y estatus (`processed`, `needs_review`, `ignored`, `error`).
- **Logs de la función**: Dashboard → Edge Functions → whatsapp-webhook → Logs.
- Eventos en `needs_review` requieren intervención humana (cliente no encontrado,
  BOL sin operación). El bot ya pidió la aclaración por WhatsApp.

## Costos aproximados

- **Meta**: las conversaciones de servicio iniciadas por el usuario son gratuitas
  en la mayoría de los casos; revisa la tarifa vigente de WhatsApp Business.
- **Claude API**: centavos de dólar por mensaje de texto; un BOL en PDF/imagen
  cuesta unos pocos centavos por la visión. A volumen operativo normal (<100
  mensajes/día) el costo mensual es marginal.
- **Supabase**: la Edge Function entra en el free tier para este volumen.
