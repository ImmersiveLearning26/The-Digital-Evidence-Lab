// Quiet guidance. When a learner hesitates, the next control glows. Someone working steadily never sees it.
//   - It marks where to act, never which answer is right: on a decision it lights the whole set of options.
//   - It waits longer each time a skill is repeated, so help fades as the learner gets better.
//   - It never fires during calls, recordings or dialogs the learner is reading in a call.
// The learner still does every action. Nothing here clicks, opens or changes anything.
import {app} from '../runtime.js';
import {nextTask} from '../core/state.js';
import {win} from './wm.js';
import {WITNESS_PATH, IMAGE_MASTER_PATH} from '../core/domain.js';

const WAITS = [8000, 15000, 25000, 40000];
const fileName = path => path.split('\\').pop();

// Every call here returns the controls for this moment, most specific first.
function fileDialogStep(name) {
  const row = `.file-dialog tr[data-path$="${name}"]`;
  const chosen = document.querySelector(`${row}.sel`);
  return chosen ? '.file-dialog [data-m="confirm"]' : row;
}
function menuThen(appClass, menu, action) {
  return [`.dropdown [data-action="${action}"]`, `.${appClass} [data-action="menu:toggle"][data-name="${menu}"]`];
}
function send(name) {
  const attached = app.ui.chat?.attachment?.name === name;
  return {app: 'browser', page: 'chat', skill: 'send', controls: [fileDialogStep(name), attached ? '.gc-send' : '.gc-clip']};
}

function path(task, s, ui) {
  switch (task.id) {
    case 'message': return {app: 'browser', page: 'chat', controls: ['[data-action="toast:open"]', '.c-card[data-action="chat:drive"]']};
    case 'brief': case 'closing': return {app: 'browser', page: ui.browser.active === 'meet' ? 'meet' : 'chat', controls: ['[data-action="meet:join"]', 'last:.c-card[data-action="chat:meet"]']};
    case 'records': {
      const next = ['text', 'image', 'audio'].find(k => !s.inspected.includes(k));
      return {app: 'browser', page: 'drive', controls: [`[data-action="drive:open"][data-kind="${next}"]`]};
    }
    case 'intake': {
      const f = ui.intake ?? {rank: []};
      if (s.risk.length !== 3) return {app: 'browser', page: 'intake', controls: [f.rank?.every(Boolean) && f.rank.length === 3 ? '[data-action="intake:rank"]' : '.rank-row']};
      return {app: 'browser', page: 'intake', controls: ['[data-action="intake:confirm"]', '.radios']};
    }
    case 'bench': return {skill: 'bench', controls: ['.tray-btn.equip']};
    case 'acquire': return {app: 'ftk', controls: [
      '.modal[aria-label="Image Destination"] [data-m="ok"]', '.modal[aria-label="Select Source"] [data-m="next"]', '.modal[aria-label="Select Drive"] [data-m="next"]',
      document.querySelector('.dest-list .sel') ? (document.querySelector('.modal[aria-label="Create Image"] input[type=checkbox]')?.checked ? '.modal[aria-label="Create Image"] [data-m="start"]' : '.modal[aria-label="Create Image"] .check') : '.modal[aria-label="Create Image"] [data-m="add"]',
      '.ftk-tools [data-action="ftk:create"]']};
    case 'addImage': return {app: 'ftk', controls: [fileDialogStep('drive.E01'), '.modal[aria-label="Select Source"] [data-m="next"]', '.ftk-tools [data-action="ftk:add"]']};
    case 'export': return {app: 'ftk', controls: ['.modal[aria-label="Browse For Folder"] [data-m="ok"]', ui.ftk?.folder ? '.ftk-tools [data-action="ftk:export"]' : '[data-action="ftk:folder"]']};
    case 'openText': return {app: 'notepad', skill: 'open', controls: [fileDialogStep(fileName(WITNESS_PATH)), '.npp-tools [data-action="np:open"]']};
    case 'fixText': {
      const d = ui.np?.doc;
      const inFile = (s.files[WITNESS_PATH]?.version ?? 1) > 1;
      if (d?.dirty) return {app: 'notepad', skill: 'save', controls: ['.npp-tools [data-action="np:save"]']};
      if (document.querySelector('.reps')) {
        if (ui.textCase?.rep) return {app: 'case', controls: ['[data-action="tc:load"]', '.reps']};
        return {app: 'case', controls: ['.reps']};
      }
      if (!d) return {app: 'notepad', skill: 'open', controls: [fileDialogStep(fileName(WITNESS_PATH)), '.npp-tools [data-action="np:open"]']};
      if (d.savedHere) return {app: 'notepad', controls: ['.npp-tools [data-action="np:close"]']};
      if (inFile && d.encoding !== 'UTF-8' && ui.textCase?.result && !ui.textCase.result.ok) return {app: 'notepad', controls: ['.npp .dropdown', '.npp [data-action="menu:toggle"][data-name="Encoding"]']};
      return {app: 'case', controls: ['[data-action="tc:verify"]']};
    }
    case 'sendText': return send(fileName(WITNESS_PATH));
    case 'openImage': return {app: 'gimp', skill: 'open', controls: [fileDialogStep('cctv_working.jpg'), ...menuThen('gimp', 'File', 'gi:open')]};
    case 'pixels': {
      const missing = ['plate', 'character', 'sky'].find(t => !s.image.picks[t]);
      return {app: 'case', controls: missing ? [`[data-action="ic:goto"][data-t="${missing}"]`] : ['.match']};
    }
    case 'imageSet': {
      const png = s.files[IMAGE_MASTER_PATH], step = ui.imageCase?.step ?? 1;
      if (step < 4) return {app: 'case', controls: ['[data-action="ic:next"]']};
      if (!png) {
        if (document.querySelector('.gi-dock')?.textContent.includes('300 PPI')) return {app: 'gimp', skill: 'menu', controls: ['.file-dialog [data-m="confirm"]', ...menuThen('gimp', 'File', 'gi:export')]};
        return {app: 'gimp', skill: 'menu', controls: ['.modal[aria-label="Set Image Print Resolution"] input', ...menuThen('gimp', 'Image', 'gi:print')]};
      }
      if (ui.gimp?.reopened && ui.gimp.path === IMAGE_MASTER_PATH) return {app: 'case', controls: ['[data-action="ic:compare"]']};
      return {app: 'gimp', skill: 'open', controls: [fileDialogStep(fileName(IMAGE_MASTER_PATH)), ...menuThen('gimp', 'File', 'gi:open')]};
    }
    case 'sendImage': return send(fileName(IMAGE_MASTER_PATH));
    case 'capture': {
      const a = s.audio;
      if (!a.opened) return {app: 'audacity', controls: []};
      if (a.step < 3) return {app: 'case', controls: [document.querySelector('.ab-row') && a.previews.length < 2 ? '.ab-row' : '[data-action="ac:confirm"]']};
      if (a.device !== 'interface') return {app: 'audacity', controls: ['.au-device select[data-input="au:device"]']};
      return {app: 'audacity', controls: ['[data-action="au:record"]']};
    }
    case 'exportAudio': {
      const unchecked = document.querySelector('[data-action="ac:check"]');
      if (unchecked) return {app: 'case', controls: ['[data-action="ac:check"]']};
      return {app: 'audacity', skill: 'menu', controls: ['.modal[aria-label="Export Audio"] [data-m="ok"]', ...menuThen('audacity', 'File', 'au:export')]};
    }
    case 'sendAudio': {
      const master = Object.values(s.files).find(f => f.sourceId === 'statement' && ['FLAC', 'WAV'].includes(f.settings.format));
      return send(master.name);
    }
    case 'handover': {
      const empty = [...document.querySelectorAll('.page-handover select[data-key]')].find(e => !e.value);
      return {app: 'browser', page: 'handover', controls: empty ? ['.page-handover .lab-table'] : ['[data-action="handover:submit"]']};
    }
    case 'debrief': return {app: 'browser', page: 'debrief', controls: ['[data-action="debrief:finish"]']};
    default: return null;
  }
}

