// Boots the simulation and owns the event wiring. Each window registers its own views and actions.
import {app} from './runtime.js';
import {morph, on, reducedMotion} from './desktop/dom.js';
import './desktop/menu.js';
import {addToast, cycleWindows, flushToasts, launch, renderShell} from './desktop/shell.js';
import {dialogOpen, message} from './desktop/modal.js';
import {wireWindows} from './desktop/wm.js';
import {wireContext} from './desktop/context.js';
import {startGuide} from './desktop/guide.js';
import {initBench, renderEquipment, stationFor} from './desktop/equipment.js';
import {devPanel} from './desktop/dev.js';
import './apps/browser.js';
import './apps/chat.js';
import './apps/drive.js';
import './apps/meet.js';
import './apps/records.js';
import './apps/explorer.js';
import './apps/case.js';
import './apps/ftk.js';
import './apps/notepad.js';
import './apps/gimp.js';
import './apps/audacity.js';
import {setClipLevel} from './core/lab.js';
import {IMAGES} from './content/media.js';

const root = document.getElementById('root');
const restored = app.load();
const FREE_WHEN_PAUSED = new Set(['pause:resume', 'dev:toggle', 'dev:pause', 'dev:reset', 'dev:screen']);

app.onGuide = async text => {
  const atDesk = app.ui.mode === 'desktop' && /write-blocker first|at the bench/.test(text);
  const go = await message({title: 'Case guidance', text, buttons: atDesk ? [['Go to my bench', true], ['Close', false]] : [['OK', true]]});
  if (atDesk && go) app.setMode('equipment');
};
app.applySettings = () => {
  const {volume, muted} = app.ui.settings;
  Object.assign(app.audio.volume, volume);
  app.audio.muted = muted;
  app.audio.apply();
  setClipLevel();
};
app.setMode = async mode => {
  const from = app.ui.mode;
  if (from === mode || app.switching) return;
  const swap = () => { app.ui.mode = mode; app.ui.start = false; app.ui.quick = false; app.persist(); app.renderNow(); app.pump(); };
  const scene = app.scene3d;
  // The set is on screen everywhere except the desktop, where it must let go of the monitor.
  const place = () => (mode === 'desktop' ? scene?.hide() : mode === 'opening' ? scene?.showSplash() : scene?.showBench(stationFor(app.s)));
  // The welcome page expands into the bench: the camera flies in as the title steps aside.
  if (scene && from === 'opening' && mode === 'equipment') {
    app.switching = true;
    document.body.classList.add('leaving-splash');
    await scene.expand(stationFor(app.s));
    app.switching = false;
    swap();
    document.body.classList.remove('leaving-splash');
    return;
  }
  if (scene && from === 'equipment' && mode === 'desktop') {
    app.switching = true;
    await scene.toDesktop();
    app.switching = false;
    swap();
    document.getElementById('login-name')?.focus();
    return;
  }
  if (scene && from === 'desktop' && mode === 'equipment') {
    app.switching = true;
    swap();
    await scene.toBench(stationFor(app.s));
    app.switching = false;
    return;
  }
  if (reducedMotion()) {
    swap();
    place();
    return;
  }
  const layer = document.getElementById('fade');
  layer.classList.add('on');
  app.clock.after(170, () => {
    swap();
    place();
    app.clock.after(30, () => { layer.classList.remove('on'); document.getElementById('login-name')?.focus(); });
  });
};
app.setPaused = on => {
  app.ui.paused = on;
  app.clock.paused = on;
  app.audio.pause(on);
  app.render();
  if (on) requestAnimationFrame(() => document.querySelector('#paused .btn')?.focus());
};

// Messages arrive on the shared clock, so a pause holds them and a reload cannot repeat them.
let delivering = null, reviewing = null;
app.onPump = () => {
  const s = app.s;
  if (s.outbox.length && !delivering) {
    delivering = app.clock.after(1300, () => {
      delivering = null;
      const group = app.s.outbox[0];
      if (!group) return;
      app.dispatch({type: 'DELIVER'});
      const reading = app.ui.active === 'browser' && app.ui.browser.active === 'chat' && app.ui.mode === 'desktop';
      if (!reading) { app.ui.unread += group.lines.length; addToast(group.toast); } else app.audio.notify();
      app.render();
    });
  }
  if (s.review && !reviewing) {
    reviewing = app.clock.after(1500, () => {
      reviewing = null;
      if (app.s.review) app.dispatch({type: 'REVIEW'});
    });
  }
  flushToasts();
};

