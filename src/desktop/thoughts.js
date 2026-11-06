// The player's inner voice: a thought as each task begins, a self-correction after a refusal, a little relief
// at each milestone. Recorded lines play with a subtitle; a line not yet recorded shows its subtitle alone.
// It waits while Amina is speaking, while paused, and when sound or the inner voice is off.
import {app} from '../runtime.js';
import {esc} from './dom.js';
import {nextTask} from '../core/state.js';
import {nextStep} from './equipment.js';
import {THOUGHTS, subtitle} from '../content/thoughts.js';

let manifest = null, current = null, lastTask = null, lastOops = -1e9, turn = 0;
const queue = [];
fetch('assets/media/voice/thoughts/manifest.json').then(r => r.json()).then(m => { manifest = m; }).catch(() => { manifest = {lines: {}}; });

const on = () => app.ui.settings.thoughts !== false;
const busy = () => !!current || app.busyAudio || app.ui.paused || (app.ui.meet?.phase === 'incall' && app.ui.browser.active === 'meet');
// The thought that belongs to where the learner is now.
function taskKey() {
  const s = app.s;
  if (app.ui.mode === 'equipment') return s.approved.image && !s.hardware.headphones ? 'bench:tape' : null;
  if (app.ui.mode !== 'desktop' || !s.name) return null;
  const task = nextTask(s);
  if (task.quiet) return null;
  // The bench task comes twice: the drive first, the tape later.
  return task.id === 'bench' && s.approved.image ? 'bench:tape' : task.id;
}

export function think(kind) {
  if (!on()) return;
  if (kind === 'oops') {
    if (app.clock.time - lastOops < 25000) return;
    lastOops = app.clock.time;
  }
  turn = (turn % 3) + 1;
  queue.push({key: `${kind}:${turn}`});
}

export function watchThoughts() {
  const key = taskKey();
  if (key && key !== lastTask) {
    lastTask = key;
    const played = (app.ui.thoughtsPlayed ??= []);
    if (THOUGHTS[key] && !played.includes(key) && on()) { played.push(key); queue.push({key, task: true}); }
  }
  if (!manifest || busy() || !queue.length) return;
  const next = queue.shift();
  // A task's thought is only worth saying while that task is still the current one.
  if (next.task && next.key !== taskKey()) return;
  speak(next.key);
}

function speak(key) {
  const host = document.getElementById('thought'), text = subtitle(THOUGHTS[key]), rec = manifest.lines[key];
  host.innerHTML = `<span class="th-mark" aria-hidden="true"></span><p>${esc(text)}</p>`;
  host.hidden = false;
  host.classList.remove('out');
  place(host);
  const done = () => { host.classList.add('out'); app.clock.after(400, () => { host.hidden = true; current = null; watchThoughts(); }); };
  if (rec && !app.ui.settings.muted) {
    const audio = new Audio(rec.file);
    audio.volume = Math.min(1, app.ui.settings.volume?.dialogue ?? 1);
    current = audio;
    audio.addEventListener('ended', () => app.clock.after(600, done), {once: true});
    audio.play().catch(() => app.clock.after(reading(text), done));
  } else {
    current = {};
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
const reading = text => Math.max(2800, text.split(' ').length * 330);
