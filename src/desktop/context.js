// Right-click menus, as on any Windows desktop.
import {app} from '../runtime.js';
import {esc, morph} from './dom.js';
import {closeWindow, focusWindow, minimise, toggleDesktop, toggleMax, win} from './wm.js';

const menus = {
  desktop: () => [['Show desktop', toggleDesktop], ['Refresh', () => app.render()]],
  window: el => {
    const id = el.closest('.win').dataset.win, w = win(id);
    return [[w.max ? 'Restore' : 'Maximise', () => toggleMax(id)], ['Minimise', () => minimise(id)], null, ['Close', () => closeWindow(id)]];
  },
  task: el => {
    const id = el.dataset.id, w = win(id);
    if (!w) return null;
    return [[w.min ? 'Restore' : 'Bring to front', () => focusWindow(id)], ['Minimise', () => minimise(id)], null, ['Close window', () => closeWindow(id)]];
  },
};
export const registerContext = (name, fn) => { menus[name] = fn; };
let items = [];

function open(ev, list) {
  items = list.filter(Boolean);
  const host = document.getElementById('ctx-host');
  morph(host, `<div class="ctx" role="menu" style="left:${Math.min(ev.clientX, innerWidth - 210)}px;top:${Math.min(ev.clientY, innerHeight - 48 - list.length * 34)}px">${list.map(i => (i ? `<button role="menuitem" data-ctx-i="${items.indexOf(i)}">${esc(i[0])}</button>` : '<hr>')).join('')}</div>`);
}
const close = () => { document.getElementById('ctx-host').innerHTML = ''; };

export function wireContext(root) {
  root.addEventListener('contextmenu', ev => {
    if (ev.target.closest('input,textarea')) return;
    ev.preventDefault();
    if (app.ui.paused) return;
    const t = ev.target.closest('[data-ctx]');
    const name = t?.dataset.ctx ?? (ev.target.closest('.win-title') ? 'window' : ev.target.closest('.win') ? null : 'desktop');
    const list = name && menus[name]?.(t ?? ev.target);
    if (list) open(ev, list); else close();
  });
  root.addEventListener('pointerdown', ev => { if (!ev.target.closest('.ctx')) close(); });
  root.addEventListener('click', ev => {
    const b = ev.target.closest('[data-ctx-i]');
    if (!b) return;
    const fn = items[Number(b.dataset.ctxI)][1];
    close();
    fn();
  });
}
