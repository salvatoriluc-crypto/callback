// Reglas de negocio: estados, encaje de roles con el perfil, fechas, panel e .ics.

export const STATUS = {
  casting:      { label: 'Casting',      chip: 'chip-neu', group: 'castings',    stage: 0 },
  callback:     { label: 'Callback',     chip: 'chip-urg', group: 'castings',    stage: 0 },
  esperando:    { label: 'Esperando',    chip: 'chip-neu', group: 'castings',    stage: 0 },
  opcion:       { label: 'Opción',       chip: 'chip-opt', group: 'opciones',    stage: 1 },
  opcion_firme: { label: 'Opción firme', chip: 'chip-opt', group: 'opciones',    stage: 1 },
  confirmado:   { label: 'Confirmado',   chip: 'chip-ok',  group: 'confirmados', stage: 2 },
  rodado:       { label: 'Rodado',       chip: 'chip-ok',  group: 'confirmados', stage: 3 },
  por_cobrar:   { label: 'Por cobrar',   chip: 'chip-pay', group: 'confirmados', stage: 3 },
  cobrado:      { label: 'Cobrado',      chip: 'chip-ok',  group: 'cerradas',    stage: 4 },
  liberada:     { label: 'Liberada',     chip: 'chip-neu', group: 'cerradas',    stage: 1 },
  descartado:   { label: 'No seleccionado', chip: 'chip-neu', group: 'cerradas', stage: 0 }
};
export const STATUS_ORDER = Object.keys(STATUS);
export const STAGES = ['Casting', 'Opción', 'Confirmado', 'Rodado', 'Cobrado'];
export const GROUPS = [['todas', 'Todas'], ['castings', 'Castings'], ['opciones', 'Opciones'], ['confirmados', 'Confirmados'], ['cerradas', 'Cerradas']];
export const TYPES = { OCP: 'Principal (OCP)', SEC: 'Secundario', FE: 'Figuración especial', MANOS: 'Doble de manos' };
export const SKILLS = ['Español nativo', 'Catalán', 'Inglés alto', 'Francés', 'Italiano', 'Portugués', 'Skate', 'Conducir', 'Bailar', 'Deporte', 'Cantar', 'Instrumento'];

export const meta = (c) => STATUS[c.status] || STATUS.casting;

