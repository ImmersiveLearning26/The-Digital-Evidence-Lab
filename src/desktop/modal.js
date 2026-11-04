// Native-style dialogs. Own focus trap, Esc to cancel, and focus returns to whatever opened them.
import {app} from '../runtime.js';
import {esc, morph} from './dom.js';
import {floats, focusWindow, win} from './wm.js';

let depth = 0;
export const dialogOpen = () => depth > 0;

export function modal({title, cls = '', view, state = {}, actions = {}, width = 440, icon = '', closable = true, owner, titlebar = true}) {
  const opener = document.activeElement;
  const ownerId = owner !== undefined ? owner : app.ui.mode === 'desktop' ? app.ui.active : null;
  const attached = ownerId && win(ownerId);
  const back = document.createElement('div');
  back.className = attached ? 'modal-float' : 'modal-back';
  back.innerHTML = `<div class="modal ${cls}" role="dialog" aria-modal="${attached ? 'false' : 'true'}" aria-label="${esc(title)}" style="width:min(${width}px,calc(100vw - 24px))">${titlebar ? `<header class="modal-title">${icon}<span>${esc(title)}</span>${closable ? '<button class="modal-x" data-m="cancel" aria-label="Close dialog"><i class="g-x"></i></button>' : ''}</header>` : ''}<div class="modal-body"></div></div>`;
  document.getElementById(attached ? 'windows' : 'dialogs').append(back);
  depth++;
  const box = back.querySelector('.modal'), body = back.querySelector('.modal-body');
  let settled = false, resolve;
  const api = {
    state,
    update() { morph(body, view(state, api)); },
    close(value = null) {
      if (settled) return;
      settled = true; depth--;
      floats.delete(back);
      back.remove();
      opener?.focus?.();
      app.pump(); app.render();
      resolve(value);
    },
    element: box,
  };
  const run = (name, el, ev) => {
    if (app.ui.paused) return;
    if (name === 'cancel') return api.close(null);
    actions[name]?.(el, ev, api);
  };
  box.addEventListener('click', ev => { const t = ev.target.closest('[data-m]'); if (t) { if (t.disabled) return; run(t.dataset.m, t, ev); } });
  box.addEventListener('dblclick', ev => { const t = ev.target.closest('[data-dbl]'); if (t) run(t.dataset.dbl, t, ev); });
  const bind = ev => {
    const t = ev.target.closest('[data-bind]');
    if (!t) return;
    state[t.dataset.bind] = t.type === 'checkbox' ? t.checked : t.value;
    api.update();
  };
  box.addEventListener('input', bind);
  box.addEventListener('change', bind);
  box.addEventListener('keydown', ev => {
    ev.stopPropagation();
    if (ev.key === 'Escape' && closable) { ev.preventDefault(); api.close(null); return; }
    if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches('tr[tabindex]')) {
      ev.preventDefault();
      const t = ev.target;
      if (t.dataset.m === 'open-dir' || ev.key === ' ') run(t.dataset.m, t, ev);
      else run(t.dataset.dbl ?? t.dataset.m, t, ev);
      return;
    }
    if (ev.key === 'Enter' && ev.target.matches('input:not([type=checkbox]),[data-enter]')) { const d = box.querySelector('[data-default]:not([disabled])'); if (d) { ev.preventDefault(); d.click(); return; } }
    if (ev.key !== 'Tab') return;
    const items = [...box.querySelectorAll('button,input,select,textarea,[tabindex="0"]')].filter(n => !n.disabled && n.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items.at(-1);
    if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
    else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
  });
  // Dragging by the title bar, as a native dialog would. Content dialogs have none and stay put.
  back.querySelector('.modal-title')?.addEventListener('pointerdown', ev => {
    if (ev.target.closest('button')) return;
    const r = box.getBoundingClientRect(), dx = ev.clientX - r.left, dy = ev.clientY - r.top;
    const target = attached ? back : box;
    if (!attached) { box.style.position = 'fixed'; box.style.margin = 0; }
    const move = e => { target.style.left = `${Math.max(0, e.clientX - dx)}px`; target.style.top = `${Math.max(0, e.clientY - dy)}px`; };
    const up = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); };
    addEventListener('pointermove', move); addEventListener('pointerup', up);
  });
  if (attached) {
    // Sits above its own window only. Other windows and the taskbar stay usable, and minimising takes it along.
    floats.set(back, {owner: ownerId, close: () => api.close(null)});
    back.addEventListener('pointerdown', () => focusWindow(ownerId));
    box.style.position = 'relative';
    app.render();
  }
  api.update();
  if (attached) {
    const r = box.getBoundingClientRect();
    back.style.left = `${Math.max(8, (innerWidth - r.width) / 2)}px`;
    back.style.top = `${Math.max(8, (innerHeight - 48 - r.height) / 2)}px`;
  }
  return Object.assign(new Promise(r => { resolve = r; requestAnimationFrame(() => (box.querySelector('[data-autofocus]') ?? box.querySelector('[data-default]:not([disabled])') ?? box.querySelector('input,select,button:not(.modal-x)'))?.focus()); }), {api});
}

// A Windows 11 content dialog: no title bar, a title in the body, and a footer band of equal buttons.
export function message({title = 'Message', text, buttons = [['OK', true]], icon = ''}) {
  return modal({
    title, width: 448, cls: 'cd', titlebar: false,
    view: () => `<h2 class="cd-title">${esc(title)}</h2><div class="msg">${icon}<p>${esc(text)}</p></div><footer class="modal-foot">${buttons.map(([label, value], i) => `<button class="btn ${i === 0 ? 'primary' : ''}" data-m="pick" data-value="${esc(JSON.stringify(value))}" ${i === 0 ? 'data-default' : ''}>${esc(label)}</button>`).join('')}</footer>`,
    actions: {pick: (el, ev, api) => api.close(JSON.parse(el.dataset.value))},
  });
}
