// Everything around the windows: opening, sign-in, desktop, taskbar, Start, tray and notifications.
import {app} from '../runtime.js';
import {esc, morph, storyTime} from './dom.js';
import {icons} from './icons.js';
import {picture} from '../content/media.js';
import {apps, closeWindow, cycleWindows, focusWindow, isOpen, minimise, openWindow, renderWindows, toggleDesktop, toggleMax, win} from './wm.js';
import {appAvailable, nextTask} from '../core/state.js';
import {showMe} from './guide.js';

const DESKTOP = [
  ['explorer', 'Case Files', null], ['ftk', 'Evidence Imager', null], ['notepad', 'Text Editor', null], ['gimp', 'Image Editor', null],
  ['audacity', 'Audio Recorder', null], ['browser', 'Browser', null], ['case', 'Case Record', null],
];
const PINNED = ['explorer', 'browser'];

export function launch(id) {
  if (id === 'browser') return app.openPage('chat');
  return openWindow(id);
}

// With the 3D workstation the welcome page is the set itself, marked Start. The card is the fallback without it.
function opening() {
  if (app.sceneState === 'ready') return splash();
  if (app.sceneState !== 'none') return '<p class="opening-wait" role="status">Loading the workstation…</p>';
  return `<div class="opening-card"><div class="brand">${picture('mivaLogo', 'miva')}<p>MIVA OPEN UNIVERSITY</p><small>presents</small></div><h1>The Digital Evidence Lab</h1><p class="tag">CSC 1105 · Data representation: text, images and sound</p><button class="btn primary big" data-action="shell:start">Start</button><p class="notice">Fictional scenario for learning purposes. The agency, evidence files and case details are simulated. No real personal data or evidentiary material is used.</p></div>`;
}

// One hero line; everything else steps well down, in small tracked capitals over hairline rows.
function splash() {
  const rows = [['Case', '0417'], ['Role', 'Junior engineer'], ['Evidence', 'Witness text · CCTV still · Tape']];
  return `<section class="splash" aria-label="The Digital Evidence Lab"><p class="sp-kicker">MIVA Open University · CSC 1105</p>
  <h1 class="sp-title">The Digital<br>Evidence Lab</h1><p class="sp-lead">Preserve three pieces of evidence exactly as they were found.</p>
  <dl class="sp-rows">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
  <p class="sp-start"><b>Start</b> is the power button on the tower.</p><p class="sp-note">Fictional scenario for learning. No real case data.</p></section>`;
}

function lock() {
  return `<div class="lock"><div class="lock-avatar">${userGlyph}</div><h1>Junior Engineer</h1><form data-form="login" class="lock-form"><label class="sr" for="login-name">Your name</label><input id="login-name" placeholder="Your name" maxlength="60" autocomplete="off" spellcheck="false" value="${esc(app.ui.loginName ?? '')}" data-input="login:name"><button class="lock-btn" type="submit" aria-label="Sign in">${arrow}</button></form>${app.ui.loginError ? `<p class="lock-err" role="alert">${esc(app.ui.loginError)}</p>` : ''}<p class="lock-hint">Type your name, then press Enter</p><small>Digital Evidence Lab · Training simulation · Fictional scenario, no real case data</small></div>`;
}
const arrow = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9.5M8.5 3.5 13 8l-4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const userGlyph = '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="11" r="6.500" fill="currentColor"/><path d="M4 29c1.500-8 6-11 12-11s10.500 3 12 11z" fill="currentColor"/></svg>';

function desktopIcons() {
  return DESKTOP.filter(([id]) => appAvailable(app.s, id)).map(([id, label, img]) => `<button class="d-icon" data-key="${id}" data-open="${id}" aria-label="Open ${esc(label)}">${img ? picture(img) : `<span class="d-glyph">${apps[id].icon}</span>`}<span>${esc(label)}</span></button>`).join('');
}

