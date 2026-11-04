// Original synthesised UI tones only: no vendor sounds. Dialogue, evidence and SFX have separate levels.
export class AudioBus {
  constructor() { this.ctx = null; this.volume = {sfx: .5, dialogue: 1, evidence: .7}; this.media = new Set(); this.demo = null; this.muted = false; this.ducked = false; }
  async unlock() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx ??= new AC();
    this.master ??= (() => { const g = this.ctx.createGain(); g.connect(this.ctx.destination); return g; })();
    if (this.ctx.state === 'suspended' && !this.paused) await this.ctx.resume().catch(() => {});
  }
  tone(freq = 650, duration = .08, level = 1) {
    if (!this.ctx || this.ctx.state !== 'running' || this.muted || this.ducked) return;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain(), t = this.ctx.currentTime;
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(this.volume.sfx * .1 * level, t);
    g.gain.exponentialRampToValueAtTime(.0008, t + duration);
    o.connect(g).connect(this.master);
    o.start();
    o.stop(t + duration);
  }
  notify() { this.tone(740, .1); setTimeout(() => this.tone(988, .14), 90); }
  click() { this.tone(520, .05, .6); }
  register(el) { this.media.add(el); el.volume = this.muted ? 0 : this.volume.dialogue; }
  unregister(el) { this.media.delete(el); }
  apply() {
    for (const m of this.media) m.volume = this.muted ? 0 : this.volume.dialogue;
    if (this.master) this.master.gain.value = this.muted ? 0 : 1;
  }
  pause(on) {
    this.paused = on;
    if (this.ctx) { if (on) this.ctx.suspend(); else this.ctx.resume(); }
    for (const m of this.media) {
      if (on) { m.dataset.wasPlaying = String(!m.paused); m.pause(); }
      else if (m.dataset.wasPlaying === 'true') m.play().catch(() => {});
    }
  }
}