app.views.add(renderShell);
app.views.add(renderEquipment);
app.views.add(() => {
  morph(document.getElementById('dev-host'), devPanel());
  document.getElementById('paused').hidden = !app.ui.paused;
});

root.addEventListener('click', ev => {
  const t = ev.target.closest('[data-action]');
  if (t && !t.disabled) {
    const name = t.dataset.action;
    if (app.ui.paused && !FREE_WHEN_PAUSED.has(name)) return;
    if (name !== 'menu:toggle' && app.ui.menu) app.ui.menu = null;
    Promise.resolve().then(() => app.actions[name]?.(t, ev)).catch(err => { console.error(err); app.guide(err.message); });
    return;
  }
  if (app.ui.menu && !ev.target.closest('.menu-root')) { app.ui.menu = null; app.render(); }
  if (app.ui.start && !ev.target.closest('.start-menu,.tb-start,.tb-search')) { app.ui.start = false; app.render(); }
  if (app.ui.quick && !ev.target.closest('.quick,.tray-btn')) { app.ui.quick = false; app.render(); }
  if (app.ui.notif && !ev.target.closest('.notif,.tray-clock')) { app.ui.notif = false; app.render(); }
});
const onInput = ev => {
  const t = ev.target.closest('[data-input]');
  if (!t || app.ui.paused) return;
  const handler = app.inputs[t.dataset.input];
  if (!handler) return;
  // A text field fires both events; acting on each would double-count.
  if (ev.type === 'change' && t.matches('input:not([type=radio],[type=checkbox],[type=range]),textarea')) return;
  if (ev.type === 'input' && (t.matches('select') || t.type === 'radio')) return;
  handler(t, ev);
};
root.addEventListener('input', onInput);
root.addEventListener('change', onInput);
root.addEventListener('submit', ev => {
  ev.preventDefault();
  if (ev.target.dataset.form !== 'login') return;
  const name = (app.ui.loginName ?? '').trim();
  if (!name) { app.ui.loginError = 'Enter your name to sign in.'; app.render(); return; }
  app.audio.unlock();
  app.attempt({type: 'LOGIN', name});
});
on(root, 'dblclick', '[data-open]', el => launch(el.dataset.open));
on(root, 'click', '[data-open]', (el, ev) => { if (ev.pointerType === 'touch') launch(el.dataset.open); });
on(root, 'keydown', '[data-open]', (el, ev) => { if (ev.key === 'Enter') launch(el.dataset.open); });
on(root, 'dblclick', '[data-dbl-action]', el => app.actions[el.dataset.dblAction]?.(el));
on(root, 'keydown', '[data-key-enter]', (el, ev) => { if (ev.key === 'Enter') { ev.preventDefault(); app.actions[el.dataset.keyEnter]?.(el, ev); } });
addEventListener('keydown', ev => {
  if (ev.key === 'Escape') { if (app.ui.menu || app.ui.start || app.ui.quick || app.ui.notif) { app.ui.menu = null; app.ui.start = false; app.ui.quick = false; app.ui.notif = false; app.render(); } }
  if (ev.altKey && (ev.key === '`' || ev.key === 'Tab')) { ev.preventDefault(); cycleWindows(); }
  if ((ev.ctrlKey || ev.metaKey) && app.ui.active === 'notepad' && !dialogOpen()) {
    const k = ev.key.toLowerCase();
    if (k === 's') { ev.preventDefault(); app.actions['np:save']?.(); }
    if (k === 'o') { ev.preventDefault(); app.actions['np:open']?.(); }
    if (k === 'f') { ev.preventDefault(); app.actions['np:find']?.(); }
  }
});
document.addEventListener('visibilitychange', () => app.render());
wireWindows(document.getElementById('session'));
wireContext(document.getElementById('session'));

app.register({
  'shell:start': async () => { await app.audio.unlock(); app.setMode('equipment'); },
  'pause:resume': () => app.setPaused(false),
});

for (const id of ['session', 'lock']) document.getElementById(id).style.backgroundImage = `url("${IMAGES.wallpaper.src}")`;
app.applySettings();
if (restored) {
  // Resume where the learner was. The first click restores sound, which browsers require.
  addEventListener('pointerdown', () => app.audio.unlock(), {once: true});
}
initBench();
startGuide(root);
app.renderNow();
app.pump();
