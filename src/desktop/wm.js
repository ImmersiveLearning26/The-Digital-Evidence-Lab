// Window registry. A closed window keeps its app's state, so reopening picks up where it was.
import {app} from '../runtime.js';
import {clamp, esc, morph, reducedMotion} from './dom.js';

export const apps = {};
export const floats = new Map();
export const registerApp = meta => { apps[meta.id] = meta; if (meta.actions) app.register(meta.actions, meta.inputs); };
const elements = new Map();
const TASKBAR = 48;
// The open chat panel takes the right of the screen; windows use the space left of it.
export const DOCK = 384;
const area = () => ({w: innerWidth - (app.ui.dock?.open ? DOCK : 0), h: innerHeight - TASKBAR});
// Opening the panel moves any window that would sit under it over to the left, shrinking it if it must.
export function reflowForDock() {
  const {w: W} = area();
  for (const w of app.ui.windows) {
    if (w.max) continue;
    if (w.w > W) w.w = W;
    if (w.x + w.w > W) w.x = Math.max(0, W - w.w);
  }
}

export const win = id => app.ui.windows.find(w => w.id === id);
export const isOpen = id => !!win(id);
export const isVisible = id => { const w = win(id); return !!w && !w.min; };

function rectFor(meta) {
  const {w, h} = area();
  const r = w < 1000 ? {x: 0, y: 0, w: 1, h: 1} : meta.rect ?? {};
  const x = Math.round((r.x ?? .06) * w), y = Math.round((r.y ?? .03) * h);
  return {x, y, w: Math.round(Math.min((r.w ?? .74) * w, w - x)), h: Math.round(Math.min((r.h ?? .9) * h, h - y))};
}
export function openWindow(id) {
  const meta = apps[id];
  let w = win(id);
  if (!w) {
    const saved = app.ui.rects?.[id];
    w = {id, ...(saved ?? rectFor(meta)), z: ++app.ui.z, min: false, max: false};
    app.ui.windows.push(w);
  }
  w.min = false;
  focusWindow(id);
  return w;
}
export function focusWindow(id) {
  const w = win(id);
  if (!w) return;
  w.min = false;
  w.z = ++app.ui.z;
  app.ui.active = id;
  app.ui.start = false; app.ui.quick = false;
  if (id === 'browser' && app.ui.browser.active === 'chat') app.ui.unread = 0;
  app.persist(); app.render();
}
export function minimise(id) {
  const w = win(id);
  if (!w) return;
  w.min = true;
  if (app.ui.active === id) app.ui.active = topWindow()?.id ?? null;
  app.persist(); app.render();
}
export const topWindow = () => app.ui.windows.filter(w => !w.min).sort((a, b) => b.z - a.z)[0];
export function closeWindow(id) {
  for (const f of [...floats.values()]) if (f.owner === id) f.close();
  apps[id]?.beforeClose?.();
  const w = win(id);
  if (!w) return;
  (app.ui.rects ??= {})[id] = {x: w.x, y: w.y, w: w.w, h: w.h};
  app.ui.windows = app.ui.windows.filter(x => x.id !== id);
  const el = elements.get(id);
  if (el) { apps[id]?.unmount?.(el); el.remove(); elements.delete(id); }
  if (app.ui.active === id) app.ui.active = topWindow()?.id ?? null;
  app.persist(); app.render();
}
export function toggleMax(id) {
  const w = win(id);
  if (w) { w.max = !w.max; focusWindow(id); }
}
// Show desktop: minimise everything; pressing it again brings the same windows back.
export function toggleDesktop() {
  const open = app.ui.windows.filter(w => !w.min);
  if (open.length) {
    app.ui.peek = open.map(w => w.id);
    open.forEach(w => { w.min = true; });
    app.ui.active = null;
  } else {
    for (const id of app.ui.peek ?? []) { const w = win(id); if (w) w.min = false; }
    app.ui.active = topWindow()?.id ?? null;
    app.ui.peek = null;
  }
  app.persist(); app.render();
}
export function cycleWindows() {
  const list = [...app.ui.windows].sort((a, b) => a.z - b.z);
  if (list.length) focusWindow(list[0].id);
}

function controls(id) {
  return `<div class="win-ctl"><button data-action="win:min" data-win="${id}" aria-label="Minimise"><i class="g-min"></i></button><button data-action="win:max" data-win="${id}" aria-label="Maximise"><i class="g-max"></i></button><button class="x" data-action="win:close" data-win="${id}" aria-label="Close"><i class="g-x"></i></button></div>`;
}
export function titleBar(id, html) { return `<div class="win-head">${html}</div>${controls(id)}`; }

function mount(w) {
  const meta = apps[w.id];
  const el = document.createElement('section');
  el.className = `win win-${w.id} opening`;
  el.dataset.win = w.id;
  el.setAttribute('role', 'region');
  el.setAttribute('aria-label', meta.title);
  el.innerHTML = `<header class="win-title" data-drag></header><div class="win-body"></div>${['n', 'e', 's', 'w', 'ne', 'nw', 'se', 'sw'].map(d => `<i class="rs rs-${d}" data-resize="${d}"></i>`).join('')}`;
  document.getElementById('windows').append(el);
  elements.set(w.id, el);
  setTimeout(() => el.classList.remove('opening'), reducedMotion() ? 0 : 220);
  meta.mount?.(el.querySelector('.win-body'));
  return el;
}

