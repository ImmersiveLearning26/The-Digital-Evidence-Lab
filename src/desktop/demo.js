// Plays a "Watch how it's done" demo: thin vector outlines that draw themselves, a cursor that travels to
// each real-named control, and an amber ring where it clicks. Only what the step needs is ever drawn.
import {app} from '../runtime.js';
import {esc} from './dom.js';
import {modal} from './modal.js';
import {DEMOS} from '../content/demos.js';

const NS = 'http://www.w3.org/2000/svg';
const W = 560, H = 320;
const WIN = {x: 28, y: 16, w: 504, h: 262};
const SPOTS = {center: [220, 150, 120, 30], br: [400, 234, 116, 28], bl: [44, 234, 96, 28], tr: [400, 58, 116, 26]};
const CURSOR = 'M0 0L0 16L4.5 12L7.5 18.5L10 17.3L7 11L12.5 11Z';

export const hasDemo = key => !!DEMOS[key];

export function watchDemo(key, title = 'Watch how it’s done') {
  const beats = DEMOS[key];
  if (!beats) return;
  let alive = true;
  const done = modal({
    title, cls: 'demo cd', titlebar: false, width: 620, owner: null,
    view: () => `<h2 class="cd-title">${esc(title)}</h2><svg class="dm-stage" viewBox="0 0 ${W} ${H}" role="img" aria-label="Animated demonstration"></svg>
      <p class="dm-say" aria-live="polite"><b></b><span></span></p>
      <footer class="modal-foot"><button class="btn" data-m="replay">Replay</button><button class="btn primary" data-m="close" data-default>Got it</button></footer>`,
    actions: {close: (el, ev, api) => api.close(true), replay: () => run()},
  });
  const box = done.api.element, svg = box.querySelector('svg'), say = box.querySelector('.dm-say');
  done.then(() => { alive = false; });
  let runId = 0;
  const run = async () => {
    const id = ++runId;
    const live = () => alive && id === runId;
    const quick = document.documentElement.classList.contains('reduce-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
    const wait = ms => new Promise(r => app.clock.after(quick ? Math.min(ms, 900) : ms, r));
    const stage = new Stage(svg);
    for (let loop = 0; live(); loop++) {
      stage.reset();
      let n = 0;
      for (const beat of beats) {
        if (!live()) return;
        if (beat.say) { say.querySelector('b').textContent = ++n; say.querySelector('span').textContent = beat.say; }
        await stage.play(beat, wait);
      }
      await wait(1800);
    }
  };
  run();
  return done;
}

// Layout and drawing for one demo. Everything drawn is an outline or a label, nothing more.
class Stage {
  constructor(svg) { this.svg = svg; }
  reset() {
    this.svg.replaceChildren();
    this.base = this.layer('dm-base');
    this.over = this.layer('dm-over');
    this.cursor = this.el('path', {d: CURSOR, class: 'dm-cursor'}, this.svg);
    this.at = [W / 2, H - 20];
    this.moveCursor(this.at, true);
    this.menuX = WIN.x + 14;
    this.devices = {};
  }
  layer(cls) { return this.el('g', {class: cls}, this.svg); }
  el(tag, attrs, parent = this.base) {
    const n = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    parent.append(n);
    return n;
  }
  rect([x, y, w, h], cls = 'dm-line', parent = this.base, r = 4) { return this.el('rect', {x, y, width: w, height: h, rx: r, pathLength: 1, class: `dm-draw ${cls}`}, parent); }
  text(x, y, s, cls = 'dm-text', parent = this.base, anchor = 'start') { const t = this.el('text', {x, y, class: cls, 'text-anchor': anchor}, parent); t.textContent = s; return t; }
  button(spot, label, parent = this.base, primary = false) {
    const g = this.el('g', {}, parent), [x, y, w, h] = spot;
    this.rect(spot, primary ? 'dm-line dm-primary' : 'dm-line', g);
    this.text(x + w / 2, y + h / 2 + 4, label, 'dm-text', g, 'middle');
    return {g, spot};
  }
  window(title) {
    this.base.replaceChildren();
    this.over.replaceChildren();
    this.rect([WIN.x, WIN.y, WIN.w, WIN.h], 'dm-line dm-frame', this.base, 8);
    this.el('line', {x1: WIN.x, x2: WIN.x + WIN.w, y1: WIN.y + 30, y2: WIN.y + 30, pathLength: 1, class: 'dm-draw dm-line'});
    this.text(WIN.x + 14, WIN.y + 20, title, 'dm-title');
    this.menuX = WIN.x + 14;
  }
  moveCursor([x, y], now = false) {
    this.cursor.style.transition = now ? 'none' : '';
    this.cursor.style.transform = `translate(${x}px, ${y}px)`;
    this.at = [x, y];
  }
  async click(spot, wait) {
    const [x, y, w, h] = spot, to = [x + w / 2, y + h / 2];
    this.moveCursor(to);
    await wait(650);
    const ring = this.el('circle', {cx: to[0], cy: to[1], r: 4, class: 'dm-ring'}, this.over);
    await wait(260);
    ring.remove();
  }
  mark(target) { target?.g?.querySelector('rect')?.classList.add('dm-hit'); }

  async play(b, wait) {
    if (b.app) { this.window(b.app); await wait(500); return; }
    if (b.launch) {
      this.base.replaceChildren();
      this.over.replaceChildren();
      const bar = [0, H - 34, W, 34];
      this.rect(bar, 'dm-line dm-bar', this.base, 0);
      const start = this.button([W / 2 - 17, H - 30, 34, 26], '⊞');
      await wait(450);
      await this.click(start.spot, wait);
      this.mark(start);
      const panel = [W / 2 - 150, 74, 300, 196];
      this.rect(panel, 'dm-line dm-panel', this.over, 8);
      // Six pinned tiles, the one to open always among them.
      const tiles = ['Browser', 'Case Record', 'File Explorer', 'Evidence Imager', 'Text Editor', 'Image Editor'];
      if (!tiles.includes(b.launch)) tiles[5] = b.launch;
      let pick;
      tiles.forEach((t, i) => {
        const spot = [panel[0] + 14 + (i % 3) * 92, panel[1] + 22 + Math.floor(i / 3) * 70, 84, 58];
        const tile = this.button(spot, {'File Explorer': 'Explorer'}[t] ?? t, this.over);
        if (t === b.launch) pick = tile;
      });
      await wait(500);
      await this.click(pick.spot, wait);
      this.mark(pick);
      await wait(300);
      this.window(b.launch);
      await wait(500);
      return;
    }
    if (b.menu) {
      this.over.replaceChildren();
      let x = WIN.x + 14, pick;
      for (const m of b.items) {
        const w = m.length * 7 + 14, spot = [x - 6, WIN.y + 36, w, 20];
        const g = this.el('g', {});
        this.rect(spot, 'dm-line dm-faint', g);
        this.text(x + 1, WIN.y + 50, m, 'dm-text', g);
        if (m === b.menu) { pick = {g, spot}; this.menuX = x - 6; }
        x += w + 4;
      }
      await wait(450);
      await this.click(pick.spot, wait);
      this.mark(pick);
      return;
    }
    if (b.item) {
      const x = this.menuX, y = WIN.y + 60, w = 176, panel = [x, y, w, b.items.length * 24 + 8];
      this.rect(panel, 'dm-line dm-panel', this.over);
      let pick;
      b.items.forEach((t, i) => {
        const spot = [x + 4, y + 4 + i * 24, w - 8, 22];
        const g = this.el('g', {}, this.over);
        this.rect(spot, 'dm-line dm-faint', g, 3);
        this.text(spot[0] + 10, spot[1] + 15, t, 'dm-text', g);
        if (t === b.item) pick = {g, spot};
      });
      await wait(450);
      await this.click(pick.spot, wait);
      this.mark(pick);
      await wait(250);
      this.over.replaceChildren();
      return;
    }
    if (b.dialog) {
      this.over.replaceChildren();
      const d = [134, 64, 292, 192];
      this.rect(d, 'dm-line dm-panel', this.over, 8);
      this.el('line', {x1: d[0], x2: d[0] + d[2], y1: d[1] + 26, y2: d[1] + 26, pathLength: 1, class: 'dm-draw dm-line'}, this.over);
      this.text(d[0] + 12, d[1] + 17, b.dialog, 'dm-title', this.over);
      let pick;
      b.rows.forEach((r, i) => {
        const spot = [d[0] + 12, d[1] + 38 + i * 26, d[2] - 24, 22];
        const g = this.el('g', {}, this.over);
        this.rect(spot, 'dm-line dm-faint', g, 3);
        this.text(spot[0] + 10, spot[1] + 15, r, 'dm-text', g);
        if (r === b.pick) pick = {g, spot};
      });
      const ok = this.button([d[0] + d[2] - 84, d[1] + d[3] - 36, 72, 26], b.ok, this.over, true);
      await wait(500);
      await this.click(pick.spot, wait);
      this.mark(pick);
      await this.click(ok.spot, wait);
      this.mark(ok);
      await wait(250);
      this.over.replaceChildren();
      return;
    }
    if (b.press) {
      const target = this.button(Array.isArray(b.at) ? b.at : SPOTS[b.at ?? 'center'], b.press, this.base, true);
      await wait(400);
      await this.click(target.spot, wait);
      this.mark(target);
      return;
    }
    if (b.tabs) {
      const w = (WIN.w - 28) / b.tabs.length;
      let pick;
      b.tabs.forEach((t, i) => {
        const spot = [WIN.x + 14 + i * w, WIN.y + 38, w - 6, 24];
        const g = this.el('g', {});
        this.rect(spot, 'dm-line dm-faint', g, 3);
        this.text(spot[0] + spot[2] / 2, spot[1] + 16, t, 'dm-text', g, 'middle');
        if (t === b.pick) pick = {g, spot};
      });
      await wait(400);
      await this.click(pick.spot, wait);
      this.mark(pick);
      return;
    }
    if (b.rows) {
      const rows = b.rows.map((r, i) => {
        const spot = [WIN.x + 20, WIN.y + 76 + i * 34, WIN.w - 40, 28];
        const g = this.el('g', {});
        this.rect(spot, 'dm-line dm-faint', g);
        this.text(spot[0] + 12, spot[1] + 18, r, 'dm-text', g);
        return {g, spot};
      });
      await wait(450);
      for (const i of b.picks) { await this.click(rows[i].spot, wait); this.mark(rows[i]); }
      return;
    }
    if (b.card) {
      const c = [WIN.x + 30, WIN.y + 64, 300, 100];
      const g = this.el('g', {});
      this.rect(c, 'dm-line', g, 8);
      this.text(c[0] + 16, c[1] + 26, b.card, 'dm-title', g);
      this.el('line', {x1: c[0] + 16, x2: c[0] + 200, y1: c[1] + 42, y2: c[1] + 42, pathLength: 1, class: 'dm-draw dm-line dm-faint'}, g);
      const button = this.button([c[0] + 16, c[1] + 58, 88, 28], b.press, g, true);
      await wait(450);
      await this.click(button.spot, wait);
      this.mark(button);
      if (b.opens) { await wait(350); this.window(b.opens); await wait(400); }
      return;
    }
    if (b.choose) {
      // Blank options only: the demo shows where the choice is made, never which choice to make.
      const w = Math.min(150, (WIN.w - 60) / b.choose.length - 12);
      for (const [i, label] of b.choose.entries()) {
        const spot = [WIN.x + 30 + i * (w + 12), WIN.y + 100, w, 28];
        this.text(spot[0], spot[1] - 8, label, 'dm-small');
        const field = {g: this.el('g', {}), spot};
        this.rect(spot, 'dm-line', field.g);
        this.text(spot[0] + 10, spot[1] + 18, 'Choose', 'dm-text dm-dim', field.g);
        await wait(250);
        await this.click(spot, wait);
        const list = this.el('g', {}, this.over);
        this.rect([spot[0], spot[1] + 32, w, 66], 'dm-line dm-panel', list);
        for (let k = 0; k < 3; k++) this.el('line', {x1: spot[0] + 12, x2: spot[0] + w - 16 - k * 14, y1: spot[1] + 48 + k * 18, y2: spot[1] + 48 + k * 18, pathLength: 1, class: 'dm-draw dm-line dm-faint'}, list);
        await wait(350);
        await this.click([spot[0], spot[1] + 58, w, 16], wait);
        list.remove();
        field.g.querySelector('.dm-dim').textContent = '•  •  •';
        this.mark(field);
      }
      return;
    }
    if (b.check) {
      const spot = [WIN.x + 30, WIN.y + 196, 16, 16];
      const g = this.el('g', {});
      this.rect(spot, 'dm-line', g, 3);
      this.text(spot[0] + 26, spot[1] + 12, b.check, 'dm-text', g);
      await wait(350);
      await this.click(spot, wait);
      this.el('path', {d: `M${spot[0] + 3} ${spot[1] + 8}l4 4 6-8`, pathLength: 1, class: 'dm-draw dm-tick'}, g);
      return;
    }
    if (b.type) {
      const spot = [200, 112, 160, 30];
      this.text(spot[0], spot[1] - 8, b.label, 'dm-small');
      const g = this.el('g', {});
      this.rect(spot, 'dm-line', g);
      await wait(300);
      await this.click(spot, wait);
      const t = this.text(spot[0] + 12, spot[1] + 20, '', 'dm-text', g);
      for (let i = 1; i <= b.type.length; i++) { t.textContent = b.type.slice(0, i); await wait(90); }
      this.mark({g});
      return;
    }
    if (b.toast) {
      this.base.replaceChildren();
      const t = [W - 236, H - 150, 210, 112];
      const g = this.el('g', {});
      this.rect(t, 'dm-line dm-panel', g, 8);
      this.text(t[0] + 14, t[1] + 26, b.toast, 'dm-title', g);
      this.el('line', {x1: t[0] + 14, x2: t[0] + 170, y1: t[1] + 44, y2: t[1] + 44, pathLength: 1, class: 'dm-draw dm-line dm-faint'}, g);
      const button = this.button([t[0] + 14, t[1] + 66, t[2] - 28, 28], b.press, g, true);
      await wait(500);
      await this.click(button.spot, wait);
      this.mark(button);
      await wait(300);
      return;
    }
    if (b.taskbar) {
      this.base.replaceChildren();
      this.rect([0, H - 34, W, 34], 'dm-line dm-bar', this.base, 0);
      this.button([W / 2 - 17, H - 30, 34, 26], '⊞');
      const chip = this.button([W - 170, H - 30, 120, 26], b.taskbar, this.base, true);
      await wait(450);
      await this.click(chip.spot, wait);
      this.mark(chip);
      return;
    }
    // ---- The bench, as a schematic: boxes for the kit, a line for each cable.
    if (b.devices) {
      this.base.replaceChildren();
      this.over.replaceChildren();
      const w = 116, gap = 34, total = b.devices.length * w + (b.devices.length - 1) * gap;
      b.devices.forEach((name, i) => {
        const spot = [(W - total) / 2 + i * (w + gap), 104, w, 72];
        const g = this.el('g', {class: 'dm-device'});
        this.rect(spot, 'dm-line', g, 6);
        this.text(spot[0] + w / 2, spot[1] + 40, name, 'dm-text', g, 'middle');
        this.devices[name] = {g, spot};
      });
      await wait(600);
      return;
    }
    const dev = name => this.devices[name];
    if (b.power) {
      const d = dev(b.power);
      await this.click(d.spot, wait);
      this.mark(d);
      this.el('circle', {cx: d.spot[0] + d.spot[2] - 12, cy: d.spot[1] + 12, r: 4, class: 'dm-led'}, d.g);
      return;
    }
    if (b.plug) {
      const [a, c] = b.plug.map(dev), from = [a.spot[0] + a.spot[2] / 2, a.spot[1] + a.spot[3]], to = [c.spot[0] + c.spot[2] / 2, c.spot[1] + c.spot[3]];
      this.moveCursor(from);
      await wait(650);
      const low = 236;
      this.el('path', {d: `M${from[0]} ${from[1]}V${low}H${to[0]}V${to[1]}`, pathLength: 1, class: 'dm-draw dm-cable'});
      this.moveCursor(to);
      await wait(800);
      const ring = this.el('circle', {cx: to[0], cy: to[1], r: 4, class: 'dm-ring'}, this.over);
      this.mark(c);
      await wait(300);
      ring.remove();
      return;
    }
    if (b.insert) {
      const [a, c] = b.insert.map(dev);
      await this.click(a.spot, wait);
      const dx = c.spot[0] - a.spot[0], dy = 0;
      a.g.style.transition = 'transform .9s cubic-bezier(.3,.7,.2,1), opacity .9s';
      this.moveCursor([c.spot[0] + c.spot[2] / 2, c.spot[1] + c.spot[3] / 2]);
      a.g.style.transform = `translate(${dx}px, ${dy}px) scale(.6)`;
      a.g.style.transformOrigin = `${a.spot[0] + a.spot[2] / 2}px ${a.spot[1] + a.spot[3] / 2}px`;
      a.g.style.opacity = '.0';
      await wait(950);
      this.mark(c);
      return;
    }
    if (b.lift) {
      const a = dev(b.lift);
      await this.click(a.spot, wait);
      a.g.style.transition = 'transform .9s cubic-bezier(.3,.7,.2,1), opacity .9s';
      a.g.style.transform = 'translateY(-60px)';
      a.g.style.opacity = '0';
      this.moveCursor([a.spot[0] + a.spot[2] / 2, a.spot[1] - 40]);
      await wait(950);
    }
  }
}
