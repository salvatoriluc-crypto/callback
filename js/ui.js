// Piezas de interfaz compartidas.
import { isDemo } from './store.js';

export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

export function logo(size = 30, label = '') {
  const a = label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true"';
  return `<svg class="logo" width="${size}" height="${size}" viewBox="0 0 64 64" ${a}><rect width="64" height="64" rx="18" fill="#FFFFFF"/><path d="M20 30 A14 14 0 0 1 34 44" stroke="#5B4BE0" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M20 18 A26 26 0 0 1 46 44" stroke="#FF6B6B" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="20" cy="44" r="6" fill="#5B4BE0"/></svg>`;
}
export function logoViolet(size = 30, label = '') {
  const a = label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true"';
  return `<svg class="logo" width="${size}" height="${size}" viewBox="0 0 64 64" ${a}><rect width="64" height="64" rx="18" fill="#5B4BE0"/><path d="M20 30 A14 14 0 0 1 34 44" stroke="#C6FF3D" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M20 18 A26 26 0 0 1 46 44" stroke="#FFFFFF" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="20" cy="44" r="6" fill="#C6FF3D"/></svg>`;
}

const ICON_PATHS = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  logout: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>'
};
export function icon(name, size = 20, color = 'currentColor', width = 2) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ''}</svg>`;
}

const NAV = [['inicio', '#/', 'home', 'Inicio'], ['propuestas', '#/propuestas', 'list', 'Propuestas'], ['panel', '#/panel', 'chart', 'Panel'], ['perfil', '#/perfil', 'user', 'Perfil']];

export function shell(content, active) {
  const cur = (k) => (k === active ? ' aria-current="page"' : '');
  return `
  ${isDemo ? '<div class="demo-banner">Modo demo · los datos son de ejemplo y se guardan solo en este navegador</div>' : ''}
  <div class="shell">
    <aside class="side" aria-label="Menú">
      <a class="brand" href="#/">${logoViolet(30)}<span class="brand-word">callback<i style="color:var(--violet)">.</i></span></a>
      ${NAV.map(([k, href, ic, label]) => `<a class="side-link" href="${href}"${cur(k)}>${icon(ic, 20)}${label}</a>`).join('')}
      <div class="side-foot">
        <a class="btn btn-action" href="#/nuevo">${icon('plus', 18)}Añadir casting</a>
      </div>
    </aside>
    <main class="main" id="main">${content}</main>
  </div>
  <nav class="nav" aria-label="Menú">
    ${NAV.map(([k, href, ic, label]) => `<a href="${href}"${cur(k)} aria-label="${label}">${icon(ic, k === active ? 20 : 22)}<span class="nav-text">${label}</span></a>`).join('')}
  </nav>`;
}

export function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 2600);
}

export function download(name, text, type = 'text/calendar') {
  const blob = new Blob([text], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

export function initials(s) {
  const words = String(s || '?').replace(/['’]/g, '').replace(/[^\p{L}\p{N} ]/gu, ' ').trim().split(/\s+/);
  return (words.length > 1 ? words[0][0] + words[1][0] : (words[0] || '?').slice(0, 2)).toUpperCase();
}
