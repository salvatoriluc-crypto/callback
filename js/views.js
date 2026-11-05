// Pantallas de Callback (devuelven HTML).
import { esc, logo, logoViolet, icon, shell, initials } from './ui.js';
import { isDemo } from './store.js';
import { CONFIG } from './config.js';
import {
  STATUS, STATUS_ORDER, STAGES, GROUPS, TYPES, SKILLS, meta, fit, roleSpec, stepsFor, PRES_STATUS,
  fmtDay, fmtTime, fmtDateTime, dateBox, timeLeft, euro, nextEvent, agenda, urgent, stats, isIso
} from './logic.js';

const chip = (c) => `<span class="chip ${meta(c).chip}">${esc(meta(c).label)}</span>`;
const firstName = (p, s) => (p?.name || s?.email || '').split(/[ @]/)[0] || 'hola';

// ---------- Login ----------
export function loginView({ error = '', recovery = false } = {}) {
  if (recovery) {
    return `<div class="login"><form class="login-card" data-form="newpass">
      <div class="stack">${logoViolet(56, 'Logo de Callback')}<h1>Nueva contraseña</h1></div>
      <label class="field">Contraseña nueva<input class="input" type="password" name="password" autocomplete="new-password" minlength="6" required></label>
      ${error ? `<p class="error">${esc(error)}</p>` : ''}
      <button class="btn btn-primary btn-block" type="submit">Guardar contraseña</button>
    </form></div>`;
  }
  return `<div class="login"><form class="login-card" data-form="login" novalidate>
    <div class="stack">
      ${logoViolet(64, 'Logo de Callback')}
      <h1>callback<i>.</i></h1>
      <p class="muted" style="margin:0;font-size:15px">Tus castings, claros. Entra con la cuenta que te dieron para la beta.</p>
    </div>
    <div class="stack">
      <label class="field">Email<input class="input" type="email" name="email" autocomplete="email" required></label>
      <label class="field">Contraseña<input class="input" type="password" name="password" autocomplete="current-password" required></label>
      ${error ? `<p class="error" role="alert">${esc(error)}</p>` : ''}
      <button class="btn btn-primary btn-block" type="submit" style="min-height:52px;font-size:16px">Entrar</button>
      <button class="link" type="button" data-act="forgot" style="align-self:center">¿Olvidaste tu contraseña?</button>
    </div>
    <div class="card row" style="align-items:flex-start;gap:10px">
      <span class="chip" style="background:var(--lime);color:var(--ink)">BETA</span>
      <span class="small" style="color:var(--neutral-ink)">${isDemo ? 'Modo demo: entra con cualquier email y contraseña para ver la app con datos de ejemplo.' : 'Acceso solo por invitación. ¿Te han invitado? <a href="#/registro">Crea tu cuenta</a>.'}</span>
    </div>
  </form></div>`;
}

export function signupView({ error = '', invite = '', done = false } = {}) {
  if (done) {
    return `<div class="login"><div class="login-card">
      <div class="stack">${logoViolet(56, 'Logo de Callback')}<h1>Revisa tu email</h1>
      <p class="muted" style="margin:0">Te hemos enviado un enlace para confirmar tu cuenta. Ábrelo y luego entra con tu email y contraseña.</p></div>
      <a class="btn btn-primary btn-block" href="#/entrar">Ir a entrar</a></div></div>`;
  }
  return `<div class="login"><form class="login-card" data-form="signup" novalidate>
    <div class="stack">
      ${logoViolet(56, 'Logo de Callback')}
      <h1>Crea tu cuenta</h1>
      <p class="muted" style="margin:0;font-size:15px">Te han invitado a la beta de callback. En un minuto tendrás todos tus castings ordenados.</p>
    </div>
    <div class="stack">
      <label class="field">Nombre<input class="input" name="name" autocomplete="name" required></label>
      <label class="field">Email<input class="input" type="email" name="email" autocomplete="email" required></label>
      <label class="field">Contraseña (mínimo 6 caracteres)<input class="input" type="password" name="password" autocomplete="new-password" minlength="6" required></label>
      <label class="field">Código de invitación<input class="input" name="invite" value="${esc(invite)}" autocapitalize="characters" required style="text-transform:uppercase;letter-spacing:1px"></label>
      ${error ? `<p class="error" role="alert">${esc(error)}</p>` : ''}
      <button class="btn btn-primary btn-block" type="submit" style="min-height:52px;font-size:16px">Crear cuenta</button>
      <a class="link" href="#/entrar" style="align-self:center">Ya tengo cuenta · Entrar</a>
    </div>
  </form></div>`;
}

