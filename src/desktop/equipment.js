// The physical bench. Until the supplied GLB arrives this is a labelled control surface; when the model is
// connected it sits beside the 3D view, so every hotspot keeps a keyboard and text equivalent.
import {app} from '../runtime.js';
import {esc, morph, reducedMotion} from './dom.js';
import {mountEquipment} from '../three/equipment.js';
import {PARTS} from '../content/parts.js';

const STEPS = {
  power: {label: 'Press the tower power button', done: 'Computer is on', clip: 'power'},
  blocker: {label: 'Switch on the write-blocker', done: 'Write-blocker on: source protected', clip: 'blocker'},
  drive: {label: 'Connect evidence drive through the blocker', done: 'Drive connected through the blocker', clip: 'drive'},
  tape: {label: 'Unseal and load the microcassette', done: 'Cassette loaded, door closed', clip: 'tape'},
  interface: {label: 'Connect audio interface', done: 'Recorder connected to the interface', clip: 'interface'},
  headphones: {label: 'Plug in and put on headphones', done: 'Headphones on', clip: 'headphones'},
};
let booting = false, busy = false;

const isDone = part => (part === 'power' ? app.s.powered : app.s.hardware[part]);
const NUMBER = {power: 1, blocker: 1, drive: 2, tape: 1, interface: 2, headphones: 3};

// The one thing to do next. It never decides what is allowed: the case state still does that.
export function nextStep(s) {
  if (!s.powered) return 'power';
  if (s.intake && !s.hardware.blocker) return 'blocker';
  if (s.intake && !s.hardware.drive) return 'drive';
  if (s.approved.image && !s.hardware.tape) return 'tape';
  if (s.approved.image && !s.hardware.interface) return 'interface';
  if (s.approved.image && !s.hardware.headphones) return 'headphones';
  return 'use';
}
// A numbered, pulsing marker that sits on the real object and follows it as the camera moves.
function placePointer() {
  const el = document.getElementById('eq-pointer');
  const scene = app.scene3d, mode = app.ui.mode;
  const free = scene && !app.switching && !busy && !booting && !app.ui.paused && !scene.isMoving();
  // On the welcome page the only thing marked is Start, on the tower's power button.
  const part = free && mode === 'opening' && scene.inSplash() ? 'start' : free && mode === 'equipment' ? nextStep(app.s) : null;
  if (!part || document.querySelector('.modal')) { el.hidden = true; scene?.target(null); return; }
  scene.target(PART_FOR[part]);
  const at = scene.screenPoint(part === 'use' ? 'Screen' : part === 'start' ? 'power' : part);
  const label = part === 'use' ? 'Use the computer' : part === 'start' ? 'Start' : STEPS[part].label;
  if (el.dataset.part !== part) {
    el.dataset.part = part;
    el.querySelector('.pt-num').textContent = part === 'use' || part === 'start' ? '→' : NUMBER[part];
    el.querySelector('.pt-text').textContent = label;
    el.setAttribute('aria-label', label);
  }
  const x = Math.max(24, Math.min(innerWidth - 24, at.x)), y = Math.max(24, Math.min(innerHeight - 24, at.y));
  el.classList.toggle('flip', x > innerWidth - 560);
  el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  el.hidden = false;
}
const STATION = {power: ['power'], blocker: ['blocker', 'drive'], drive: ['blocker', 'drive'], tape: ['tape', 'interface', 'headphones'], interface: ['tape', 'interface', 'headphones'], headphones: ['tape', 'interface', 'headphones']};
function view() {
  const s = app.s, part = nextStep(s), three = !!app.scene3d;
  const stage = three ? '' : `<div class="eq-stage"><div class="eq-slot">${app.sceneState === 'loading' ? '<strong>Loading the workstation…</strong>' : '<strong>Workstation view unavailable</strong><small>Every physical action still works from the button below.</small>'}</div></div>`;
  let body;
  if (part === 'use') {
    body = `<div class="eq-say"><p>${booting ? 'The computer is starting.' : s.name ? 'Everything here is ready.' : 'The computer is on.'}</p></div><button class="btn primary big" data-action="eq:use" ${booting || busy ? 'disabled' : ''}>${booting ? 'Starting…' : s.name ? 'Back to the computer' : 'Use the computer'}</button>`;
  } else {
    const group = STATION[part], count = group.length > 1 ? `Step ${group.indexOf(part) + 1} of ${group.length}` : '';
    body = `<div class="eq-say">${count ? `<small>${count}</small>` : ''}<p>${esc(STEPS[part].label)}</p></div><button class="btn primary big" data-action="eq:do" data-part="${part}" ${busy ? 'disabled' : ''}>Do this</button>${s.powered ? '<button class="eq-back" data-action="eq:use">Back to the computer</button>' : ''}`;
  }
  const watch = app.ui.stuck?.startsWith('bench:') ? '<button class="eq-back" data-action="demo:watch">Watch how</button>' : '';
  return `${stage}<div class="eq-bar">${body}${watch}</div>`;
}

