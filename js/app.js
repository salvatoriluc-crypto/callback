// Callback — app principal: estado, rutas y eventos.
import * as store from './store.js';
import { toast, download } from './ui.js';
import { icsFor } from './logic.js';
import { loginView, homeView, listView, castingView, panelView, profileView, addView, editView } from './views.js';

const app = document.getElementById('app');
const state = {
  session: null, castings: [], profile: null, recovery: false, loginError: '',
  ui: { filter: 'todas', query: '', onlyFit: {}, pasteText: '', busy: false, error: '' },
  draft: null
};

const route = () => (location.hash.replace(/^#/, '') || '/').split('/').filter(Boolean);
const go = (h) => { if (location.hash === h) render(); else location.hash = h; };
const byId = (id) => state.castings.find((c) => String(c.id) === String(id));

function render() {
  const [page, id] = route();
  if (state.recovery) { app.innerHTML = loginView({ recovery: true, error: state.loginError }); return; }
  if (!state.session) { app.innerHTML = loginView({ error: state.loginError }); return; }
  const ctx = { castings: state.castings, profile: state.profile, session: state.session, ui: state.ui };
  let html;
  switch (page) {
    case 'propuestas': html = listView(ctx); break;
    case 'casting': html = castingView({ ...ctx, c: byId(decodeURIComponent(id)), ui: { onlyFit: state.ui.onlyFit[id] } }); break;
    case 'panel': html = panelView(ctx); break;
    case 'perfil': html = profileView(ctx); break;
    case 'nuevo': html = addView(ctx); break;
    case 'editar': {
      const isNew = id === 'nuevo';
      if (!isNew && (!state.draft || String(state.draft.id) !== String(decodeURIComponent(id)))) state.draft = structuredClone(byId(decodeURIComponent(id)) || {});
      if (isNew && !state.draft) state.draft = { status: 'casting', modality: { selftape: true, presencial: false }, roles: [], conditions: {}, received: new Date().toISOString() };
      html = editView({ draft: state.draft, isNew });
      break;
    }
    default: html = homeView(ctx);
  }
  app.innerHTML = html;
}

async function refresh() {
  state.castings = await store.listCastings();
  state.profile = await store.getProfile();
}

async function saveCasting(c, msg) {
  const saved = await store.saveCasting(c);
  const i = state.castings.findIndex((x) => String(x.id) === String(saved.id));
  if (i >= 0) state.castings[i] = saved; else state.castings.unshift(saved);
  if (msg) toast(msg);
  return saved;
}

function current() { const [page, id] = route(); return page === 'casting' ? byId(decodeURIComponent(id)) : null; }

function formToDraft(form, base) {
  const fd = new FormData(form);
  const v = (k) => (fd.get(k) ?? '').toString().trim();
  const iso = (k) => (v(k) ? new Date(v(k)).toISOString() : null);
  const presAt = iso('presAt'), presPlace = v('presPlace');
  return {
    ...base,
    brand: v('brand'), agent: v('agent'), project: v('project'), status: v('status') || 'casting',
    fee: v('fee') === '' ? null : Number(v('fee')), feeNote: v('feeNote'),
    modality: { selftape: fd.has('selftape'), presencial: fd.has('presencial') },
    deadline: iso('deadline'),
    presencial: presAt || presPlace ? { ...(base.presencial || {}), at: presAt, place: presPlace } : null,
    shootingAt: iso('shootingAt'), shooting: v('shooting'),
    conditions: { medios: v('medios'), territorio: v('territorio'), duracion: v('duracion'), exclusividad: v('exclusividad'), gastos: v('gastos') },
    description: v('description'),
    roles: base.roles || []
  };
}

// ---------- Clicks ----------
app.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act, v = el.dataset.v;
  const c = current();
  try {
    switch (act) {
      case 'forgot': {
        const email = app.querySelector('input[name=email]')?.value.trim();
        if (!email) { toast('Escribe tu email arriba y vuelve a pulsar.'); return; }
        await store.resetPassword(email);
        toast(store.isDemo ? 'En la demo no hace falta: entra con cualquier contraseña.' : 'Te hemos enviado un email para cambiarla.');
        return;
      }
      case 'filter': state.ui.filter = v; render(); return;
      case 'onlyfit': state.ui.onlyFit[route()[1]] = v === '1'; render(); return;
      case 'role': c.progress = { ...(c.progress || {}), role: v }; await saveCasting(c); render(); return;
      case 'mode': c.progress = { ...(c.progress || {}), mode: v }; await saveCasting(c); render(); return;
      case 'step': {
        const done = { ...(c.progress?.done || {}) };
        done[v] = !done[v];
        c.progress = { ...(c.progress || {}), done };
        await saveCasting(c); render(); return;
      }
      case 'ics': {
        const { text, count } = icsFor(c);
        if (!count) { toast('Este casting no tiene fechas todavía.'); return; }
        download(`${c.brand.replace(/[^\p{L}\p{N}]+/gu, '_')}.ics`, text);
        toast('Ábrelo para añadirlo a tu calendario con avisos.');
        return;
      }
      case 'delete':
        if (!confirm(`¿Eliminar ${c.brand}? No se puede deshacer.`)) return;
        await store.deleteCasting(c.id);
        state.castings = state.castings.filter((x) => x.id !== c.id);
        toast('Eliminado'); go('#/propuestas'); return;
      case 'ptype': {
        const types = { OCP: true, SEC: true, FE: true, MANOS: true, ...(state.profile.types || {}) };
        types[v] = !types[v];
        state.profile = { ...state.profile, types };
        await store.saveProfile(state.profile); render(); return;
      }
      case 'pskill': {
        const s = new Set(state.profile.skills || []);
        s.has(v) ? s.delete(v) : s.add(v);
        state.profile = { ...state.profile, skills: [...s] };
        await store.saveProfile(state.profile); render(); return;
      }
      case 'toggle': state.profile = { ...state.profile, [v]: !state.profile[v] }; await store.saveProfile(state.profile); render(); return;
      case 'logout': await store.logout(); state.session = null; go('#/'); return;
      case 'resetdemo': store.resetDemo(); await refresh(); toast('Datos de ejemplo restablecidos'); render(); return;
      case 'copy':
        try { await navigator.clipboard.writeText(v); toast('Copiado'); } catch { toast(v); }
        return;
      case 'addrole': {
        const form = el.closest('form');
        const fd = new FormData(form);
        const name = (fd.get('rName') || '').toString().trim();
        if (!name) { toast('Escribe el nombre del rol.'); return; }
        state.draft = formToDraft(form, state.draft);
        const num = (k) => (fd.get(k) ? Number(fd.get(k)) : null);
        state.draft.roles = [...(state.draft.roles || []), { id: 'r' + Date.now().toString(36), name, type: fd.get('rType'), gender: fd.get('rGender'), ageMin: num('rMin'), ageMax: num('rMax') }];
        render(); return;
      }
      case 'delrole': {
        state.draft = formToDraft(el.closest('form'), state.draft);
        state.draft.roles = state.draft.roles.filter((_, i) => i !== Number(v));
        render(); return;
      }
    }
  } catch (err) {
    toast(err.message || 'Algo ha fallado');
  }
});