// ---------- Inicio ----------
export function homeView({ castings, profile, session }) {
  const st = stats(castings);
  const open = castings.filter((c) => meta(c).group === 'castings');
  const opts = castings.filter((c) => meta(c).group === 'opciones');
  const u = urgent(castings);
  const week = agenda(castings, 7);
  const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const alerts = agenda(castings, 2).length;

  let now = `<div class="note">No tienes nada urgente en las próximas 48 horas.</div>`;
  if (u) {
    const c = u.c;
    const role = (c.roles || []).find((r) => r.id === c.progress?.role);
    const mode = c.progress?.mode || (c.modality?.selftape ? 'selftape' : 'presencial');
    const steps = stepsFor(c, mode, role);
    const done = steps.filter((_, i) => c.progress?.done?.[`${mode}-${role?.id || 'x'}-${i}`]).length;
    now = `<div class="card-action">
      <div class="row between"><span class="pill-dark">${esc(timeLeft(u.at))}</span><span class="small strong">${esc(u.label)} · ${esc(c.agent || '')}</span></div>
      <h3>${esc(c.brand)} — ${esc(u.label.toLowerCase())}</h3>
      <div class="small strong">${esc(fmtDateTime(u.at))}${role ? ` · ${esc(role.name)}` : ''}${steps.length && done ? ` · ${done} de ${steps.length} pasos` : ''}</div>
      ${steps.length && done ? `<div class="progress"><i style="width:${Math.round((done / steps.length) * 100)}%"></i></div>` : ''}
      <a class="btn btn-dark" href="#/casting/${encodeURIComponent(c.id)}" style="margin-top:4px">Seguir con el casting</a>
    </div>`;
  }

  const weekHtml = week.length ? week.map((e) => {
    const b = dateBox(e.at);
    return `<a class="item" href="#/casting/${encodeURIComponent(e.c.id)}">
      <span class="date-box"><small>${b.dow}</small><b>${b.day}</b></span>
      <span class="item-body"><b>${esc(e.label)} · ${esc(e.c.brand)}</b><span>${esc(fmtTime(e.at))}${e.c.presencial?.place && e.label !== 'Rodaje' && !e.label.startsWith('Deadline') ? ` · ${esc(e.c.presencial.place)}` : ''}${e.c.fee ? ` · ${euro(e.c.fee)}` : ''}</span></span>
      ${chip(e.c)}
    </a>`;
  }).join('') : `<div class="empty">Nada en agenda esta semana.</div>`;

  const fresh = castings.filter((c) => c.status === 'casting' && isIso(c.received) && Date.now() - new Date(c.received) < 3 * 86400000);

  return shell(`
    <header class="hero"><div class="wrap">
      <div class="hero-top">
        <a class="brand" href="#/">${logo(30)}<span class="brand-word">callback<i>.</i></span></a>
        <a class="icon-btn" href="#/propuestas" aria-label="Avisos: ${alerts}">${icon('bell', 20)}${alerts ? `<span class="badge">${alerts}</span>` : ''}</a>
      </div>
      <div><div class="sub" style="text-transform:capitalize">${esc(today)}</div><h1>Hola, ${esc(firstName(profile, session))}</h1></div>
      <div class="grid-3">
        <div class="kpi"><b>${open.length}</b><span>castings abiertos</span></div>
        <div class="kpi"><b>${opts.length}</b><span>opciones</span></div>
        <div class="kpi"><b>${euro(st.money.porCobrar)}</b><span>por cobrar</span></div>
      </div>
    </div></header>
    <div class="wrap">
      <div class="cols">
        <section class="section stack"><h2 class="label coral">Ahora</h2>${now}
          ${fresh.length ? `<h2 class="label" style="margin-top:8px">Recién llegados</h2><div class="list">${fresh.map(itemRow).join('')}</div>` : ''}
        </section>
        <section class="section stack">
          <div class="row between"><h2 class="label">Esta semana</h2><a class="link" href="#/propuestas">Ver todo</a></div>
          <div class="list">${weekHtml}</div>
        </section>
      </div>
    </div>`, 'inicio');
}

function itemRow(c) {
  const ev = nextEvent(c);
  const sub = ev ? `${ev.label} · ${fmtDateTime(ev.at)}` : (c.project || c.agent || '');
  return `<a class="item" href="#/casting/${encodeURIComponent(c.id)}">
    <span class="avatar">${esc(initials(c.brand))}</span>
    <span class="item-body"><b>${esc(c.brand)}</b><span>${esc(sub)}</span></span>
    <span class="item-end">${chip(c)}<span class="small strong">${c.fee ? euro(c.fee) : '—'}</span></span>
  </a>`;
}