export const renderEquipment = () => {
  const el = document.getElementById('equipment');
  el.hidden = app.ui.mode !== 'equipment';
  if (app.ui.mode === 'equipment') morph(el, view());
  app.scene3d?.route(app.ui.mode === 'equipment' ? nextStep(app.s) : null);
  // The 3D loop stops when the set is hidden, so its markers are cleared here too.
  if (app.ui.mode === 'desktop') for (const id of ['eq-pointer', 'part-label']) document.getElementById(id).hidden = true;
  app.scene3d?.sync(app.s);
};

// Loaded once at start. If there is no model or no WebGL, the labelled controls carry the bench alone.
export async function initBench() {
  const stage = document.getElementById('stage3d');
  app.sceneState = 'loading';
  try {
    app.scene3d = await mountEquipment(stage, {
      paused: () => app.ui.paused, clock: app.clock, reduced: reducedMotion,
      intent: part => (app.ui.mode === 'opening' ? begin(part === 'power') : part === 'use' ? app.actions['eq:use']() : attempt(part)),
      overlay: document.getElementById('desktop'),
    });
  } catch (e) {
    console.warn('3D workstation not available:', e.message);
    app.scene3d = null;
  }
  app.sceneState = app.scene3d ? 'ready' : 'none';
  document.body.classList.toggle('has-3d', !!app.scene3d);
  if (app.scene3d) {
    app.scene3d.onFrame = () => { placePointer(); placeLabel(); };
    app.scene3d.sync(app.s);
    if (app.ui.mode === 'equipment') app.scene3d.showBench(stationFor(app.s));
    else if (app.ui.mode === 'opening') app.scene3d.showSplash();
    else app.scene3d.hide();
  }
  app.render();
}
export function stationFor(s) {
  if (s.intake && !s.hardware.drive) return 'drive';
  if (s.approved.image && !s.hardware.headphones) return 'tape';
  return 'overview';
}
// The bench step each part answers to. The object for the next step carries the amber box and its action.
const PART_FOR = {start: 'tower', power: 'tower', blocker: 'blocker', drive: 'drive', tape: 'tape', interface: 'interface', headphones: 'headphones', use: 'monitor'};
const actionText = part => (part === 'start' ? {name: 'Start', note: 'Press the workstation’s power button'} : part === 'use' ? {name: 'Monitor', note: 'Use the computer'} : {name: PARTS[PART_FOR[part]]?.name ?? '', note: STEPS[part].label});