function taskbar() {
  const running = app.ui.windows.map(w => w.id);
  const ids = [...new Set([...PINNED.filter(id => appAvailable(app.s, id)), ...running])];
  return `<button class="tb-btn tb-start ${app.ui.start ? 'on' : ''}" data-action="shell:start-menu" aria-label="Start" aria-expanded="${app.ui.start}">${icons.windows}</button>
  <button class="tb-search" data-action="shell:start-menu" aria-label="Search">${icons.search}<span>Search</span></button>
  ${ids.map(id => `<button class="tb-btn ${isOpen(id) ? 'running' : ''} ${app.ui.active === id ? 'on' : ''}" data-action="shell:task" data-id="${id}" data-ctx="task" aria-label="${esc(apps[id].title)}${isOpen(id) ? ', running' : ''}" title="${esc(apps[id].title)}">${apps[id].icon}${id === 'browser' && app.ui.unread ? `<b class="badge" aria-label="${app.ui.unread} unread">${app.ui.unread}</b>` : ''}</button>`).join('')}`;
}
function tray() {
  const t = app.ui.tips;
  return `<button class="tray-btn tips-btn" data-action="tip:show" aria-label="Amina's tips${t?.unread ? `, ${t.unread} new` : ''}">${bulb}${t?.unread ? `<b class="badge">${t.unread}</b>` : ''}</button>
  <button class="tray-btn equip ${nextTask(app.s).open === 'equipment' ? 'attn' : ''}" data-action="shell:equipment">${icons.bench}<span>View equipment</span></button>
  <button class="tray-btn ${app.ui.quick ? 'on' : ''}" data-action="shell:quick" aria-label="Quick settings: sound, captions, pause">${icons.wifi}${icons.volume}${icons.battery}</button>
  <button class="tray-clock ${app.ui.notif ? 'on' : ''}" data-action="shell:notif" aria-label="Lab clock, Nairobi. Open notifications"><span>${storyTime(app.s.story)}</span><span>30/10/2026</span>${app.ui.unread ? `<b class="badge clock">${app.ui.unread}</b>` : ''}</button>
  <button class="show-desktop" data-action="shell:desktop" aria-label="Show desktop" title="Show desktop"></button>`;
}
function startMenu() {
  const q = (app.ui.startQuery ?? '').toLowerCase();
  const list = Object.values(apps).filter(a => appAvailable(app.s, a.id) && a.title.toLowerCase().includes(q));
  return `<div class="start-menu" role="dialog" aria-label="Start"><input class="start-q" placeholder="Search for apps" aria-label="Search for apps" data-input="shell:start-q" value="${esc(app.ui.startQuery ?? '')}"><h2>Pinned</h2><div class="start-grid">${list.map(a => `<button data-action="shell:launch" data-id="${a.id}">${a.icon}<span>${esc(a.title)}</span></button>`).join('')}${list.length ? '' : '<p>No matching apps.</p>'}</div><footer><span class="me">${userGlyph}${esc(app.s.name)}</span></footer></div>`;
}
function quick() {
  const st = app.ui.settings;
  const slider = (key, label) => `<label><span>${label}</span><input type="range" min="0" max="1" step=".05" value="${st.volume[key]}" data-input="shell:volume" data-key="${key}" aria-label="${label} volume"></label>`;
  return `<div class="quick" role="dialog" aria-label="Quick settings"><div class="q-row"><button class="q-tile" data-action="shell:pause">Pause simulation</button><button class="q-tile ${st.muted ? 'on' : ''}" data-action="shell:mute" aria-pressed="${st.muted}">${st.muted ? 'Sound off' : 'Sound on'}</button></div><div class="q-row"><button class="q-tile ${st.captions ? 'on' : ''}" data-action="shell:toggle" data-key="captions" aria-pressed="${st.captions}">Captions ${st.captions ? 'on' : 'off'}</button><button class="q-tile ${st.thoughts !== false ? 'on' : ''}" data-action="shell:voice" aria-pressed="${st.thoughts !== false}">Inner voice ${st.thoughts !== false ? 'on' : 'off'}</button><button class="q-tile ${st.reduceMotion ? 'on' : ''}" data-action="shell:toggle" data-key="reduceMotion" aria-pressed="${st.reduceMotion}">Reduced motion</button><button class="q-tile ${st.contrast ? 'on' : ''}" data-action="shell:toggle" data-key="contrast" aria-pressed="${st.contrast}">High contrast</button></div>${slider('dialogue', 'Calls')}${slider('evidence', 'Evidence playback')}${slider('sfx', 'System sounds')}</div>`;
}