// ---------- Propuestas ----------
export function listView({ castings, ui }) {
  const q = (ui.query || '').toLowerCase();
  const list = castings
    .filter((c) => ui.filter === 'todas' || meta(c).group === ui.filter)
    .filter((c) => !q || `${c.brand} ${c.project} ${c.agent}`.toLowerCase().includes(q))
    .sort((a, b) => {
      const ea = nextEvent(a), eb = nextEvent(b);
      if (ea && eb) return new Date(ea.at) - new Date(eb.at);
      if (ea) return -1; if (eb) return 1;
      return new Date(b.received || 0) - new Date(a.received || 0);
    });
  return shell(`
    <header class="hero"><div class="wrap">
      <div class="hero-top"><h1>Propuestas</h1><a class="icon-btn" href="#/nuevo" aria-label="Añadir casting" style="background:var(--lime);color:var(--ink)">${icon('plus', 20, 'currentColor', 2.4)}</a></div>
      <div class="sub">${castings.length} casos · ${castings.filter((c) => meta(c).group === 'castings').length} castings abiertos</div>
    </div></header>
    <div class="wrap">
      <div class="section stack">
        <label class="field-card row" style="flex-direction:row;align-items:center;gap:8px;min-height:48px">${icon('search', 18, 'var(--muted)')}<span class="sr-only">Buscar</span>
          <input type="search" placeholder="Buscar marca, proyecto o agente" value="${esc(ui.query || '')}" data-input="query"></label>
        <div class="filters" role="group" aria-label="Filtrar">
          ${GROUPS.map(([k, l]) => `<button class="filter" aria-pressed="${ui.filter === k}" data-act="filter" data-v="${k}">${l}</button>`).join('')}
        </div>
        <div class="list two">${list.length ? list.map(itemRow).join('') : '<div class="empty">No hay casos con este filtro.</div>'}</div>
      </div>
    </div>`, 'propuestas');
}