// ---------- Formularios ----------
app.addEventListener('submit', async (e) => {
  const form = e.target.closest('form[data-form]');
  if (!form) return;
  e.preventDefault();
  const kind = form.dataset.form;
  try {
    if (kind === 'login') {
      const fd = new FormData(form);
      state.session = await store.login(fd.get('email').toString().trim(), fd.get('password').toString());
      state.loginError = '';
      await refresh();
      go('#/');
    } else if (kind === 'newpass') {
      await store.updatePassword(new FormData(form).get('password').toString());
      state.recovery = false; state.loginError = '';
      toast('Contraseña actualizada'); location.hash = '#/'; await boot();
    } else if (kind === 'paste') {
      const text = new FormData(form).get('text').toString();
      state.ui.pasteText = text; state.ui.busy = true; state.ui.error = ''; render();
      const data = await store.extract({ text });
      state.ui.busy = false;
      state.draft = { status: 'casting', roles: [], conditions: {}, ...data, received: new Date().toISOString() };
      go('#/editar/nuevo');
    } else if (kind === 'edit') {
      const [, id] = route();
      const d = formToDraft(form, state.draft || {});
      if (!d.brand) { toast('Falta la marca.'); return; }
      if (id === 'nuevo') delete d.id;
      const saved = await saveCasting(d, 'Guardado');
      state.draft = null; state.ui.pasteText = '';
      go(`#/casting/${encodeURIComponent(saved.id)}`);
    }
  } catch (err) {
    state.ui.busy = false;
    if (kind === 'login' || kind === 'newpass') { state.loginError = err.message; render(); }
    else if (kind === 'paste') { state.ui.error = err.message; render(); }
    else toast(err.message);
  }
});

// ---------- Campos ----------
app.addEventListener('input', (e) => {
  const el = e.target.closest('[data-input]');
  if (!el || el.dataset.input !== 'query') return;
  state.ui.query = el.value;
  const pos = el.selectionStart;
  render();
  const again = app.querySelector('[data-input="query"]');
  if (again) { again.focus(); again.setSelectionRange(pos, pos); }
});

app.addEventListener('change', async (e) => {
  const el = e.target.closest('[data-input]');
  if (!el) return;
  const key = el.dataset.input;
  try {
    if (key === 'status') { const c = current(); c.status = el.value; await saveCasting(c, 'Estado actualizado'); render(); }
    else if (key === 'notes') { const c = current(); c.progress = { ...(c.progress || {}), notes: el.value }; await saveCasting(c, 'Notas guardadas'); }
    else if (key.startsWith('p.')) {
      const f = key.slice(2);
      const num = ['ageMin', 'ageMax', 'minFee'].includes(f);
      state.profile = { ...state.profile, [f]: num ? (el.value === '' ? null : Number(el.value)) : el.value };
      await store.saveProfile(state.profile);
      toast('Perfil guardado'); render();
    } else if (key === 'pdf' && el.files?.[0]) {
      const file = el.files[0];
      if (file.size > 8 * 1024 * 1024) { toast('El PDF pesa demasiado (máx. 8 MB).'); return; }
      state.ui.busy = true; state.ui.error = ''; render(); toast('Leyendo el PDF…');
      const b64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(file); });
      const data = await store.extract({ pdfBase64: b64, pdfName: file.name });
      state.ui.busy = false;
      state.draft = { status: 'casting', roles: [], conditions: {}, ...data, files: [file.name], received: new Date().toISOString() };
      go('#/editar/nuevo');
    }
  } catch (err) {
    state.ui.busy = false; toast(err.message || 'Algo ha fallado'); render();
  }
});

window.addEventListener('hashchange', () => {
  const [page] = route();
  if (page !== 'editar') state.draft = page === 'nuevo' ? null : state.draft;
  render();
  window.scrollTo(0, 0);
});

async function boot() {
  try {
    await store.init();
    store.onAuthRecovery(() => { state.recovery = true; render(); });
    state.session = await store.getSession();
    if (state.session) await refresh();
  } catch (err) {
    state.loginError = 'No se pudo conectar con el servidor. Revisa tu conexión.';
    console.error(err);
  }
  render();
}
boot();
