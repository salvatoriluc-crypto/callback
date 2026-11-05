// Capa de datos: modo demo (localStorage) o Supabase (usuarios reales).
import { CONFIG } from './config.js';
import { DEMO_PROFILE, demoCastings } from './demo-data.js';
import { quickExtract } from './logic.js';

export const isDemo = !CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY;
let sb = null;

const LS = {
  get(k, fallback) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* nada */ } }
};
// En modo demo, si el navegador no deja guardar, mantenemos todo en memoria.
const mem = {};
function dget(k, f) { return k in mem ? mem[k] : LS.get(k, f); }
function dset(k, v) { mem[k] = v; LS.set(k, v); }

export async function init() {
  if (isDemo) return;
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  sb = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
}

// ---------- Sesión ----------
export async function getSession() {
  if (isDemo) return dget('cb_session', null);
  const { data } = await sb.auth.getSession();
  return data.session ? { email: data.session.user.email, id: data.session.user.id } : null;
}
export async function login(email, password) {
  if (!email || !password) throw new Error('Escribe tu email y tu contraseña.');
  if (isDemo) {
    const s = { email, id: 'demo' };
    dset('cb_session', s);
    if (!dget('cb_castings', null)) dset('cb_castings', demoCastings());
    return s;
  }
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Email o contraseña incorrectos.' : error.message);
  return { email: data.user.email, id: data.user.id };
}
export async function logout() {
  if (isDemo) { LS.del('cb_session'); delete mem.cb_session; return; }
  await sb.auth.signOut();
}
export async function resetPassword(email) {
  if (isDemo) return;
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
  if (error) throw new Error(error.message);
}
export async function updatePassword(pw) {
  if (isDemo) return;
  const { error } = await sb.auth.updateUser({ password: pw });
  if (error) throw new Error(error.message);
}
export function onAuthRecovery(cb) {
  if (isDemo || !sb) return;
  sb.auth.onAuthStateChange((event) => { if (event === 'PASSWORD_RECOVERY') cb(); });
}

// ---------- Castings ----------
export async function listCastings() {
  if (isDemo) return dget('cb_castings', null) || (dset('cb_castings', demoCastings()), dget('cb_castings', []));
  const { data, error } = await sb.from('castings').select('id, data, created_at').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data.map((r) => ({ ...r.data, id: r.id }));
}
export async function saveCasting(c) {
  if (isDemo) {
    const all = dget('cb_castings', []);
    if (!c.id) c.id = 'c' + Date.now().toString(36);
    const i = all.findIndex((x) => x.id === c.id);
    if (i >= 0) all[i] = c; else all.unshift(c);
    dset('cb_castings', all);
    return c;
  }
  const { id, ...data } = c;
  if (id) {
    const { error } = await sb.from('castings').update({ data }).eq('id', id);
    if (error) throw new Error(error.message);
    return c;
  }
  const { data: row, error } = await sb.from('castings').insert({ data }).select('id').single();
  if (error) throw new Error(error.message);
  return { ...c, id: row.id };
}
export async function deleteCasting(id) {
  if (isDemo) { dset('cb_castings', dget('cb_castings', []).filter((c) => c.id !== id)); return; }
  const { error } = await sb.from('castings').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
export function resetDemo() { dset('cb_castings', demoCastings()); dset('cb_profile', DEMO_PROFILE); }

// ---------- Perfil ----------
export async function getProfile() {
  if (isDemo) return dget('cb_profile', null) || DEMO_PROFILE;
  const { data } = await sb.from('profiles').select('data').maybeSingle();
  return data?.data || { name: '', city: '', gender: 'H', ageMin: 25, ageMax: 35, types: { OCP: true, SEC: true, FE: true, MANOS: false }, skills: [], travel: true, eatsAll: true, minFee: 0 };
}
export async function saveProfile(p) {
  if (isDemo) { dset('cb_profile', p); return; }
  const session = await getSession();
  const { error } = await sb.from('profiles').upsert({ user_id: session.id, data: p });
  if (error) throw new Error(error.message);
}

// ---------- Extracción con IA ----------
export async function extract({ text, subject, pdfBase64, pdfName }) {
  if (isDemo) {
    if (!text) throw new Error('En la demo solo se puede pegar texto. Con el backend conectado también lee PDFs.');
    return quickExtract(text, subject);
  }
  const { data, error } = await sb.functions.invoke('extract', { body: { text, subject, pdfBase64, pdfName } });
  if (error) throw new Error('No se pudo leer la convocatoria. Prueba de nuevo o rellénala a mano.');
  return data;
}