// ---------- Ficha de casting ----------
export function castingView({ c, profile, ui }) {
  if (!c) return shell(`<div class="wrap section"><div class="empty">No encontramos este casting. <a href="#/propuestas">Volver</a></div></div>`, 'propuestas');
  const m = meta(c);
  const roles = c.roles || [];
  const withFit = roles.map((r) => ({ r, f: fit(r, profile) }));
  const fits = withFit.filter((x) => x.f.ok);
  const onlyFit = ui.onlyFit !== false && fits.length > 0;
  const shown = onlyFit ? fits : withFit;
  const prog = c.progress || {};
  const pickedId = prog.role || fits[0]?.r.id || roles[0]?.id;
  const role = roles.find((r) => r.id === pickedId);
  const canSelf = !!c.modality?.selftape, canPres = !!c.modality?.presencial;
  const mode = prog.mode && ((prog.mode === 'selftape' && canSelf) || (prog.mode === 'presencial' && canPres)) ? prog.mode : (canSelf ? 'selftape' : 'presencial');
  const steps = (canSelf || canPres) ? stepsFor(c, mode, role) : [];
  const key = (i) => `${mode}-${role?.id || 'x'}-${i}`;
  const doneCount = steps.filter((_, i) => prog.done?.[key(i)]).length;
  const nextIdx = steps.findIndex((_, i) => !prog.done?.[key(i)]);
  const deadlineSoon = c.deadline && new Date(c.deadline) > new Date() && new Date(c.deadline) - new Date() < 3 * 86400000;
  const mods = [canPres && 'Presencial', canSelf && 'Selftape'].filter(Boolean);

  const dates = [];
  if (c.deadline) dates.push([c.deadlineLabel || 'Deadline selftape', isIso(c.deadline) ? fmtDateTime(c.deadline) : c.deadline, deadlineSoon]);
  if (c.presencial?.at) dates.push([c.status === 'callback' ? 'Callback' : 'Casting presencial', fmtDateTime(c.presencial.at), false]);
  if (c.shooting || c.shootingAt) dates.push(['Rodaje', [c.shootingAt && fmtDateTime(c.shootingAt), c.shooting].filter(Boolean).join(' · '), false]);
  if (c.paymentDue) dates.push(['Cobro previsto', fmtDay(c.paymentDue), false]);
  const cond = c.conditions || {};
  const condRows = [['Medios', cond.medios], ['Territorio', cond.territorio], ['Duración', cond.duracion], ['Exclusividad', cond.exclusividad], ['Gastos', cond.gastos]].filter(([, v]) => v);

  const top = `
    <div class="stepper">${STAGES.map((s, i) => `<div class="${i <= m.stage ? 'on' : ''}"><i></i>${s}</div>`).join('')}</div>
    <div class="card-violet fee"><div class="stack" style="gap:2px"><span class="small muted">Tarifa (brutos)</span><b>${euro(c.fee)}</b></div><span class="small muted" style="text-align:right">${esc(c.feeNote || '')}</span></div>
    ${c.alert ? `<div class="alert">${icon('alert', 20, 'currentColor')}<span>${esc(c.alert)}</span></div>` : ''}
    ${dates.length ? `<div class="stack" style="gap:8px"><h2 class="label">Fechas</h2><div class="card" style="padding:0">${dates.map(([k, v, hot]) => `<div class="kv"><span><i class="dot${hot ? ' hot' : ''}"></i>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div></div>` : ''}
`;
  const left = `
    ${condRows.length ? `<div class="stack" style="gap:8px"><h2 class="label">Condiciones</h2><div class="grid-2">${condRows.map(([k, v]) => `<div class="tile"><small>${k}</small><b>${esc(v)}</b></div>`).join('')}</div></div>` : ''}
    ${c.files?.length ? `<div class="stack" style="gap:8px"><h2 class="label">Adjuntos del email</h2>${c.files.map((f) => `<div class="card row small strong" style="padding:10px 12px"><span class="chip chip-urg" style="border-radius:4px;font-size:10px">PDF</span>${esc(f)}</div>`).join('')}</div>` : ''}
    <div class="card stack">
      <label class="field">Estado
        <select class="select" data-input="status">${STATUS_ORDER.map((s) => `<option value="${s}"${s === c.status ? ' selected' : ''}>${STATUS[s].label}</option>`).join('')}</select>
      </label>
      <div class="row wrap-row">
        <button class="btn btn-ghost" data-act="ics">${icon('cal', 18)}Añadir al calendario</button>
        <a class="btn btn-ghost" href="#/editar/${encodeURIComponent(c.id)}">Editar</a>
        <button class="btn btn-ghost" data-act="delete" style="color:var(--coral-ink)">Eliminar</button>
      </div>
    </div>`;

  const rolesHtml = roles.length ? `
    <div class="stack" style="gap:8px">
      <div class="row between"><h2 class="label">Roles ofrecidos</h2><span class="small muted">${fits.length} de ${roles.length} encajan</span></div>
      ${c.description ? `<p class="small muted" style="margin:0">${esc(c.description)}</p>` : ''}
      ${fits.length && fits.length < roles.length ? `<div class="filters"><button class="filter" aria-pressed="${onlyFit}" data-act="onlyfit" data-v="1">Encajan con mi perfil</button><button class="filter" aria-pressed="${!onlyFit}" data-act="onlyfit" data-v="0">Todos</button></div>` : ''}
      ${shown.map(({ r, f }) => `<button class="role${f.ok ? '' : ' nofit'}" aria-pressed="${r.id === pickedId}" data-act="role" data-v="${esc(r.id)}">
        <span class="radio"></span>
        <span class="stack" style="gap:3px;flex:1;min-width:0">
          <span class="row between" style="align-items:flex-start"><b style="font-size:14px">${esc(r.name)}</b>${r.type ? `<span class="type type-${esc(r.type)}">${r.type === 'MANOS' ? 'Manos' : esc(r.type)}</span>` : ''}</span>
          <span class="small muted">${esc(roleSpec(r))}</span>
          <span class="fit">${esc(f.reason)}</span>
        </span></button>`).join('')}
      <a class="link" href="#/perfil">Editar mi perfil</a>
    </div>` : (c.description ? `<p class="small muted">${esc(c.description)}</p>` : '');

  let castingHtml = '';
  if (canSelf || canPres) {
    const pres = c.presencial || {};
    castingHtml = `
    <div class="stack" style="gap:10px">
      <h2 class="h2">Tu casting${role ? ` · ${esc(role.name)}` : ''}</h2>
      <div class="seg" role="group" aria-label="Modalidad">
        <button aria-pressed="${mode === 'selftape'}" data-act="mode" data-v="selftape"${canSelf ? '' : ' disabled title="Esta convocatoria no admite selftape"'}>Selftape</button>
        <button aria-pressed="${mode === 'presencial'}" data-act="mode" data-v="presencial"${canPres ? '' : ' disabled title="Esta convocatoria no tiene casting presencial"'}>Presencial</button>
      </div>
      ${mode === 'presencial' ? `<div class="card stack" style="gap:6px">
        <div class="row between"><b>${pres.at ? esc(fmtDateTime(pres.at)) : 'Fecha por confirmar'}</b><span class="chip ${doneCount >= 5 ? 'chip-ok' : doneCount >= 1 ? 'chip-opt' : 'chip-urg'}">${PRES_STATUS[doneCount] || 'Hecho'}</span></div>
        ${pres.place ? `<span class="small row" style="color:var(--neutral-ink)">${icon('pin', 16)}${esc(pres.place)}</span>` : ''}
        ${pres.place ? `<a class="link" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pres.place)}">Cómo llegar</a>` : ''}
      </div>` : ''}
      <div class="stack" style="gap:6px">
        <div class="row between small"><span class="muted">${mode === 'selftape' ? (c.deadline ? `Selftape · ${esc(timeLeft(c.deadline).toLowerCase())}` : 'Selftape') : 'Día del casting'}</span><b>${doneCount} de ${steps.length}</b></div>
        <div class="progress"><i style="width:${steps.length ? Math.round((doneCount / steps.length) * 100) : 0}%"></i></div>
      </div>
      <div class="stack" style="gap:8px">
        ${steps.map((s, i) => {
          const d = !!prog.done?.[key(i)];
          return `<button class="step${d ? ' done' : ''}${i === nextIdx ? ' next' : ''}" aria-pressed="${d}" data-act="step" data-v="${key(i)}">
            <span class="step-n">${d ? icon('check', 14, '#FFF', 3) : i + 1}</span>
            <span class="stack" style="gap:3px;flex:1;min-width:0"><span class="row between"><span class="step-title">${esc(s.title)}</span><span class="tiny muted strong">${esc(s.tag || '')}</span></span>
            ${s.detail ? `<span class="step-detail">${esc(s.detail)}</span>` : ''}</span></button>`;
        }).join('')}
      </div>
      ${mode === 'selftape' ? '<div class="note">Graba en horizontal, luz de frente y fondo liso.</div>' : ''}
      <label class="field">Notas del casting<textarea class="textarea" data-input="notes" placeholder="Qué te pidieron, quién estaba, feedback…">${esc(prog.notes || '')}</textarea></label>
    </div>`;
  }

  return shell(`
    <header class="hero"><div class="wrap">
      <div class="hero-top"><a class="icon-btn" href="#/propuestas" aria-label="Volver a propuestas">${icon('back', 20)}</a>
        <span class="sub row">${icon('mail', 14)}${esc(c.agent || 'Agencia')}${isIso(c.received) ? ` · ${esc(fmtDay(c.received))}` : ''}</span></div>
      <div><h1>${esc(c.brand)}</h1><div class="sub">${esc(c.project || '')}</div></div>
      <div class="row wrap-row">
        ${deadlineSoon ? `<span class="chip urgent">${esc(timeLeft(c.deadline))}</span>` : ''}
        ${mods.length ? `<span class="chip">Modalidad: ${mods.join(' o ')}</span>` : ''}
        <span class="chip on-light">${esc(m.label)}</span>
      </div>
    </div></header>
    <div class="wrap"><div class="cols brief section">
      <div class="stack a1" style="gap:16px">${top}</div>
      <div class="stack b" style="gap:16px">${rolesHtml}${castingHtml}</div>
      <div class="stack a2" style="gap:16px">${left}</div>
    </div></div>`, 'propuestas');
}