function toasts() {
  return app.ui.toasts.map(t => (t.system ? `<div class="toast system" data-key="t${t.id}" role="status"><header>${icons.windows}<span>System</span><button data-action="toast:dismiss" data-id="${t.id}" aria-label="Dismiss notification"><i class="g-x"></i></button></header><div class="toast-body"><div><strong>${esc(t.title)}</strong><p>${esc(t.text)}</p></div></div></div>` : t.compact ? `<button class="toast-pill" data-key="t${t.id}" data-action="toast:open" aria-label="New message from Amina. Open chat">${picture('aminaFace', 'toast-face tiny')}<span>Amina sent a message</span></button>` : `<div class="toast" data-key="t${t.id}" role="status"><header>${icons.chat}<span>Team Chat${t.count > 1 ? ` · ${t.count} new messages` : ''}</span><button data-action="toast:dismiss" data-id="${t.id}" aria-label="Dismiss notification"><i class="g-x"></i></button></header><div class="toast-body">${picture('aminaFace', 'toast-face')}<div><strong>Amina Njoroge</strong><p>${esc(t.text)}</p></div></div><button class="btn soft" data-action="toast:open" data-id="${t.id}">Open chat</button></div>`)).join('');
}

// A message stays readable for a good while, then shrinks to a small pill that waits until it is opened.
// Looking away never loses an instruction, and a waiting message never covers the work underneath.
export function addToast(text) {
  if (app.ui.mode !== 'desktop' || app.busyAudio) { app.ui.heldToasts.push(text); return; }
  if (text?.system) {
    const note = {...text, id: ++toastId};
    app.ui.toasts = [...app.ui.toasts.filter(t => !t.system), note];
    app.audio.tone(523, .09); setTimeout(() => app.audio.tone(784, .12), 110);
    app.clock.after(9000, () => { app.ui.toasts = app.ui.toasts.filter(t => t.id !== note.id); app.render(); });
    app.render();
    return;
  }
  const last = app.ui.toasts.find(t => !t.system), toast = {id: ++toastId, text, count: (last?.count ?? 0) + 1, compact: false};
  app.ui.toasts = [...app.ui.toasts.filter(t => t.system), toast];
  app.audio.notify();
  app.clock.after(16000, () => { toast.compact = true; app.render(); });
  app.render();
}
let toastId = 0;
export function flushToasts() {
  if (!app.ui.heldToasts.length || app.ui.mode !== 'desktop' || app.busyAudio) return;
  const next = app.ui.heldToasts.shift();
  app.clock.after(200, () => addToast(next));
}

// Windows keeps recent notifications behind the clock; so does this.
function notifications() {
  const list = app.s.messages.filter(m => m.from === 'amina').slice(-6).reverse();
  return `<div class="notif" role="dialog" aria-label="Notifications"><h2>Notifications</h2>${list.map(m => `<button class="notif-item" data-action="toast:open" data-id="0">${picture('aminaFace', 'toast-face small')}<span><strong>Amina Njoroge</strong><small>${storyTime(m.at)}</small><em>${esc(m.text)}</em></span></button>`).join('') || '<p>No notifications.</p>'}</div>`;
}
// A tip arrives like a Windows notification and stays by the side until dismissed. The number marks a tip
// not yet opened: a finished step no longer counts. Saying how is held back until the learner asks.
function tips() {
  const task = nextTask(app.s), t = (app.ui.tips ??= {key: null, unread: 0, open: false, hidden: false});
  if (!task.quiet && task.text !== t.key) { Object.assign(t, {key: task.text, how: task.how, to: task.open, open: false, hidden: false, unread: 1}); app.audio.tone(660, .07); }
  return t;
}
const bulb = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3a10 10 0 0 0-6 18c1.300 1 2 2.300 2 4h8c0-1.700.7-3 2-4a10 10 0 0 0-6-18z" fill="#ffc21a"/><path d="M12.500 27.500h7M14 30h4" stroke="#6b5a1f" stroke-width="2" stroke-linecap="round"/></svg>';
const play = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M6.5 5.5v5l4-2.5z" fill="currentColor"/></svg>';
function tipCard() {
  const t = tips();
  if (t.hidden || !t.key) return '';
  return `<aside class="tip ${t.open ? 'open' : ''}" data-key="tip" aria-label="Amina's tips"><header>${bulb}<strong>Amina's tips</strong>${t.unread ? `<b class="tip-count" aria-label="${t.unread} new">${t.unread}</b>` : ''}<button data-action="tip:hide" aria-label="Hide tips"><i class="g-x"></i></button></header><p class="tip-text">${esc(t.key)}</p>${t.open ? `<p class="tip-how">${esc(t.how)}</p><button class="btn primary" data-action="tip:show-me">Show me</button>` : `<button class="tip-more" data-action="tip:open">Show me how</button>`}${app.ui.stuck && !app.ui.stuck.startsWith('bench:') ? `<button class="btn tip-watch" data-action="demo:watch">${play}<span>Watch how it’s done</span></button>` : ''}</aside>`;
}

