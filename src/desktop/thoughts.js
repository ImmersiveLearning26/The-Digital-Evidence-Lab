// The player's inner voice, thinking the job through out loud (lines in src/content/thoughts.js):
//   - as a task begins, what Amina asked and the plan;
//   - when the next control is on screen and the learner pauses on it, finding it by name and why;
//   - after a refusal or one of Amina's corrections, reading it and working out the fix. This one cuts in.
// Task and step thoughts are said once each, so the voice gets quieter as the software becomes familiar.
// Recorded lines play with a subtitle; a line not yet recorded shows its subtitle alone.
// It waits while Amina is speaking, during calls, while paused, and when sound or the inner voice is off.
import {app} from '../runtime.js';
import {esc} from './dom.js';
import {nextTask} from '../core/state.js';
import {nextStep} from './equipment.js';
import {guideStep} from './guide.js';
import {COPY} from '../content/copy.js';
import {THOUGHTS, STEPS, FIXES, subtitle, fileFor} from '../content/thoughts.js';

const STEP_PAUSE = 1200, FIX_FRESH = 8000, FIX_REPEAT = 20000;
let manifest = null, current = null, lastTask = null, step = {key: null, since: 0}, seenMsg = null, lastRisk = null, ticking = false;
const queue = [], lastFix = {};
fetch('assets/media/voice/thoughts/manifest.json').then(r => r.json()).then(m => { manifest = m; }).catch(() => { manifest = {lines: {}}; });

const on = () => app.ui.settings.thoughts !== false;
const busy = () => !!current || app.busyAudio || app.ui.paused || (app.ui.meet?.phase === 'incall' && app.ui.browser.active === 'meet');
const played = () => (app.ui.thoughtsPlayed ??= []);
const desk = () => app.ui.mode === 'desktop' && !!app.s.name;

// The task thought for now. The bench task comes twice: the drive first, the tape later.
function taskKey() {
  if (!desk()) return null;
  const task = nextTask(app.s);
  if (task.quiet) return null;
  return `task:${task.id === 'bench' && app.s.approved.image ? 'benchTape' : task.id}`;
}
// The step thought for the control the learner needs next, or the piece of hardware at the bench.
function stepKey() {
  if (app.ui.mode === 'equipment') return app.s.name ? `bench:${nextStep(app.s)}` : null;
  if (!desk()) return null;
  // While something is in progress there is nothing to click, so nothing to think about finding.
  if (document.querySelector('.modal[aria-label$="..."], .celebrate') || app.ui.exporting) return null;
  const found = guideStep(), task = nextTask(app.s).id;
  if (!found?.el) return null;
  for (const [tasks, sel, key] of STEPS) {
    if ((tasks === '*' || tasks.includes(task)) && found.el.matches(sel)) return key.replace('$app', found.app ?? '');
  }
  return null;
}
// Which thought answers a refusal or a correction: one of Amina's authored lines, or a known wording.
const pattern = text => new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{\w+\\\}/g, '.*?')}`);
const AUTHORED = Object.entries(COPY).filter(([k]) => THOUGHTS[`fix:${k}`]).map(([k, t]) => [pattern(t), `fix:${k}`]);
export function fixFor(text) {
  const found = [...FIXES, ...AUTHORED].find(([re]) => re.test(String(text).trim()));
  return found ? found[1] : null;
}

// A refusal: the learner stops to read it, so whatever was being thought is dropped for this.
export function think(kind, text) {
  if (kind !== 'fix' || !on()) return;
  fix(fixFor(text) ?? 'fix:other', true);
}
function fix(key, interrupt) {
  if (!THOUGHTS[key] || app.clock.time - (lastFix[key] ?? -1e9) < FIX_REPEAT) return;
  lastFix[key] = app.clock.time;
  queue.splice(0, queue.length, {key, at: app.clock.time});
  if (interrupt) hush();
  next();
}

// Amina's corrections arrive in the chat; the intake's ranking feedback arrives on the page.
function watchReplies() {
  const msgs = app.s.messages ?? [], last = msgs.at(-1)?.id ?? 0;
  if (seenMsg === null) { seenMsg = last; return; }
  for (const m of msgs) {
    if (m.id <= seenMsg || m.from === 'me' || !m.text) continue;
    const key = fixFor(m.text);
    if (key) fix(key, false);
  }
  seenMsg = last;
  const risk = app.s.riskFeedback;
  const rk = risk && !risk.ok ? `fix:${risk.key}` : null;
  if (rk && rk !== lastRisk) fix(rk, false);
  lastRisk = rk;
}

function tick() {
  app.clock.after(300, tick);
  watchThoughts();
}
export function watchThoughts() {
  if (!ticking) { ticking = true; app.clock.after(300, tick); }
  if (!on() || !manifest) return;
  watchReplies();
  const task = taskKey();
  if (task && task !== lastTask) {
    lastTask = task;
    if (THOUGHTS[task] && !played().includes(task)) { played().push(task); queue.push({key: task, task: true}); }
  }
  const key = stepKey();
  if (key !== step.key) step = {key, since: app.clock.time};
  next();
}
function next() {
  if (busy()) return;
  while (queue.length) {
    const item = queue.shift();
    // A task's thought is worth saying only while that task is current; a fix only while it is fresh.
    if (item.task ? item.key === taskKey() : app.clock.time - item.at < FIX_FRESH) { speak(item.key); return; }
  }
  if (step.key && THOUGHTS[step.key] && !played().includes(step.key) && app.clock.time - step.since >= STEP_PAUSE) {
    played().push(step.key);
    speak(step.key);
  }
}

function hush() {
  if (!current) return;
  current.audio?.pause();
  current = null;
  const host = document.getElementById('thought');
  host.hidden = true;
}
function speak(key) {
  // A line listed in the manifest plays from there; any other is tried at its usual path, so a recording dropped
  // into the folder plays without rebuilding the manifest. A missing file leaves the subtitle on its own.
  const host = document.getElementById('thought'), text = subtitle(THOUGHTS[key]);
  const file = manifest.lines[key]?.file ?? `assets/media/voice/thoughts/${fileFor(key)}`;
  host.innerHTML = `<span class="th-mark" aria-hidden="true"></span><p>${esc(text)}</p>`;
  host.hidden = false;
  host.classList.remove('out');
  place(host);
  const me = current = {key};
  const done = () => {
    if (current !== me) return;
    host.classList.add('out');
    app.clock.after(400, () => { if (current !== me) return; host.hidden = true; current = null; next(); });
  };
  if (!app.ui.settings.muted) {
    const audio = new Audio(file);
    audio.volume = Math.min(1, app.ui.settings.volume?.dialogue ?? 1);
    me.audio = audio;
    audio.addEventListener('ended', () => app.clock.after(500, done), {once: true});
    audio.play().catch(() => app.clock.after(reading(text), done));
  } else {
    app.clock.after(reading(text), done);
  }
}
// The subtitle centres in the widest stretch of desktop the notifications and the chat leave clear.
function place(host) {
  const right = innerWidth - (app.ui.dock?.open ? 384 : 0), stack = document.getElementById('toasts')?.getBoundingClientRect();
  let span = [0, right];
  if (stack?.height) {
    const spans = [[0, stack.left - 12], [stack.right + 12, right]].sort((x, y) => (y[1] - y[0]) - (x[1] - x[0]));
    if (spans[0][1] - spans[0][0] >= 360) span = spans[0];
  }
  Object.assign(host.style, {left: `${span[0]}px`, right: `${innerWidth - span[1]}px`});
}
const reading = text => Math.max(2600, text.split(' ').length * 340);