// ---------- Fechas ----------
const DOW = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
export const isIso = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v);
export function dayKey(d) { const x = new Date(d); return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`; }
export function fmtTime(iso) { const d = new Date(iso); return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }); }
export function fmtDay(iso) {
  const d = new Date(iso); const now = new Date();
  const diff = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  if (diff === -1) return 'Ayer';
  const dow = DOW[d.getDay()].toLowerCase();
  return `${dow.charAt(0).toUpperCase() + dow.slice(1)} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
export function fmtDateTime(iso) { return `${fmtDay(iso)} · ${fmtTime(iso)}`; }
export function dateBox(iso) { const d = new Date(iso); return { dow: DOW[d.getDay()], day: d.getDate() }; }
export function timeLeft(iso) {
  const ms = new Date(iso) - new Date();
  if (ms <= 0) return 'Vencido';
  const h = Math.floor(ms / 3600000);
  if (h < 1) return `Quedan ${Math.max(1, Math.round(ms / 60000))} min`;
  if (h < 48) return `Quedan ${h} h`;
  return `Quedan ${Math.round(h / 24)} días`;
}
export const euro = (n) => (n == null || n === '' ? '—' : `${String(Math.round(Number(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} €`);

// ---------- Encaje rol ↔ perfil ----------
export function fit(role, p) {
  if (!p) return { ok: true, reason: '' };
  if (role.type && p.types && p.types[role.type] === false) return { ok: false, reason: `No aceptas ${TYPES[role.type]?.toLowerCase() || role.type}` };
  if (role.gender && role.gender !== 'X' && p.gender && p.gender !== 'X' && role.gender !== p.gender) return { ok: false, reason: 'No encaja: género' };
  if (role.ageMin != null && role.ageMax != null && p.ageMin != null && p.ageMax != null) {
    if (role.ageMax < p.ageMin || role.ageMin > p.ageMax) return { ok: false, reason: 'No encaja: edad' };
  }
  if (role.localOnly && p.city && role.localOnly.toLowerCase() !== p.city.toLowerCase()) return { ok: false, reason: `Solo locales de ${role.localOnly}` };
  if (role.english && !(p.skills || []).includes('Inglés alto')) return { ok: false, reason: 'Pide inglés alto' };
  const bits = [];
  if (role.english) bits.push('tienes inglés alto');
  return { ok: true, reason: bits.length ? `Encaja: ${bits.join(', ')}` : 'Encaja con tu perfil' };
}
export function roleSpec(r) {
  const g = { H: 'Hombre', M: 'Mujer', X: 'Todos los géneros' }[r.gender] || '';
  const age = r.ageMin != null ? `${r.ageMin}–${r.ageMax}` : '';
  return [g, age, r.localOnly ? `solo locales ${r.localOnly}` : '', r.notes || ''].filter(Boolean).join(' · ');
}

// ---------- Pasos ----------
const GENERIC_SELFTAPE = [
  { title: 'Presentación a cámara', tag: '15 seg', detail: 'Plano medio, mirando a cámara: nombre, edad, altura, ciudad y agencia.' },
  { title: 'Perfiles y plano entero', tag: '10 seg', detail: 'Perfil izquierdo, derecho y plano entero.' },
  { title: 'Escena del rol', tag: '', detail: 'Sigue la escena indicada para este rol en la convocatoria.' },
  { title: 'Revisar y subir', tag: '', detail: 'Revisa el vídeo y súbelo al link antes del deadline.' }
];
export function presencialSteps(c, role) {
  const p = c.presencial || {};
  const leave = p.at ? new Date(new Date(p.at).getTime() - 40 * 60000).toISOString() : null;
  return [
    { title: 'Confirmar asistencia', tag: '', detail: `Responde a ${c.agent || 'tu agente'} diciendo que vas en persona.` },
    { title: 'Preparar el rol', tag: '', detail: role ? `Repasa la escena de «${role.name}».` : 'Repasa la escena de tu rol.' },
    { title: 'Ropa y look', tag: '', detail: p.how || 'Ropa lisa, sin logos. Look como en tus fotos de agencia.' },
    { title: 'Salir de casa', tag: leave ? fmtTime(leave) : '', detail: 'Llega 15 minutos antes.' },
    { title: 'Check-in y casting', tag: p.at ? fmtTime(p.at) : '', detail: p.place || '' },
    { title: 'Cómo te fue', tag: 'Después', detail: 'Anota qué te pidieron y el feedback, y avisa a tu agente.' }
  ];
}
export function stepsFor(c, mode, role) {
  if (mode === 'presencial') return presencialSteps(c, role);
  return (role && role.steps && role.steps.length) ? role.steps : GENERIC_SELFTAPE;
}
export const PRES_STATUS = ['Por confirmar', 'Confirmado', 'Confirmado', 'Confirmado', 'En camino', 'Hecho', 'Esperando respuesta'];

// ---------- Próximo evento / urgencia ----------
export function nextEvent(c) {
  const now = Date.now() - 3600000;
  const evs = [];
  if (c.deadline && c.modality?.selftape !== false) evs.push({ at: c.deadline, label: c.deadlineLabel || 'Deadline selftape', kind: 'deadline' });
  else if (c.deadline) evs.push({ at: c.deadline, label: c.deadlineLabel || 'Deadline', kind: 'deadline' });
  if (c.presencial?.at) evs.push({ at: c.presencial.at, label: c.status === 'callback' ? 'Callback' : 'Casting presencial', kind: 'presencial' });
  if (c.shootingAt) evs.push({ at: c.shootingAt, label: 'Rodaje', kind: 'rodaje' });
  if (c.paymentDue) evs.push({ at: c.paymentDue, label: 'Cobro previsto', kind: 'cobro' });
  return evs.filter((e) => isIso(e.at) && new Date(e.at).getTime() >= now).sort((a, b) => new Date(a.at) - new Date(b.at))[0] || null;
}
export function isOpen(c) { return !['cobrado', 'liberada', 'descartado'].includes(c.status); }
export function agenda(castings, days = 7) {
  const limit = Date.now() + days * 86400000;
  const out = [];
  for (const c of castings) {
    if (!isOpen(c)) continue;
    const evs = [];
    if (c.deadline) evs.push({ at: c.deadline, label: c.deadlineLabel || 'Deadline selftape' });
    if (c.presencial?.at) evs.push({ at: c.presencial.at, label: c.status === 'callback' ? 'Callback' : 'Casting presencial' });
    if (c.shootingAt) evs.push({ at: c.shootingAt, label: 'Rodaje' });
    for (const e of evs) {
      const t = new Date(e.at).getTime();
      if (t >= Date.now() - 3600000 && t <= limit) out.push({ ...e, c });
    }
  }
  return out.sort((a, b) => new Date(a.at) - new Date(b.at));
}
export function urgent(castings) {
  const soon = agenda(castings, 2).filter((e) => e.label.startsWith('Deadline') || e.label === 'Responder opción' || e.label === 'Callback');
  return soon[0] || null;
}

// ---------- Panel ----------
export function stats(castings) {
  const n = castings.length || 0;
  const reached = (stage) => castings.filter((c) => meta(c).stage >= stage && c.status !== 'descartado').length;
  const sent = castings.filter((c) => c.status !== 'casting' || (c.progress && Object.keys(c.progress.done || {}).length)).length;
  const callbacks = castings.filter((c) => c.status === 'callback' || meta(c).stage >= 1).length;
  const confirmed = castings.filter((c) => meta(c).stage >= 2 && !['liberada'].includes(c.status)).length;
  const paid = castings.filter((c) => c.status === 'cobrado').length;
  const sum = (f) => castings.filter(f).reduce((a, c) => a + (Number(c.fee) || 0), 0);
  return {
    total: n,
    funnel: [
      ['Castings recibidos', n, 'var(--violet)'],
      ['Enviados / presentados', sent, 'var(--violet)'],
      ['Callbacks', callbacks, '#8B7CFF'],
      ['Opciones', reached(1), '#8B7CFF'],
      ['Trabajos confirmados', confirmed, 'var(--lime)'],
      ['Cobrados', paid, '#0F766E']
    ],
    conversion: n ? Math.round((confirmed / n) * 100) : 0,
    confirmed,
    money: {
      cobrado: sum((c) => c.status === 'cobrado'),
      porCobrar: sum((c) => ['rodado', 'por_cobrar'].includes(c.status)),
      confirmado: sum((c) => c.status === 'confirmado'),
      opcion: sum((c) => ['opcion', 'opcion_firme'].includes(c.status))
    },
    closedIncome: sum((c) => meta(c).stage >= 2 && c.status !== 'liberada')
  };
}

// ---------- Calendario (.ics) ----------
function icsDate(iso) { return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
function icsText(s) { return String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;'); }
export function icsFor(c) {
  const events = [];
  if (c.deadline) events.push({ at: c.deadline, title: `${c.deadlineLabel || 'Deadline selftape'} · ${c.brand}`, dur: 15 });
  if (c.presencial?.at) events.push({ at: c.presencial.at, title: `Casting ${c.brand}`, dur: 60, loc: c.presencial.place });
  if (c.shootingAt) events.push({ at: c.shootingAt, title: `Rodaje ${c.brand}`, dur: 600, loc: c.shooting });
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Callback//ES', 'CALSCALE:GREGORIAN'];
  events.forEach((e, i) => {
    const end = new Date(new Date(e.at).getTime() + e.dur * 60000).toISOString();
    lines.push('BEGIN:VEVENT', `UID:${c.id}-${i}@callback`, `DTSTAMP:${icsDate(new Date().toISOString())}`,
      `DTSTART:${icsDate(e.at)}`, `DTEND:${icsDate(end)}`, `SUMMARY:${icsText(e.title)}`,
      `DESCRIPTION:${icsText(`${c.project || ''}\nAgente: ${c.agent || ''}`)}`);
    if (e.loc) lines.push(`LOCATION:${icsText(e.loc)}`);
    lines.push('BEGIN:VALARM', 'TRIGGER:-PT3H', 'ACTION:DISPLAY', `DESCRIPTION:${icsText(e.title)}`, 'END:VALARM',
      'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', `DESCRIPTION:${icsText(e.title)}`, 'END:VALARM', 'END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return { text: lines.join('\r\n'), count: events.length };
}

// ---------- Extracción simple (modo demo, sin IA) ----------
const MONTH_IDX = { ene: 0, enero: 0, feb: 1, febrero: 1, mar: 2, marzo: 2, abr: 3, abril: 3, may: 4, mayo: 4, jun: 5, junio: 5, jul: 6, julio: 6, ago: 7, agosto: 7, sep: 8, sept: 8, septiembre: 8, oct: 9, octubre: 9, nov: 10, noviembre: 10, dic: 11, diciembre: 11 };
function findDate(text, anchor) {
  const i = text.toLowerCase().indexOf(anchor);
  if (i < 0) return null;
  const chunk = text.slice(i, i + 120);
  const m = chunk.match(/(\d{1,2})\s*(?:de\s+)?([a-záé]+)/i);
  const t = chunk.match(/(\d{1,2})[:.](\d{2})\s*h?/);
  if (!m) return null;
  const mon = MONTH_IDX[m[2].toLowerCase()];
  if (mon == null) return null;
  const d = new Date(); d.setMonth(mon, Number(m[1]));
  if (t) d.setHours(Number(t[1]), Number(t[2]), 0, 0); else d.setHours(23, 59, 0, 0);
  if (d < new Date(Date.now() - 180 * 86400000)) d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
}
export function quickExtract(text, subject = '') {
  const all = `${subject}\n${text}`;
  const NOISE = /casting|deadline|selftape|self-tape|fifth|management|nuevo|via|recordatorio|reminder|convocatoria|links?|ampliaci/i;
  let brand = '';
  if (all.includes('//')) brand = all.split('\n')[0].split('//').map((x) => x.trim()).find((x) => x && !NOISE.test(x)) || '';
  if (!brand) {
    const m = all.match(/casting\s+(?:para|de)\s+([A-ZÁÉÍÓÚÑ0-9][\wÁÉÍÓÚÑáéíóúñ&+'\-]*(?:\s[A-ZÁÉÍÓÚÑ0-9][\wÁÉÍÓÚÑáéíóúñ&+'\-]*){0,3})/);
    if (m) brand = m[1];
  }
  if (!brand) {
    const caps = (all.match(/\b[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ0-9&'\-]{2,}\b/g) || []).filter((w) => !NOISE.test(w));
    brand = caps[0] || '';
  }
  const lower = all.toLowerCase();
  const feeM = all.match(/(\d{1,2}[.,]?\d{3}|\d{3,4})\s?€/);
  const shootM = all.match(/(?:shooting|rodaje)[^\n.]{0,60}/i);
  const deadline = findDate(all, 'deadline') || findDate(all, 'hasta');
  return {
    brand: brand.trim().replace(/\s+/g, ' '),
    project: '',
    agent: '',
    status: /opci[oó]n\s+firme/.test(lower) ? 'opcion_firme' : /\bopci[oó]n\b/.test(lower) ? 'opcion' : lower.includes('callback') && !lower.includes('casting') ? 'callback' : 'casting',
    modality: { selftape: /selftape|self-tape|self tape|ecasting/.test(lower), presencial: /presencial/.test(lower) },
    deadline,
    shooting: shootM ? shootM[0].trim() : '',
    fee: feeM ? Number(feeM[1].replace(/[.,]/g, '')) : null,
    conditions: {
      medios: /tv/.test(lower) && /internet/.test(lower) ? 'TV + Internet' : /internet/.test(lower) ? 'Internet' : '',
      gastos: /no (cubre|paga) gastos|no cubre desplazamiento/.test(lower) ? 'No cubiertos' : /gastos|travel|alojamiento/.test(lower) ? 'Cubiertos (revisar)' : ''
    },
    description: text.trim().slice(0, 280),
    roles: [],
    source: text
  };
}
