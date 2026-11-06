// A file opened for reading appears large in the middle of the screen, the way the system's own viewer
// shows a photo: the item itself, one row of facts beneath it, and Esc or a click outside to close.
import {esc} from './dom.js';
import {modal} from './modal.js';

export function openViewer({title, media, facts = [], note = ''}) {
  const shown = modal({
    title, cls: 'viewer', titlebar: false, width: 880, owner: null,
    view: () => `<header class="vw-head"><h2>${esc(title)}</h2><button class="vw-x" data-m="close" aria-label="Close"><i class="g-x"></i></button></header>
      <div class="vw-media">${media}</div>
      ${facts.length ? `<dl class="vw-facts">${facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
      ${note ? `<p class="vw-note">${esc(note)}</p>` : ''}`,
    actions: {close: (el, ev, api) => api.close(true)},
  });
  const back = shown.api.element.parentElement;
  back.addEventListener('click', ev => { if (ev.target === back) shown.api.close(true); });
  return shown;
}
