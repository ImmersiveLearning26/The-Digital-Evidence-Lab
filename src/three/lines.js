// Vector line work drawn over the workstation: cable routes with a travelling pulse, outlines that draw
// themselves onto the desk, and corner brackets that frame whatever the learner points at.
// Lines never take the place of the objects: they only mark them. Each stroke has a thin dark casing,
// so it reads on the white desk and on the navy floor alike.

const ACCENT = 0x37e3d2, WHITE = 0xf4f7ff, CASING = 0x0a0f24, ACTION = 0xffc84a;
const PULSE = .08, PULSE_SPEED = .3;

export function createLines(THREE, {Line2, LineGeometry, LineSegments2, LineSegmentsGeometry, LineMaterial}, {scene, nodes, manifest, reduced}) {
  const group = new THREE.Group();
  scene.add(group);
  const materials = [];
  const material = (color, linewidth, dashed) => {
    const m = new LineMaterial({color, linewidth, transparent: true, opacity: 1, dashed, depthTest: false, depthWrite: false, toneMapped: false});
    materials.push(m);
    return m;
  };
  // A cased stroke: the casing and the colour share one geometry and every dash setting.
  const stroke = (points, {color = ACCENT, width = 1.2, opacity = 1, dashed = false, casing = .38} = {}) => {
    const g = new LineGeometry();
    g.setPositions(points.flatMap(p => [p.x, p.y, p.z]));
    const under = new Line2(g, material(CASING, width + 2.2, dashed)), over = new Line2(g, material(color, width, dashed));
    for (const l of [under, over]) { l.computeLineDistances(); group.add(l); }
    under.renderOrder = 10;
    over.renderOrder = 11;
    const total = points.reduce((sum, p, i) => sum + (i ? p.distanceTo(points[i - 1]) : 0), 0);
    return {
      total, over,
      set(props) { Object.assign(under.material, props); Object.assign(over.material, props); },
      show(on) { under.visible = over.visible = on; },
      fade(k) { over.material.opacity = opacity * k; under.material.opacity = casing * opacity * k; },
    };
  };
  const fromExtras = flat => { const out = []; for (let i = 0; i < flat.length; i += 3) out.push(new THREE.Vector3(flat[i], flat[i + 1], flat[i + 2])); return out; };

  // ---- Every part's box, measured once from the model.
  const boxes = {};
  for (const [id, names] of Object.entries(manifest.parts ?? {})) {
    const box = new THREE.Box3();
    for (const n of names) if (nodes[n]) box.expandByObject(nodes[n]);
    if (!box.isEmpty()) boxes[id] = box;
  }
  const deskBox = nodes.Desk ? new THREE.Box3().setFromObject(nodes.Desk) : null;

  // ---- Outlines on the desk under each part, and round the desk top, drawn on one after another.
  const rect = (box, lift = .0025, pad = .014) => {
    const y = box.min.y + lift, a = box.min.x - pad, b = box.max.x + pad, c = box.min.z - pad, d = box.max.z + pad;
    return [new THREE.Vector3(a, y, c), new THREE.Vector3(b, y, c), new THREE.Vector3(b, y, d), new THREE.Vector3(a, y, d), new THREE.Vector3(a, y, c)];
  };
  const outlines = {}, draw = [];
  const addOutline = (id, points, opacity, delay) => {
    const s = stroke(points, {opacity, width: 1, dashed: true});
    s.set({dashSize: s.total, gapSize: s.total, dashOffset: s.total});
    const entry = {stroke: s, delay, progress: 0, opacity};
    draw.push(entry);
    if (id) outlines[id] = entry;
  };
  if (deskBox) addOutline(null, rect(new THREE.Box3(new THREE.Vector3(deskBox.min.x, deskBox.max.y, deskBox.min.z), deskBox.max.clone()), .001, .006), .55, 0);
  Object.entries(boxes).forEach(([id, box], i) => addOutline(id, rect(box), .7, .35 + i * .14));

  // ---- Evidence routes: the cables the learner connects, as a quiet trace with a pulse travelling along it.
  // Permanently wired cables are left alone; they run behind the kit and would only add noise.
  const routes = [];
  for (const name of Object.values(manifest.routes ?? {})) {
    const extras = nodes[name]?.userData;
    if (!extras?.line_rest) continue;
    const node = nodes[name];
    const make = flat => {
      const pts = fromExtras(flat);
      const trace = stroke(pts, {opacity: .45, width: 1}), pulse = stroke(pts, {opacity: 1, width: 2.4, dashed: true});
      return {trace, pulse, total: trace.total};
    };
    routes.push({name: node.name, lines: {rest: make(extras.line_rest), seated: extras.line_seated ? make(extras.line_seated) : null}, shape: 'rest', phase: Math.random(), visible: true});
  }

  // ---- Corner brackets round the part under the pointer.
  const bracketUnder = material(CASING, 3.6, false), bracketOver = material(WHITE, 1.6, false);
  const bracketGeometry = new LineSegmentsGeometry();
  const brackets = [new LineSegments2(bracketGeometry, bracketUnder), new LineSegments2(bracketGeometry, bracketOver)];
  brackets.forEach((b, i) => { b.renderOrder = 12 + i; b.visible = false; group.add(b); });
  const bracketPositions = (box, k) => {
    const out = [];
    const {min, max} = box, size = box.getSize(new THREE.Vector3()), len = Math.min(size.x, size.y, size.z, .12) * k + .004;
    for (const x of [min.x, max.x]) for (const y of [min.y, max.y]) for (const z of [min.z, max.z]) {
      const sx = x === min.x ? 1 : -1, sy = y === min.y ? 1 : -1, sz = z === min.z ? 1 : -1;
      out.push(x, y, z, x + sx * len, y, z, x, y, z, x, y + sy * len, z, x, y, z, x, y, z + sz * len);
    }
    return out;
  };

  // ---- The object to activate next: an amber box whose dashed edges keep moving, with firm corners.
  const edges = box => {
    const {min: a, max: b} = box, out = [];
    const c = [[a.x, a.y, a.z], [b.x, a.y, a.z], [b.x, a.y, b.z], [a.x, a.y, b.z], [a.x, b.y, a.z], [b.x, b.y, a.z], [b.x, b.y, b.z], [a.x, b.y, b.z]];
    for (const [i, j] of [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]) out.push(...c[i], ...c[j]);
    return out;
  };
  const segments = (width, color, dashed, order) => {
    const under = new LineSegments2(new LineSegmentsGeometry(), material(CASING, width + 2.2, dashed));
    const over = new LineSegments2(new LineSegmentsGeometry(), material(color, width, dashed));
    [under, over].forEach((l, i) => { l.renderOrder = order + i; l.visible = false; group.add(l); });
    return {
      draw(positions) { for (const l of [under, over]) { l.geometry.setPositions(positions); l.computeLineDistances(); } },
      set(props) { Object.assign(under.material, props); Object.assign(over.material, props); },
      show(on, k = 1) { under.visible = over.visible = on; over.material.opacity = k; under.material.opacity = .4 * k; },
    };
  };
  const goalEdges = segments(1.3, ACTION, true, 14), goalCorners = segments(2.4, ACTION, false, 16);
  goalEdges.set({dashSize: .018, gapSize: .012});
  // A press opens the object up: its whole box traces round, then expands outward and dissolves.
  const burst = segments(1.6, ACTION, true, 18);
  let goal = null, goalT = 0, goalDrawn = null, bursting = null;

  let mode = 'off', hovered = null, hoverT = 0, drawn = null, focusRoute = null, time = 0;
  const fades = {outlines: 0, routes: 0}, targets = {outlines: 0, routes: 0};

  return {
    boxes,
    resize(w, h) { for (const m of materials) m.resolution.set(w, h); },
    // 'splash' shows every route and outline; 'bench' keeps only what the current step needs.
    setMode(next) {
      mode = next;
      targets.outlines = next === 'splash' ? 1 : next === 'bench' ? .35 : 0;
      targets.routes = next === 'off' ? 0 : 1;
      if (next === 'splash') for (const d of draw) d.progress = reduced() ? 1 : 0;
      time = 0;
    },
    // Cables follow the bench: a connected cable traces its seated path, a worn headset none.
    sync(s) {
      for (const r of routes) {
        const step = Object.entries(manifest.routes ?? {}).find(([, n]) => n === r.name)?.[0];
        const done = step && s.hardware?.[step];
        r.shape = r.lines.seated && (done || (mode === 'bench' && r.name === focusRoute)) ? 'seated' : 'rest';
        r.visible = !(step === 'headphones' && done);
      }
    },
    // At the bench, the cable for the next step shows where it will go.
    focus(name) { focusRoute = name; },
    // Mark the part the learner should act on next, or nothing.
    target(id) {
      if (id === goal) return;
      goal = id;
      goalT = reduced() ? 1 : 0;
      goalDrawn = null;
    },
    // The press itself, played on the part that was activated.
    activate(id) {
      const box = boxes[id];
      if (box) bursting = {box: box.clone().expandByScalar(.016), t: 0};
    },
    hover(id) {
      if (id === hovered) return;
      hovered = id;
      hoverT = reduced() ? 1 : 0;
      drawn = null;
    },
    update(dt) {
      time += dt;
      for (const k of Object.keys(fades)) fades[k] += (targets[k] - fades[k]) * Math.min(1, dt * (reduced() ? 60 : 4));
      for (const d of draw) {
        if (time > d.delay) d.progress = Math.min(1, d.progress + dt / .9);
        const p = 1 - (1 - d.progress) ** 3, lit = hovered && outlines[hovered] === d;
        d.stroke.set({dashOffset: d.stroke.total * (1 - p)});
        d.stroke.over.material.color.setHex(lit ? WHITE : ACCENT);
        d.stroke.fade(lit ? 1 / d.opacity : fades.outlines);
      }
      for (const r of routes) {
        const show = r.visible && (mode === 'splash' || r.name === focusRoute) && fades.routes > .01;
        r.phase = (r.phase + dt * PULSE_SPEED) % 1;
        for (const [shape, l] of Object.entries(r.lines)) {
          if (!l) continue;
          const on = show && shape === r.shape;
          l.trace.show(on);
          l.pulse.show(on);
          if (!on) continue;
          l.pulse.set({dashSize: PULSE, gapSize: l.total + PULSE, dashOffset: reduced() ? 0 : -r.phase * (l.total + PULSE)});
          l.trace.fade(fades.routes);
          l.pulse.fade(fades.routes);
        }
      }
      // The goal keeps its amber box; pointing at it brings the dashes up to full strength.
      const gbox = goal && boxes[goal] && !bursting ? boxes[goal] : null;
      if (gbox) {
        goalT = Math.min(1, goalT + dt / .45);
        const k = 1 - (1 - goalT) ** 3, near = hovered === goal;
        if (goalDrawn !== `${goal}:${goalT}`) {
          const grown = gbox.clone().expandByScalar(.016);
          goalEdges.draw(edges(grown));
          goalCorners.draw(bracketPositions(grown, k));
          goalDrawn = goalT === 1 ? `${goal}:1` : null;
        }
        goalEdges.set({dashOffset: reduced() ? 0 : -time * .06});
        const breathe = reduced() ? 1 : .8 + .2 * Math.sin(time * 3.2);
        goalEdges.show(true, k * (near ? 1 : .7) * breathe);
        goalCorners.show(true, k);
      } else { goalEdges.show(false); goalCorners.show(false); }
      if (bursting) {
        bursting.t = Math.min(1, bursting.t + dt / .75);
        const t = bursting.t, trace = Math.min(1, t / .35), spread = Math.max(0, (t - .35) / .65);
        const grown = bursting.box.clone().expandByVector(bursting.box.getSize(new THREE.Vector3()).multiplyScalar(spread * .35));
        burst.draw(edges(grown));
        const size = grown.getSize(new THREE.Vector3()), total = 4 * (size.x + size.y + size.z);
        burst.set({dashSize: total, gapSize: total, dashOffset: total * (1 - trace)});
        burst.show(true, 1 - spread ** 2);
        if (t === 1) { bursting = null; burst.show(false); }
      }

      const box = hovered && hovered !== goal && boxes[hovered];
      for (const b of brackets) b.visible = !!box;
      if (box && drawn !== hovered) {
        hoverT = Math.min(1, hoverT + dt / .32);
        const k = 1 - (1 - hoverT) ** 3;
        bracketGeometry.setPositions(bracketPositions(box.clone().expandByScalar(.012), k));
        bracketOver.opacity = k;
        bracketUnder.opacity = .4 * k;
        if (hoverT === 1) drawn = hovered;
      }
    },
  };
}
