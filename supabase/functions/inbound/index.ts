// Función "inbound": Postmark la llama cada vez que llega un email reenviado
// a tu dirección de entrada. Busca al usuario por el email del remitente,
// lee la convocatoria con Claude y la guarda en sus castings.
//
// URL para Postmark (Inbound › Webhook):
//   https://TU-PROYECTO.supabase.co/functions/v1/inbound?token=TU_INBOUND_TOKEN
// Despliégala SIN verificación JWT (Postmark no inicia sesión): ver README.
// (Archivo autocontenido para poder pegarlo tal cual en el editor de Supabase.)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';


// Lee una convocatoria (texto y/o PDF) con la API de Claude y devuelve
// un casting estructurado con el formato que usa la web.

const MODEL = Deno.env.get('CLAUDE_MODEL') ?? 'claude-haiku-5-5';

const SCHEMA = `{
  "brand": "marca o cliente (string)",
  "project": "proyecto / productora / campaña (string)",
  "agent": "nombre de la persona de la agencia que lo envía (string)",
  "status": "uno de: casting | callback | opcion | opcion_firme | confirmado | liberada | descartado",
  "modality": { "selftape": true/false, "presencial": true/false },
  "deadline": "fecha límite del selftape o de respuesta, ISO 8601 con zona (o null)",
  "deadlineLabel": "texto corto si el deadline no es de selftape, p. ej. 'Responder opción' (o null)",
  "presencial": { "at": "ISO 8601 o null", "place": "dirección o null", "how": "indicaciones (ropa, por quién preguntar) o null" } o null,
  "shooting": "texto con fechas y lugar de rodaje (string o null)",
  "shootingAt": "primer día de rodaje ISO 8601 (o null)",
  "fee": número en euros brutos (o null),
  "feeNote": "desglose o aclaración de la tarifa (o null)",
  "conditions": { "medios": "", "territorio": "", "duracion": "", "exclusividad": "", "gastos": "" },
  "description": "resumen de 1-2 frases de la pieza y el tono",
  "alert": "lo más importante a tener en cuenta en una frase (o null)",
  "roles": [ { "id": "slug-corto", "name": "", "type": "OCP | SEC | FE | MANOS", "gender": "H | M | X",
               "ageMin": número o null, "ageMax": número o null, "english": true/false,
               "localOnly": "ciudad si solo admiten locales, o null", "notes": "etnia, look u otros requisitos",
               "steps": [ { "title": "", "tag": "duración o vacío", "detail": "qué hacer exactamente" } ] } ],
  "files": ["nombres de adjuntos mencionados"]
}`;

async function extractCasting(input: { text?: string; subject?: string; pdfBase64?: string; pdfName?: string }) {
  const key = Deno.env.get('ANTHROPIC_API_KEY');
  if (!key) throw new Error('Falta ANTHROPIC_API_KEY en los secretos de Supabase');

  const today = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid', dateStyle: 'full', timeStyle: 'short' });
  const content: unknown[] = [];
  if (input.pdfBase64) {
    content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: input.pdfBase64 } });
  }
  content.push({
    type: 'text',
    text: `Hoy es ${today} (hora de Madrid). Esta es una convocatoria de casting para publicidad recibida por un actor/modelo desde su agencia.
${input.subject ? `Asunto: ${input.subject}\n` : ''}${input.text ? `Texto del email:\n"""\n${input.text.slice(0, 20000)}\n"""` : ''}

Extrae la información y responde SOLO con un objeto JSON válido con esta forma:
${SCHEMA}

Reglas:
- Fechas en ISO 8601 con zona Europe/Madrid (+01:00 o +02:00). Si falta la hora de un deadline, usa 23:59. Si no hay año, usa el próximo que tenga sentido.
- OCP = protagonista/principal, SEC = secundario, FE = figuración especial, MANOS = doble de manos.
- Incluye TODOS los roles ofrecidos. Para cada rol, "steps" son los pasos del selftape (presentación, perfiles, escena, frases, subir) con lo que piden exactamente; si no se detalla, deja la lista vacía.
- "status": "opcion"/"opcion_firme" si es una opción de trabajo, "confirmado" si confirman, "liberada" si liberan o cae la opción; si no, "casting" o "callback".
- No inventes datos: usa null o "" cuando no aparezcan.`
  });

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODEL, max_tokens: 4000, messages: [{ role: 'user', content }] })
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text()}`);
  const out = await res.json();
  const raw = (out.content ?? []).filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('');
  const json = raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1);
  const data = JSON.parse(json);
  data.roles = (data.roles ?? []).map((r: Record<string, unknown>, i: number) => ({ ...r, id: r.id || `rol${i + 1}` }));
  data.conditions = data.conditions ?? {};
  data.status = data.status || 'casting';
  return data;
}

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

async function findUserId(email: string): Promise<string | null> {
  const target = email.trim().toLowerCase();
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const u = data.users.find((x) => (x.email ?? '').toLowerCase() === target);
    if (u) return u.id;
    if (data.users.length < 200) break;
  }
  return null;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (url.searchParams.get('token') !== Deno.env.get('INBOUND_TOKEN')) return new Response('forbidden', { status: 403 });
  try {
    const mail = await req.json();
    const from = mail.FromFull?.Email ?? mail.From ?? '';
    const body = `${mail.Subject ?? ''}\n${mail.TextBody ?? ''}`;

    // Gmail pide confirmar el reenvío automático enviando un código a esta dirección.
    // Se lo dejamos al usuario dentro de la app para que pueda confirmarlo.
    if (/forwarding-noreply@google\.com/i.test(from)) {
      const requester = (body.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g) ?? []).find((e) => !/google\.com$/i.test(e));
      const code = body.match(/\b\d{9}\b/)?.[0];
      const link = body.match(/https:\/\/mail[^\s"]+/)?.[0];
      const uid = requester ? await findUserId(requester) : null;
      if (uid) {
        await admin.from('castings').insert({ user_id: uid, source: 'email', data: {
          brand: 'Gmail · confirmar reenvío', project: 'Paso único para activar el reenvío automático', status: 'casting',
          alert: code ? `Tu código de confirmación es ${code}` : 'Abre el enlace de confirmación', description: link ?? '',
          received: new Date().toISOString(), conditions: {}, roles: []
        } });
      }
      return new Response('ok');
    }

    const userId = await findUserId(from);
    if (!userId) {
      console.warn('Remitente sin cuenta:', from);
      return new Response('ok'); // respondemos 200 para que Postmark no reintente
    }
    const pdf = (mail.Attachments ?? []).find((a: { ContentType: string }) => a.ContentType === 'application/pdf');
    const data = await extractCasting({
      subject: mail.Subject,
      text: mail.TextBody || (mail.HtmlBody ?? '').replace(/<[^>]+>/g, ' '),
      pdfBase64: pdf?.Content,
      pdfName: pdf?.Name
    });
    data.files = [...new Set([...(data.files ?? []), ...(mail.Attachments ?? []).map((a: { Name: string }) => a.Name)])];
    data.received = new Date().toISOString();
    const { error } = await admin.from('castings').insert({ user_id: userId, data, source: 'email' });
    if (error) throw error;
    return new Response('ok');
  } catch (err) {
    console.error(err);
    return new Response('error', { status: 500 });
  }
});
