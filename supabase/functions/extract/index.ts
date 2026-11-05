// Función "extract": la web le manda el texto pegado o un PDF y devuelve el casting leído.
// Solo responde a usuarios con sesión iniciada.
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
  try {
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } }
    });
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return json({ error: 'Inicia sesión' }, 401);
    const body = await req.json();
    if (!body.text && !body.pdfBase64) return json({ error: 'Envía texto o un PDF' }, 400);
    return json(await extractCasting(body));
  } catch (err) {
    console.error(err);
    return json({ error: String((err as Error)?.message ?? err) }, 400);
  }
});