// The label for the kit under the pointer: a dot on the object, a dotted leader out to the side with
// room, and the name over one plain line on what it is for. With nothing under the pointer, the object
// to act on next keeps its label, in amber, saying what to do.
const LEADER = {rise: 30, run: 64};
function placeLabel() {
  const el = document.getElementById('part-label');
  const scene = app.scene3d, mode = app.ui.mode, pointer = document.getElementById('eq-pointer');
  const live = scene && (mode === 'opening' || mode === 'equipment') && !app.switching && !app.ui.paused && !scene.isMoving();
  const step = live && !pointer.hidden ? pointer.dataset.part : null, goal = step && PART_FOR[step];
  const over = live ? scene.hovered() : null, act = !!goal && (!over || over === goal);
  const h = live ? scene.partAnchor(act ? goal : over) : null;
  const text = h && (act ? actionText(step) : PARTS[h.id]);
  if (!text || document.querySelector('.modal')) { el.hidden = true; el.dataset.id = ''; return; }
  // Keep clear of the screen edge and, on the welcome page, of the title's column.
  const wall = document.querySelector('#opening:not([hidden]) .splash')?.getBoundingClientRect().left ?? innerWidth;
  const up = h.y > 110, side = h.x + LEADER.run + 260 > Math.min(innerWidth, wall - 12) ? 'left' : h.x - LEADER.run - 260 < 0 ? 'right' : h.side;
  const key = `${h.id}:${side}:${up}:${act ? step : ''}`;
  if (el.dataset.id !== key) {
    el.dataset.id = key;
    el.querySelector('.pl-name').textContent = text.name;
    el.querySelector('.pl-note').textContent = text.note;
    // The leader sits in its own box beside the dot, so it can draw itself out from the object.
    const {rise, run} = LEADER, svg = el.querySelector('svg'), right = side === 'right';
    const near = right ? 0 : run, bend = right ? rise : run - rise, far = right ? run : 0, low = up ? rise : 0, high = up ? 0 : rise;
    svg.setAttribute('width', run);
    svg.setAttribute('height', rise);
    svg.style.left = `${right ? 0 : -run}px`;
    svg.style.top = `${up ? -rise : 0}px`;
    el.querySelector('polyline').setAttribute('points', `${near},${low} ${bend},${high} ${far},${high}`);
    el.className = `part-label ${side} ${up ? 'up' : 'down'}${act ? ' act' : ''}`;
    el.hidden = false;
    void el.offsetWidth;
    el.classList.add('in');
  }
  el.style.transform = `translate(${Math.round(h.x)}px, ${Math.round(h.y)}px)`;
}

async function attempt(part) {
  if (busy || isDone(part)) return;
  // Validate first: a refused action never plays its success animation.
  const {event} = await import('../core/state.js');
  const evt = part === 'power' ? {type: 'POWER'} : {type: 'HARDWARE', part};
  try { event(app.s, evt); } catch (e) { app.guide(e.message); return; }
  app.scene3d?.activate(PART_FOR[part]);
  busy = true; app.render();
  await (app.scene3d?.play(STEPS[part].clip) ?? app.clock.tween(reducedMotion() ? 1 : 280, () => {}));
  busy = false;
  app.audio.click();
  app.dispatch(evt);
  const device = {drive: ['Evidence Drive connected', 'Read-only through the write-blocker. Evidence Imager can see it now.'], interface: ['USB Audio Interface ready', 'Audio Recorder can use it as a recording device.']}[part];
  if (device) app.ui.heldToasts.push({system: true, title: device[0], text: device[1]});
  if (part === 'power') {
    booting = true; app.render();
    document.body.classList.add('booting');
    app.clock.after(reducedMotion() ? 50 : 1400, () => { booting = false; document.body.classList.remove('booting'); app.render(); });
  }
  // Bench work done: pull back so the monitor they need next is in view.
  if (app.scene3d && nextStep(app.s) === 'use') {
    busy = true; app.render();
    await app.scene3d.focus('overview');
    busy = false; app.render();
  }
}

// Any press on the welcome page opens the bench. Start is the tower's power button, so it also switches
// the computer on.
async function begin(power) {
  if (app.switching) return;
  if (power) app.scene3d?.activate('tower');
  await app.audio.unlock();
  await app.setMode('equipment');
  if (power) attempt('power');
}

app.register({
  'eq:do': el => attempt(el.dataset.part),
  'eq:use': () => { if (app.s.powered && !busy) { app.scene3d?.activate('monitor'); app.setMode('desktop'); } },
  'eq:pointer': el => { const part = el.dataset.part; if (part === 'start') begin(true); else if (part === 'use') { app.scene3d?.activate('monitor'); app.setMode('desktop'); } else attempt(part); },
  'shell:equipment': () => app.setMode('equipment'),
});