// ---------- Panel ----------
export function panelView({ castings }) {
  const st = stats(castings);
  const max = Math.max(1, st.total);
  const byAgent = {};
  castings.forEach((c) => { const a = c.agent || 'Sin agente'; byAgent[a] = byAgent[a] || { n: 0, ok: 0 }; byAgent[a].n++; if (meta(c).stage >= 2 && c.status !== 'liberada') byAgent[a].ok++; });
  return shell(`
    <header class="hero"><div class="wrap">
      <div><div class="sub">Todo tu historial</div><h1>Tu temporada</h1></div>
      <div class="grid-2">
        <div class="kpi"><b>${st.conversion} %</b><span>casting → trabajo (${st.confirmed} de ${st.total})</span></div>
        <div class="kpi"><b>${euro(st.closedIncome)}</b><span>ingresos cerrados (brutos)</span></div>
      </div>
    </div></header>
    <div class="wrap"><div class="cols">
      <section class="section stack">
        <h2 class="label">Embudo</h2>
        ${st.funnel.map(([l, n, color]) => `<div class="stack" style="gap:4px"><div class="row between small"><span class="strong">${l}</span><span><b>${n}</b> <span class="muted">· ${Math.round((n / max) * 100)} %</span></span></div><div class="bar"><i style="width:${Math.round((n / max) * 100)}%;background:${color}"></i></div></div>`).join('')}
      </section>
      <section class="section stack">
        <h2 class="label mint">Dinero</h2>
        <div class="grid-2">
          <div class="money" style="background:var(--mint-soft);color:var(--mint-ink)"><small>Cobrado</small><b>${euro(st.money.cobrado)}</b></div>
          <div class="money" style="background:var(--sand-soft);color:var(--sand-ink)"><small>Por cobrar</small><b>${euro(st.money.porCobrar)}</b></div>
          <div class="money card"><small class="muted">Confirmado</small><b>${euro(st.money.confirmado)}</b></div>
          <div class="money" style="background:var(--violet-soft);color:var(--violet-ink)"><small>En opción</small><b>${euro(st.money.opcion)}</b></div>
        </div>
        <h2 class="label" style="margin-top:8px">Por agente</h2>
        <div class="card" style="padding:0">${Object.entries(byAgent).sort((a, b) => b[1].n - a[1].n).map(([a, v]) => `<div class="kv"><span>${esc(a)}</span><b>${v.n} ${v.n === 1 ? 'casting' : 'castings'} · ${v.ok} ${v.ok === 1 ? 'trabajo' : 'trabajos'}</b></div>`).join('')}</div>
      </section>
    </div></div>`, 'panel');
}