function usable(el) {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return false;
  const hit = document.elementFromPoint(r.left + r.width / 2, r.top + Math.min(r.height / 2, 30));
  if (hit?.closest('#toasts') && !el.closest('#toasts')) return inFront(el);
  return !!hit && (el === hit || el.contains(hit) || hit.contains(el) && !!hit.closest('.win, .modal'));
}
const inFront = el => !!(el.closest('.modal') || el.closest('.win')?.dataset.win === app.ui.active);
// The pane to scroll when a control in the front window sits outside it.
function scrolledAway(el) {
  if (!el?.getClientRects().length || !inFront(el)) return null;
  const r = el.getBoundingClientRect(), y = r.top + Math.min(r.height / 2, 30);
  for (let pane = el.parentElement; pane; pane = pane.parentElement) {
    if (pane.scrollHeight <= pane.clientHeight || !/auto|scroll/.test(getComputedStyle(pane).overflowY)) continue;
    const box = pane.getBoundingClientRect();
    return y < box.top || y > box.bottom ? pane : null;
  }
  return null;
}
function pick(selector) {
  if (selector.startsWith('last:')) return [...document.querySelectorAll(selector.slice(5))].at(-1);
  return document.querySelector(selector);
}
// When the control is out of sight, the glow goes to whatever brings it into view.
function reach(step) {
  const w = step.app && win(step.app);
  if (step.app && !w) {
    const open = ['.start-grid [data-id="' + step.app + '"]', `.d-icon[data-open="${step.app}"]`, `[data-action="shell:task"][data-id="${step.app}"]`, '.tb-start'];
    return open.map(pick).find(usable);
  }
  if (step.app && (w.min || app.ui.active !== step.app)) return pick(`[data-action="shell:task"][data-id="${step.app}"]`);
  if (step.app === 'case' && step.tab && app.ui.caseTab !== step.tab) return pick(`.cr-tabs [data-tab="${step.tab}"]`);
  if (step.page && app.ui.browser.active !== step.page) {
    // A page that is not open yet is reached the way the learner got there: from Amina's message.
    const tab = pick(`.tab-name[data-id="${step.page}"]`);
    if (tab) return tab;
    if (app.ui.browser.active !== 'chat') return pick('.tab-name[data-id="chat"]') ?? pick('[data-action="br:new"]');
    return pick(step.page === 'drive' ? 'last:.c-card[data-action="chat:drive"]' : `last:.c-card[data-page="${step.page}"]`);
  }
  return null;
}
function target() {
  const task = nextTask(app.s), step = task.quiet ? null : path(task, app.s, app.ui);
  if (!step) return null;
  if (step.app === 'case') step.tab = {fixText: 'text', pixels: 'image', imageSet: 'image', capture: 'audio', exportAudio: 'audio'}[task.id];
  // Controls are in priority order, so a nearer step scrolled out of sight beats a later one in view.
  for (const el of step.controls.filter(Boolean).map(pick)) {
    if (usable(el)) return {el, skill: step.skill};
    const pane = scrolledAway(el);
    if (pane) return {el, skill: step.skill, pane};
  }
  return {el: reach(step), skill: step.skill};
}
function reveal(found) {
  // Only the pane moves: scrollIntoView would also slide the window frame inside its clipped edges.
  if (found.pane) {
    const r = found.el.getBoundingClientRect(), box = found.pane.getBoundingClientRect();
    found.pane.scrollTop += r.top + r.height / 2 - (box.top + box.height / 2);
  }
  return found.el;
}
// Notifications never sit on the control the learner needs next: they cross to the other side, still readable.
function dodge(el) {
  const stack = document.getElementById('toasts');
  if (!stack) return;
  const r = stack.getBoundingClientRect(), t = el?.getBoundingClientRect(), mirror = {left: innerWidth - r.right, right: innerWidth - r.left};
  const under = x => !!t && !stack.contains(el) && !!r.height && t.left < x.right && t.right > x.left && t.top < r.bottom && t.bottom > r.top;
  const moved = stack.classList.contains('dodge');
  stack.classList.toggle('dodge', moved ? under(mirror) && !under(r) : under(r) && !under(mirror));
}