export function renderWindows() {
  const blocked = new Set();
  for (const [el, f] of floats) {
    const w = win(f.owner);
    if (!w) continue;
    blocked.add(f.owner);
    el.style.zIndex = w.z + 1;
    el.hidden = w.min;
  }
  for (const w of app.ui.windows) {
    const meta = apps[w.id];
    if (!meta) continue;
    const el = elements.get(w.id) ?? mount(w);
    el.style.zIndex = w.z;
    el.classList.toggle('active', app.ui.active === w.id);
    el.classList.toggle('min', w.min);
    el.classList.toggle('max', w.max);
    el.classList.toggle('blocked', blocked.has(w.id));
    if (!w.max) Object.assign(el.style, {left: `${w.x}px`, top: `${w.y}px`, width: `${w.w}px`, height: `${w.h}px`});
    else Object.assign(el.style, {left: 0, top: 0, width: '100%', height: `calc(100% - ${TASKBAR}px)`});
    if (w.min) continue;
    const title = meta.titleHtml ? meta.titleHtml() : `<span class="win-icon">${meta.icon}</span><span class="win-name">${esc(meta.windowTitle?.() ?? meta.title)}</span>`;
    morph(el.querySelector('.win-title'), titleBar(w.id, title));
    const body = el.querySelector('.win-body');
    morph(body, meta.view());
    meta.after?.(body);
  }
}

// Move and resize. Pointer capture keeps a fast drag from losing the window.
export function wireWindows(root) {
  root.addEventListener('pointerdown', ev => {
    const section = ev.target.closest('.win');
    if (section && app.ui.active !== section.dataset.win && !ev.target.closest('.win-ctl')) focusWindow(section.dataset.win);
    const handle = ev.target.closest('[data-resize]');
    const drag = !handle && ev.target.closest('[data-drag]') && !ev.target.closest('button,input,[data-nodrag]');
    if ((!handle && !drag) || !section) return;
    const w = win(section.dataset.win);
    if (!w) return;
    if (w.max) { if (handle) return; }
    ev.preventDefault();
    const start = {px: ev.clientX, py: ev.clientY, x: w.x, y: w.y, w: w.w, h: w.h}, dir = handle?.dataset.resize, {w: W, h: H} = area();
    const MINW = 380, MINH = 240;
    const preview = document.getElementById('snap');
    let snap = null;
    const showSnap = zone => {
      snap = zone;
      preview.hidden = !zone;
      if (zone) Object.assign(preview.style, {left: zone === 'right' ? '50%' : 0, width: zone === 'max' ? '100%' : '50%'});
    };
    const move = e => {
      if (app.ui.paused) return;
      const dx = e.clientX - start.px, dy = e.clientY - start.py;
      if (w.max) { w.max = false; start.y = 0; start.x = Math.max(0, e.clientX - w.w / 2); start.px = e.clientX; start.py = e.clientY; }
      if (!dir && w.restore) { Object.assign(w, {w: w.restore.w, h: w.restore.h}); w.restore = null; start.w = w.w; start.h = w.h; start.x = Math.max(0, e.clientX - w.w / 2); start.y = 0; start.px = e.clientX; start.py = e.clientY; }
      if (!dir) showSnap(e.clientY <= 1 ? 'max' : e.clientX <= 1 ? 'left' : e.clientX >= innerWidth - 2 ? 'right' : null);
      if (!dir) { w.x = clamp(start.x + dx, 60 - w.w, W - 60); w.y = clamp(start.y + dy, 0, H - 40); }
      else {
        if (dir.includes('e')) w.w = clamp(start.w + dx, MINW, W - w.x);
        if (dir.includes('s')) w.h = clamp(start.h + dy, MINH, H - w.y);
        if (dir.includes('w')) { const nw = clamp(start.w - dx, MINW, start.x + start.w); w.x = start.x + start.w - nw; w.w = nw; }
        if (dir.includes('n')) { const nh = clamp(start.h - dy, MINH, start.y + start.h); w.y = start.y + start.h - nh; w.h = nh; }
      }
      const el = elements.get(w.id);
      Object.assign(el.style, {left: `${w.x}px`, top: `${w.y}px`, width: `${w.w}px`, height: `${w.h}px`});
      apps[w.id].onResize?.();
    };
    const up = () => {
      removeEventListener('pointermove', move);
      removeEventListener('pointerup', up);
      preview.hidden = true;
      // Drag to the top to maximise, or to a side to fill half the screen.
      if (snap === 'max') w.max = true;
      else if (snap) { w.restore = {w: w.w, h: w.h}; Object.assign(w, {x: snap === 'right' ? Math.round(W / 2) : 0, y: 0, w: Math.round(W / 2), h: H}); }
      app.persist(); app.render();
    };
    addEventListener('pointermove', move); addEventListener('pointerup', up);
  });
  root.addEventListener('dblclick', ev => { const d = ev.target.closest('[data-drag]'); if (d && !ev.target.closest('button')) { const s = ev.target.closest('.win'); if (s) toggleMax(s.dataset.win); } });
  addEventListener('resize', () => { for (const id of Object.keys(apps)) apps[id].onResize?.(); });
}

app.register({
  'win:min': el => minimise(el.dataset.win),
  'win:max': el => toggleMax(el.dataset.win),
  'win:close': el => closeWindow(el.dataset.win),
});
