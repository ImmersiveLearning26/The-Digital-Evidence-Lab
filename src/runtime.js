// The single running simulation: case state, shared UI state, and the loop that keeps every view in step.
import {event, initial, migrate} from './core/state.js';
import {Clock} from './core/clock.js';
import {AudioBus} from './core/audio.js';
import {clearBlobs} from './core/store.js';

const KEY = 'digital-evidence-lab-v3';

export const freshUI = () => ({
  mode: 'opening', windows: [], active: null, z: 10, start: false, quick: false, menu: null,
  unread: 0, toasts: [], heldToasts: [],
  browser: {tabs: [], active: null},
  meet: {call: null, phase: 'prejoin', captions: true, transcript: false, summary: true, position: 0},
  drive: {selected: null}, debriefTab: 'preservation', caseTab: 'summary',
  explorer: {dir: 'C:\\Cases\\0417\\Working', selected: null},
  np: {doc: null, wrap: true, find: null}, gimp: {tool: 'picker', fg: [0, 0, 0], pointer: null}, aud: {},
  settings: {captions: true, reduceMotion: false, contrast: false, volume: {dialogue: 1, evidence: .7, sfx: .5}, muted: false},
  paused: false, dev: false, status: {},
});

export const app = {
  s: initial(), ui: freshUI(), clock: new Clock(), audio: new AudioBus(), views: new Set(), actions: {}, inputs: {},
  dispatch(e) {
    this.s = event(this.s, e);
    this.persist();
    this.pump();
    this.render();
    return this.s;
  },
  // For learner actions: a refused action explains itself and nothing changes.
  attempt(e) {
    try { this.dispatch(e); return true; } catch (err) { this.guide(err.message); return false; }
  },
  guide(text) { this.onGuide?.(text); },
  persist() {
    try {
      const {paused, dev, menu, start, quick, toasts, heldToasts, ...rest} = this.ui;
      localStorage.setItem(KEY, JSON.stringify({s: this.s, ui: rest}));
    } catch { console.warn('Session storage is unavailable; progress will not survive a reload.'); }
  },
  load() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY));
      const s = migrate(saved?.s);
      if (s) {
        this.s = s;
        this.ui = {...freshUI(), ...saved.ui, paused: false, dev: false, toasts: [], heldToasts: [], aud: {}};
        // Nothing live survives a reload. An interrupted capture committed nothing, and a call rejoins.
        if (this.ui.meet.phase === 'incall') this.ui.meet.phase = 'prejoin';
        if (this.ui.audioCase) this.ui.audioCase.playing = null;
        return true;
      }
    } catch { /* Unreadable storage starts a new session. */ }
    return false;
  },
  async reset() {
    localStorage.removeItem(KEY);
    await clearBlobs().catch(() => {});
    location.reload();
  },
  queued: false,
  render() {
    if (this.queued) return;
    this.queued = true;
    requestAnimationFrame(() => { this.queued = false; for (const v of this.views) v(); });
  },
  renderNow() { for (const v of this.views) v(); },
  pump() { this.onPump?.(); },
  status(win, text) { this.ui.status[win] = text; this.render(); },
  register(actions = {}, inputs = {}) { Object.assign(this.actions, actions); Object.assign(this.inputs, inputs); },
};
window.__app = app;
