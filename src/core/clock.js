// One pausable simulation clock. Everything timed goes through here, so Pause really stops it.
export class Clock {
  constructor() { this.jobs = new Map(); this.tweens = new Set(); this.n = 0; this.paused = false; this.time = 0; this.last = performance.now(); this.frame(); }
  frame() {
    const now = performance.now(), dt = Math.min(now - this.last, 250);
    this.last = now;
    if (!this.paused && !document.hidden) {
      this.time += dt;
      for (const [id, j] of this.jobs) { j.remaining -= dt; if (j.remaining <= 0) { this.jobs.delete(id); j.fn(); } }
      for (const t of this.tweens) {
        t.elapsed += dt;
        const u = Math.min(1, t.elapsed / t.duration);
        t.step(u);
        if (u === 1) { this.tweens.delete(t); t.done(); }
      }
    }
    if (document.hidden || this.idle()) setTimeout(() => this.frame(), 100); else requestAnimationFrame(() => this.frame());
  }
  idle() { return !this.tweens.size; }
  after(ms, fn) { const id = ++this.n; this.jobs.set(id, {remaining: ms, fn}); return id; }
  tween(duration, step) { return new Promise(done => { const t = {elapsed: 0, duration: Math.max(1, duration), step, done}; this.tweens.add(t); }); }
  cancel(id) { this.jobs.delete(id); }
  clear() { this.jobs.clear(); this.tweens.clear(); }
}
