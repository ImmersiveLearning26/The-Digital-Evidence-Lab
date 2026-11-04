// Application menu bars. Actions a case does not need answer briefly instead of doing nothing.
import {app} from '../runtime.js';
import {esc} from './dom.js';

export function menubar(win, menus, extra = '') {
  const open = app.ui.menu?.win === win ? app.ui.menu.name : null;
  return `<nav class="menubar" aria-label="Application menu">${menus.map(m => `<div class="menu-root"><button class="${open === m.name ? 'open' : ''}" data-action="menu:toggle" data-win="${win}" data-name="${esc(m.name)}" aria-haspopup="true" aria-expanded="${open === m.name}">${esc(m.name)}</button>${open === m.name ? dropdown(win, m.items) : ''}</div>`).join('')}${extra}</nav>`;
}
function dropdown(win, items) {
  return `<div class="dropdown" role="menu">${items.map(i => {
    if (i === '-') return '<hr>';
    if (i.head) return `<div class="dd-head">${esc(i.head)}</div>`;
    const action = i.action ?? 'menu:na';
    return `<button role="menuitem" data-action="${action}" data-win="${win}" ${i.arg != null ? `data-arg="${esc(i.arg)}"` : ''} ${i.disabled ? 'disabled' : ''}><span class="dd-check">${i.checked ? '●' : ''}</span><span>${esc(i.label)}</span><kbd>${esc(i.key ?? '')}</kbd></button>`;
  }).join('')}</div>`;
}
app.register({
  'menu:toggle': el => {
    const {win, name} = el.dataset;
    app.ui.menu = app.ui.menu?.win === win && app.ui.menu.name === name ? null : {win, name};
    app.render();
  },
  'menu:na': el => app.status(el.dataset.win, `${el.textContent.trim()} is not needed for this case.`),
});