const q = id => document.getElementById(id);
export function renderShell() {
  const {ui, s} = app;
  document.documentElement.classList.toggle('reduce-motion', ui.settings.reduceMotion);
  document.documentElement.classList.toggle('contrast', ui.settings.contrast);
  q('opening').hidden = ui.mode !== 'opening';
  if (ui.mode === 'opening') morph(q('opening'), opening());
  const onMonitor = ui.mode === 'equipment' && s.powered && !!app.scene3d;
  const showing = ui.mode === 'desktop' || onMonitor;
  q('desktop').hidden = !showing;
  q('desktop').inert = ui.mode !== 'desktop';
  const locked = showing && !s.name;
  q('lock').hidden = !locked;
  q('session').hidden = locked;
  if (locked) { morph(q('lock'), lock()); return; }
  if (!showing) return;
  morph(q('icons'), desktopIcons());
  morph(q('task-left'), taskbar());
  morph(q('task-right'), tray());
  morph(q('start-host'), ui.start ? startMenu() : '');
  morph(q('quick-host'), ui.quick ? quick() : '');
  morph(q('notif-host'), ui.notif ? notifications() : '');
  morph(q('toasts'), toasts() + tipCard());
  renderWindows();
}

app.register({
  'shell:start-menu': () => { app.ui.start = !app.ui.start; app.ui.quick = false; app.ui.startQuery = ''; app.render(); },
  'shell:quick': () => { app.ui.quick = !app.ui.quick; app.ui.start = false; app.ui.notif = false; app.render(); },
  'shell:notif': () => { app.ui.notif = !app.ui.notif; app.ui.quick = false; app.ui.start = false; app.render(); },
  'shell:desktop': () => toggleDesktop(),
  'tip:show-me': () => showMe(),
  'tip:open': () => { const t = app.ui.tips; t.open = true; t.unread = 0; app.persist(); app.render(); },
  'tip:hide': () => { app.ui.tips.hidden = true; app.persist(); app.render(); },
  'tip:show': () => { const t = app.ui.tips; t.hidden = !t.hidden; if (!t.hidden) { t.open = true; t.unread = 0; } app.persist(); app.render(); },
  'shell:launch': el => launch(el.dataset.id),
  'shell:task': el => {
    const id = el.dataset.id, w = win(id);
    if (!w) return launch(id);
    if (app.ui.active === id && !w.min) minimise(id); else focusWindow(id);
  },
  'shell:voice': () => { app.ui.settings.thoughts = app.ui.settings.thoughts === false; app.persist(); app.render(); },
  'shell:toggle': el => { const k = el.dataset.key; app.ui.settings[k] = !app.ui.settings[k]; app.applySettings(); app.persist(); app.render(); },
  'shell:mute': () => { app.ui.settings.muted = !app.ui.settings.muted; app.applySettings(); app.persist(); app.render(); },
  'shell:pause': () => app.setPaused(true),
  'toast:dismiss': el => { app.ui.toasts = app.ui.toasts.filter(t => String(t.id) !== el.dataset.id); app.render(); },
  'toast:open': () => { app.ui.toasts = app.ui.toasts.filter(t => t.system); app.ui.notif = false; app.openPage('chat'); },
}, {
  'login:name': el => { app.ui.loginName = el.value; app.ui.loginError = ''; },
  'shell:start-q': el => { app.ui.startQuery = el.value; app.render(); },
  'shell:volume': el => { app.ui.settings.volume[el.dataset.key] = Number(el.value); app.applySettings(); app.persist(); },
});
export {closeWindow, cycleWindows, toggleMax};