const glow = () => document.getElementById('nudge');
let lastActive = 0, forced = false, current = null, frame = null;

function follow() {
  const box = glow();
  if (!current || !current.isConnected) { hide(); return; }
  const r = current.getBoundingClientRect();
  Object.assign(box.style, {left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`});
  frame = requestAnimationFrame(follow);
}
function show(el) {
  current = el;
  glow().hidden = false;
  cancelAnimationFrame(frame);
  follow();
}
function hide() {
  current = null;
  forced = false;
  glow().hidden = true;
  cancelAnimationFrame(frame);
}
const quietNow = () => app.ui.mode !== 'desktop' || !app.s.name || app.busyAudio || app.ui.meet.phase === 'incall' && app.ui.browser.active === 'meet';

function tick() {
  app.clock.after(400, tick);
  if (quietNow()) { if (current && !forced) hide(); return; }
  const found = target();
  dodge(found?.el);
  // A glow never sits on something another window now covers; the next tick finds what is reachable.
  if (current && !usable(current)) { const keep = forced; hide(); forced = keep; return; }
  if (current || !found?.el) return;
  const uses = app.ui.skills?.[found.skill] ?? 0;
  const wait = WAITS[Math.min(uses, WAITS.length - 1)];
  if (forced || app.clock.time - lastActive >= wait) show(reveal(found));
}

// Lets the first-timer test ask what would glow right now.
app.guideTarget = () => { const found = target(), el = found?.el ? reveal(found) : null; dodge(el); return el; };

// Level three of Amina's tips: light the control now, whatever the wait.
export function showMe() {
  const found = target();
  if (!found?.el) return;
  forced = true;
  app.ui.tips.open = false;
  app.render();
  requestAnimationFrame(() => { const again = target(); if (again?.el) show(reveal(again)); });
}
export function startGuide(root) {
  const activity = ev => {
    lastActive = app.clock.time;
    if (current && (current === ev.target || current.contains?.(ev.target))) {
      const found = target();
      if (found?.skill) { (app.ui.skills ??= {})[found.skill] = (app.ui.skills[found.skill] ?? 0) + 1; }
    }
    if (current) hide();
  };
  root.addEventListener('pointerdown', activity, true);
  root.addEventListener('keydown', activity, true);
  lastActive = app.clock.time;
  tick();
}