// ---------- Perfil ----------
export function profileView({ profile: p, castings, session }) {
  const open = castings.filter((c) => meta(c).group === 'castings');
  const roles = open.flatMap((c) => c.roles || []);
  const fits = roles.filter((r) => fit(r, p).ok).length;
  const types = p.types || {};
  const skills = p.skills || [];
  const sw = (k, label, sub) => `<button class="switch-row" role="switch" aria-checked="${!!p[k]}" data-act="toggle" data-v="${k}"><span class="stack" style="gap:2px"><b style="font-size:14px">${label}</b><span class="small muted">${sub}</span></span><span class="switch"><i></i></span></button>`;
  const inbound = CONFIG.INBOUND_ADDRESS;
  return shell(`
    <header class="hero"><div class="wrap">
      <div class="row" style="gap:14px">
        <span class="avatar" style="width:56px;height:56px;border-radius:28px;background:rgba(255,255,255,.18);color:#FFF;font-size:18px">${esc(initials(p.name || session?.email))}</span>
        <div class="stack" style="gap:2px"><h1 style="font-size:20px">${esc(p.name || 'Tu perfil')}</h1>
          <span class="sub">${esc([p.agency, p.city].filter(Boolean).join(' · ') || session?.email || '')}</span>
          <span class="small strong" style="color:var(--lime)">Encajas en ${fits} de ${roles.length} roles abiertos</span></div>
      </div>
    </div></header>
    <div class="wrap"><div class="cols">
      <div>
        <section class="section stack">
          <h2 class="label">Tus datos</h2>
          <div class="grid-2">
            <label class="field-card" style="grid-column:1/-1">Nombre<input data-input="p.name" value="${esc(p.name || '')}"></label>
            <label class="field-card">Agencia<input data-input="p.agency" value="${esc(p.agency || '')}"></label>
            <label class="field-card">Ciudad base<input data-input="p.city" value="${esc(p.city || '')}"></label>
          </div>
        </section>
        <section class="section stack">
          <h2 class="label">Cómo te ven en cámara</h2>
          <div class="grid-2">
            <label class="field-card">Edad de juego desde<input type="number" inputmode="numeric" data-input="p.ageMin" value="${esc(p.ageMin ?? '')}"></label>
            <label class="field-card">hasta<input type="number" inputmode="numeric" data-input="p.ageMax" value="${esc(p.ageMax ?? '')}"></label>
            <label class="field-card">Género<select data-input="p.gender">${[['H', 'Hombre'], ['M', 'Mujer'], ['X', 'No binario / otro']].map(([v, l]) => `<option value="${v}"${p.gender === v ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
            <label class="field-card">Altura<input data-input="p.height" value="${esc(p.height || '')}"></label>
            <label class="field-card" style="grid-column:1/-1">Look (como lo describen las convocatorias)<input data-input="p.look" value="${esc(p.look || '')}"></label>
          </div>
        </section>
      </div>
      <div>
        <section class="section stack">
          <h2 class="label">Tipos de rol que aceptas</h2>
          <div class="filters">${Object.entries(TYPES).map(([k, l]) => `<button class="filter${types[k] === false ? ' off' : ''}" aria-pressed="${types[k] !== false}" data-act="ptype" data-v="${k}">${l}</button>`).join('')}</div>
        </section>
        <section class="section stack">
          <h2 class="label">Idiomas y habilidades</h2>
          <div class="filters">${SKILLS.map((s) => `<button class="filter${skills.includes(s) ? '' : ' off'}" aria-pressed="${skills.includes(s)}" data-act="pskill" data-v="${esc(s)}">${esc(s)}</button>`).join('')}</div>
        </section>
        <section class="section stack">
          <h2 class="label">Dónde y cuánto</h2>
          <div class="card" style="padding:0">
            ${sw('travel', 'Disponible para viajar', 'España y extranjero')}
            ${sw('eatsAll', 'Puedo comer carne y frutos secos', 'Algunas convocatorias lo exigen')}
          </div>
          <label class="field-card">Tarifa mínima que te interesa (€)<input type="number" inputmode="numeric" data-input="p.minFee" value="${esc(p.minFee ?? '')}"></label>
        </section>
        <section class="section stack">
          <h2 class="label">Cuenta</h2>
          ${inbound ? `<div class="card small">Reenvía los emails de tu agencia a <b>${esc(inbound)}</b> desde <b>${esc(session?.email || '')}</b>.</div>` : ''}
          ${isDemo ? '<button class="btn btn-ghost" data-act="resetdemo">Restablecer datos de ejemplo</button>' : ''}
          <button class="btn btn-ghost" data-act="logout">${icon('logout', 18)}Cerrar sesión</button>
        </section>
      </div>
    </div></div>`, 'perfil');
}

// ---------- Añadir / editar ----------
export function addView({ ui, session }) {
  const inbound = CONFIG.INBOUND_ADDRESS;
  return shell(`
    <header class="hero"><div class="wrap">
      <div class="hero-top"><a class="icon-btn" href="#/propuestas" aria-label="Volver">${icon('back', 20)}</a><span class="sub">Tres formas de cargar una convocatoria</span></div>
      <h1>Añadir casting</h1>
    </div></header>
    <div class="wrap"><div class="cols">
      <div class="section stack">
        <div class="card-violet stack" style="gap:8px">
          <div class="row between"><b>1 · Reenvía los emails</b><span class="chip" style="background:var(--lime);color:var(--ink)">RECOMENDADO</span></div>
          ${inbound ? `<span class="small muted">Reenvía aquí los emails de tu agencia desde <b style="color:#FFF">${esc(session?.email || 'tu email')}</b> y se cargarán solos. Mejor aún: crea un filtro en Gmail para que se reenvíen automáticamente.</span>
          <div class="row" style="background:rgba(0,0,0,.18);border-radius:10px;padding:8px 8px 8px 12px"><code style="flex:1;font-size:14px;font-weight:600;overflow-wrap:anywhere">${esc(inbound)}</code><button class="btn btn-ghost" style="min-height:36px" data-act="copy" data-v="${esc(inbound)}">Copiar</button></div>`
          : `<span class="small muted">${isDemo ? 'En la demo no está activo. Cuando conectemos el servidor tendrás una dirección a la que reenviar los emails de tu agencia y se cargarán solos.' : 'Todavía no hay dirección de reenvío configurada.'}</span>`}
        </div>
        <form class="card stack" data-form="paste">
          <b>2 · Pega el email de la convocatoria</b>
          <span class="small muted">Copia el texto del email (asunto incluido si puedes) y pégalo aquí.</span>
          <label class="sr-only" for="paste">Texto de la convocatoria</label>
          <textarea class="textarea" id="paste" name="text" placeholder="Hola equipo, os dejo casting para…" required>${esc(ui.pasteText || '')}</textarea>
          <button class="btn btn-primary" type="submit"${ui.busy ? ' disabled' : ''}>${ui.busy ? 'Leyendo…' : 'Leer convocatoria'}</button>
        </form>
        <div class="card stack">
          <b>3 · Sube el PDF</b>
          <span class="small muted">Casting call, brief o instrucciones.${isDemo ? ' (Disponible con el servidor conectado.)' : ''}</span>
          <label class="btn btn-ghost">${icon('upload', 18)}Elegir PDF<input type="file" accept="application/pdf" class="sr-only" data-input="pdf"${isDemo ? ' disabled' : ''}></label>
        </div>
        <a class="link" href="#/editar/nuevo">O rellénalo a mano</a>
        ${ui.error ? `<p class="error" role="alert">${esc(ui.error)}</p>` : ''}
      </div>
      <div class="section stack">
        <div class="note">Callback lee la convocatoria y te muestra lo que ha entendido para que lo revises antes de guardarlo: marca, modalidad, fechas, roles, tarifa y condiciones.</div>
      </div>
    </div></div>`, 'propuestas');
}

export function editView({ draft, isNew }) {
  const d = draft || {};
  const cond = d.conditions || {};
  const toLocal = (iso) => { if (!isIso(iso)) return ''; const x = new Date(iso); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 16); };
  const f = (name, label, value, type = 'text', extra = '') => `<label class="field-card">${label}<input name="${name}" type="${type}" value="${esc(value ?? '')}" ${extra}></label>`;
  const missing = [];
  if (!d.brand) missing.push('marca');
  if (!d.deadline && !d.presencial?.at && (d.modality?.selftape || d.modality?.presencial)) missing.push('fechas');
  if (d.fee == null || d.fee === '') missing.push('tarifa');
  return shell(`
    <header class="hero"><div class="wrap">
      <div class="hero-top"><a class="icon-btn" href="${isNew ? '#/nuevo' : `#/casting/${encodeURIComponent(d.id)}`}" aria-label="Volver">${icon('back', 20)}</a><span class="sub">${isNew ? 'Revisa y guarda' : 'Editar'}</span></div>
      <h1>${isNew ? 'Esto es lo que hemos entendido' : esc(d.brand || 'Editar casting')}</h1>
    </div></header>
    <div class="wrap">
      <form class="section stack" data-form="edit">
        ${missing.length ? `<div class="alert">${icon('alert', 20, 'currentColor')}<span>Revisa: falta ${missing.join(', ')}.</span></div>` : ''}
        <div class="cols">
          <div class="stack">
            <h2 class="label">Lo básico</h2>
            <div class="grid-2">
              ${f('brand', 'Marca', d.brand, 'text', 'required')}
              ${f('agent', 'Agente', d.agent)}
              <div style="grid-column:1/-1">${f('project', 'Proyecto / productora', d.project)}</div>
              <label class="field-card">Estado<select name="status">${STATUS_ORDER.map((s) => `<option value="${s}"${s === (d.status || 'casting') ? ' selected' : ''}>${STATUS[s].label}</option>`).join('')}</select></label>
              ${f('fee', 'Tarifa (€ brutos)', d.fee, 'number', 'inputmode="numeric"')}
              <div style="grid-column:1/-1">${f('feeNote', 'Detalle de la tarifa', d.feeNote)}</div>
            </div>
            <h2 class="label">Modalidad y fechas</h2>
            <div class="filters">
              <label class="filter row"><input type="checkbox" name="selftape"${d.modality?.selftape ? ' checked' : ''}> Selftape</label>
              <label class="filter row"><input type="checkbox" name="presencial"${d.modality?.presencial ? ' checked' : ''}> Presencial</label>
            </div>
            <div class="grid-2">
              ${f('deadline', 'Deadline', toLocal(d.deadline), 'datetime-local')}
              ${f('presAt', 'Casting presencial', toLocal(d.presencial?.at), 'datetime-local')}
              <div style="grid-column:1/-1">${f('presPlace', 'Lugar del casting presencial', d.presencial?.place)}</div>
              ${f('shootingAt', 'Día de rodaje', toLocal(d.shootingAt), 'datetime-local')}
              ${f('shooting', 'Rodaje (texto)', d.shooting)}
            </div>
          </div>
          <div class="stack">
            <h2 class="label">Condiciones</h2>
            <div class="grid-2">
              ${f('medios', 'Medios', cond.medios)}${f('territorio', 'Territorio', cond.territorio)}
              ${f('duracion', 'Duración', cond.duracion)}${f('exclusividad', 'Exclusividad', cond.exclusividad)}
              <div style="grid-column:1/-1">${f('gastos', 'Gastos', cond.gastos)}</div>
            </div>
            <label class="field">Descripción<textarea class="textarea" name="description" style="min-height:90px">${esc(d.description || '')}</textarea></label>
            <h2 class="label">Roles (${(d.roles || []).length})</h2>
            ${(d.roles || []).map((r, i) => `<div class="item"><span class="item-body"><b>${esc(r.name)}</b><span>${esc([r.type, roleSpec(r)].filter(Boolean).join(' · '))}</span></span><button type="button" class="link" data-act="delrole" data-v="${i}">Quitar</button></div>`).join('') || '<p class="small muted" style="margin:0">Sin roles. Añade al menos el tuyo para ver si encaja con tu perfil.</p>'}
            <details class="card"><summary class="strong" style="cursor:pointer">Añadir rol</summary>
              <div class="grid-2" style="margin-top:10px">
                <div style="grid-column:1/-1">${f('rName', 'Nombre del rol', '')}</div>
                <label class="field-card">Tipo<select name="rType">${Object.entries(TYPES).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></label>
                <label class="field-card">Género<select name="rGender"><option value="H">Hombre</option><option value="M">Mujer</option><option value="X">Todos</option></select></label>
                ${f('rMin', 'Edad desde', '', 'number')}${f('rMax', 'hasta', '', 'number')}
              </div>
              <button type="button" class="btn btn-ghost" data-act="addrole" style="margin-top:10px">Añadir este rol</button>
            </details>
          </div>
        </div>
        <button class="btn btn-action btn-block" type="submit" style="min-height:54px;font-size:15px">Guardar</button>
      </form>
    </div>`, 'propuestas');
}
