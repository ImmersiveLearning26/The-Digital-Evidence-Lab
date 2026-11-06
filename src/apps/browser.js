// A browser window with tabs. Chat, Drive, Meet and the lab record all live here as ordinary pages.
import {app} from '../runtime.js';
import {esc} from '../desktop/dom.js';
import {icons} from '../desktop/icons.js';
import {focusWindow, openWindow, registerApp} from '../desktop/wm.js';

export const pages = {};
export const registerPage = page => { pages[page.id] = page; if (page.actions) app.register(page.actions, page.inputs); };

app.openPage = (id, extra = {}) => {
  // Chat is not a browser tab: it is the panel docked on the right.
  if (id === 'chat') return app.openDock();
  const b = app.ui.browser;
  if (!b.tabs.includes(id)) b.tabs.push(id);
  visit(id);
  pages[id].onOpen?.(extra);
  openWindow('browser');
  focusWindow('browser');
};
const activePage = () => pages[app.ui.browser.active];
function visit(id) {
  const b = app.ui.browser;
  if (b.active && b.active !== id) { (b.back ??= []).push(b.active); b.forward = []; }
  b.active = id;
}

registerApp({
  id: 'browser', title: 'Browser', icon: icons.chrome, rect: {x: .03, y: .02, w: .9, h: .85},
  titleHtml() {
    const b = app.ui.browser;
    b.tabs = b.tabs.filter(id => pages[id]);
    if (b.active && !pages[b.active]) b.active = b.tabs.at(-1) ?? null;
    return `<div class="tabs" role="tablist">${b.tabs.map(id => `<div class="tab ${b.active === id ? 'on' : ''}" role="tab" aria-selected="${b.active === id}"><button class="tab-name" data-action="br:tab" data-id="${id}">${pages[id].icon}<span>${esc(pages[id].tabTitle?.() ?? pages[id].title)}</span>${id === 'chat' && app.ui.unread ? `<b class="tab-dot">${app.ui.unread}</b>` : ''}</button><button class="tab-x" data-action="br:close" data-id="${id}" aria-label="Close ${esc(pages[id].title)} tab">×</button></div>`).join('')}<button class="tab-new" data-action="br:new" aria-label="New tab">+</button></div>`;
  },
  view() {
    const page = activePage();
    if (!page) return `<div class="br-empty"><p>Nothing open.</p><button class="btn" data-action="br:new">New tab</button></div>`;
    const b = app.ui.browser;
    return `<div class="br-bar"><div class="br-nav"><button data-action="br:back" aria-label="Back" ${b.back?.length ? '' : 'disabled'}>‹</button><button data-action="br:forward" aria-label="Forward" ${b.forward?.length ? '' : 'disabled'}>›</button><button data-action="br:reload" aria-label="Reload">⟳</button></div><div class="br-url">${esc(page.url())}</div></div><div class="br-page page-${page.id}" data-key="${page.id}">${page.view()}</div>`;
  },
  after(el) { activePage()?.after?.(el); },
  actions: {
    'br:tab': el => { visit(el.dataset.id); if (el.dataset.id === 'chat') app.ui.unread = 0; app.persist(); app.render(); },
    'br:new': () => app.openPage('newtab'),
    'br:back': () => { const b = app.ui.browser, id = b.back?.pop(); if (id) { (b.forward ??= []).push(b.active); b.active = id; app.render(); } },
    'br:forward': () => { const b = app.ui.browser, id = b.forward?.pop(); if (id) { (b.back ??= []).push(b.active); b.active = id; app.render(); } },
    'br:reload': () => { const body = document.querySelector('.win-browser .br-page'); body?.classList.add('reloading'); app.clock.after(220, () => body?.classList.remove('reloading')); },
    'br:close': el => {
      const b = app.ui.browser, id = el.dataset.id;
      pages[id].onClose?.();
      b.tabs = b.tabs.filter(t => t !== id);
      b.back = (b.back ?? []).filter(t => t !== id);
      b.forward = (b.forward ?? []).filter(t => t !== id);
      if (b.active === id) b.active = b.tabs.at(-1) ?? null;
      app.persist(); app.render();
    },
  },
});

registerPage({
  id: 'newtab', title: 'New tab', icon: icons.chrome, url: () => 'chrome://newtab',
  view: () => `<div class="newtab"><h1>Where to?</h1><div class="newtab-grid"><button data-action="nt:open" data-to="chat">${icons.chat}<span>Team Chat</span></button>${app.s.folderOpened ? `<button data-action="nt:open" data-to="drive">${icons.drive}<span>Drive</span></button>` : ''}${app.s.briefed ? `<button data-action="nt:open" data-to="intake">${icons.record}<span>Case record</span></button>` : ''}</div></div>`,
  actions: {'nt:open': el => { const b = app.ui.browser; b.tabs = b.tabs.filter(t => t !== 'newtab'); app.openPage(el.dataset.to); }},
});
