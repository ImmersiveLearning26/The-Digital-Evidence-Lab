// The persistent 3D bench. It shows the workstation GLB and keeps the live desktop pinned to the monitor.
// The desktop is ordinary DOM throughout: it is never rendered into a texture, so software stays sharp
// and usable. Three.js loads only when enable3D is set, so the simulation never depends on WebGL.
import {createLines} from './lines.js';

const ease = t => t * t * (3 - 2 * t);
const lerpQuad = (a, b, t) => a.map((p, i) => [p[0] + (b[i][0] - p[0]) * t, p[1] + (b[i][1] - p[1]) * t]);
const NAVY = '#141c3a';

// CSS matrix that maps a W × H rectangle onto four screen points (top-left, top-right, bottom-right, bottom-left).
function quadMatrix(W, H, [[x0, y0], [x1, y1], [x2, y2], [x3, y3]]) {
  const dx1 = x1 - x2, dx2 = x3 - x2, sx = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, sy = y0 - y1 + y2 - y3;
  const det = dx1 * dy2 - dx2 * dy1;
  const g = (sx * dy2 - dx2 * sy) / det, h = (dx1 * sy - sx * dy1) / det;
  const a = x1 - x0 + g * x1, b = x3 - x0 + h * x3, d = y1 - y0 + g * y1, e = y3 - y0 + h * y3;
  return `matrix3d(${[a / W, d / W, 0, g / W, b / H, e / H, 0, h / H, 0, 0, 1, 0, x0, y0, 0, 1].map(n => n.toFixed(8)).join(',')})`;
}

// A soft radial wash, for the studio backdrop and the floor's fade into it.
function radial(THREE, size, stops) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d'), grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [at, colour] of stops) grad.addColorStop(at, colour);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export async function mountEquipment(host, {paused, clock, intent, reduced, overlay, onHover}) {
  const manifest = await fetch('assets/asset-manifest.json').then(r => r.json());
  if (!manifest.enable3D) return null;
  const THREE = await import('three');
  const [{GLTFLoader}, {RoomEnvironment}, {EffectComposer}, {RenderPass}, {GTAOPass}, {OutputPass}, {Line2}, {LineGeometry}, {LineSegments2}, {LineSegmentsGeometry}, {LineMaterial}] = await Promise.all([
    'loaders/GLTFLoader.js', 'environments/RoomEnvironment.js', 'postprocessing/EffectComposer.js', 'postprocessing/RenderPass.js', 'postprocessing/GTAOPass.js',
    'postprocessing/OutputPass.js', 'lines/Line2.js', 'lines/LineGeometry.js', 'lines/LineSegments2.js', 'lines/LineSegmentsGeometry.js', 'lines/LineMaterial.js',
  ].map(p => import(`three/addons/${p}`)));
  const gltf = await new GLTFLoader().loadAsync(manifest.modelUrl);

  const renderer = new THREE.WebGLRenderer({antialias: true, powerPreference: 'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.replaceChildren(renderer.domElement);

  // A deep navy studio: a lit backdrop, and a floor that fades into it so the desk stands in space.
  const scene = new THREE.Scene();
  scene.background = radial(THREE, 512, [[0, '#26335f'], [.55, '#18214a'], [1, '#0b1026']]);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = .42;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(5.5, 64), new THREE.MeshStandardMaterial({
    color: NAVY, roughness: .92, transparent: true, alphaMap: radial(THREE, 256, [[0, '#fff'], [.38, '#fff'], [1, '#000']]), depthWrite: false,
  }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor, gltf.scene);

  // Warm key with soft shadows, a cool rim that draws the edges, and a low sky fill.
  const key = new THREE.DirectionalLight(0xffe6cc, 2.6);
  key.position.set(-1.4, 3.2, 2.2);
  key.target.position.set(0, .78, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, {left: -1.4, right: 1.4, top: 1.4, bottom: -1.4, near: .5, far: 7});
  key.shadow.bias = -.0003;
  key.shadow.normalBias = .01;
  key.shadow.radius = 4;
  const rim = new THREE.DirectionalLight(0x8fb0ff, 1.4);
  rim.position.set(1.8, 2.2, -2.6);
  const fill = new THREE.HemisphereLight(0xc4d2ff, 0x1a2140, .55);
  scene.add(key, key.target, rim, fill);

  const nodes = {};
  gltf.scene.traverse(n => {
    nodes[n.name] = n;
    if (!n.isMesh) return;
    // Click proxies live on their own layer: the raycaster sees them, the renderer and its AO do not.
    if (n.name.startsWith('Hit_')) { n.layers.set(1); return; }
    n.castShadow = true;
    n.receiveShadow = true;
  });
  const required = [manifest.screenMesh, ...Object.keys(manifest.hotspots), ...Object.values(manifest.cameras), ...manifest.screenCorners];
  const clips = Object.fromEntries(gltf.animations.map(c => [c.name, c]));
  const missing = {nodes: required.filter(n => !nodes[n]), clips: Object.values(manifest.clips).filter(n => !clips[n])};
  if (missing.nodes.length || missing.clips.length) console.warn('Workstation GLB is missing:', missing);

  // The monitor's panel is dark: the lit picture is always the real desktop laid over it.
  const screen = nodes[manifest.screenMesh];
  if (screen) screen.material = new THREE.MeshBasicMaterial({color: 0x020305});

  const size = () => host.getBoundingClientRect();
  // Power-on light: the panel spills onto the desk and the tower's front glows.
  const screenLight = new THREE.PointLight(0x9cc4ff, 0, 1.9, 1.8);
  const towerLight = new THREE.PointLight(0x4f9dff, 0, .7, 1.6);
  scene.add(screenLight, towerLight);
  const power = nodes.Power_Button?.getWorldPosition(new THREE.Vector3());
  if (power) towerLight.position.copy(power).add(new THREE.Vector3(0, .01, .07));
  const panel = manifest.screenCorners.map(n => nodes[n]?.getWorldPosition(new THREE.Vector3())).filter(Boolean);
  if (panel.length === 4) screenLight.position.copy(panel[0].clone().add(panel[2]).multiplyScalar(.5)).add(new THREE.Vector3(0, -.06, .3));
  let lit = false;
  const lightUp = animated => {
    if (lit) return;
    lit = true;
    const set = t => { screenLight.intensity = .95 * t; towerLight.intensity = .34 * t; };
    if (animated && !reduced()) clock.tween(1300, u => set(u * u));
    else set(1);
  };

  // Line work is drawn after the picture, untouched by tone mapping or occlusion.
  const lineScene = new THREE.Scene();
  const lines = createLines(THREE, {Line2, LineGeometry, LineSegments2, LineSegmentsGeometry, LineMaterial}, {scene: lineScene, nodes, manifest, reduced});

  const camera = new THREE.PerspectiveCamera(36, 1, .02, 30);
  // On the welcome page the picture slides left to leave the title its column.
  let view = 'overview', active = true, tracking = false, shift = 0;
  const shiftFor = name => (name === 'splash' && size().width >= 1000 ? size().width * .17 : 0);
  const applyView = () => {
    const {width, height} = size();
    if (!width) return;
    camera.aspect = width / Math.max(height, 1);
    // The shots are framed for 16:9. On narrower screens the view widens, so the whole set stays in frame.
    camera.zoom = Math.min(1, camera.aspect / (16 / 9));
    const s = Math.round(shift);
    if (s) camera.setViewOffset(width + 2 * s, height, 2 * s, 0, width, height);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  };

  // The welcome page's camera: an isometric three-quarter view that drifts until the learner moves.
  const sceneBox = new THREE.Box3();
  for (const n of ['Desk', ...Object.values(manifest.parts ?? {}).flat()]) if (nodes[n]) sceneBox.expandByObject(nodes[n]);
  const sphere = sceneBox.getBoundingSphere(new THREE.Sphere());
  const SPLASH = {fov: 22, theta: .62, phi: .6, target: sphere.center.clone().add(new THREE.Vector3(0, -.06, 0))};
  SPLASH.distance = sphere.radius / Math.sin(THREE.MathUtils.degToRad(SPLASH.fov) / 2) * 1.12;
  let drift = 0, driftSpeed = 1, lastInput = -1e9;
  const splashPose = () => {
    const theta = SPLASH.theta + .26 * Math.sin(drift * 2 * Math.PI / 30), phi = SPLASH.phi + .04 * Math.sin(drift * 2 * Math.PI / 19);
    const position = new THREE.Vector3(Math.sin(theta) * Math.cos(phi), Math.sin(phi), Math.cos(theta) * Math.cos(phi)).multiplyScalar(SPLASH.distance).add(SPLASH.target);
    const m = new THREE.Matrix4().lookAt(position, SPLASH.target, new THREE.Vector3(0, 1, 0));
    return {position, quaternion: new THREE.Quaternion().setFromRotationMatrix(m), fov: SPLASH.fov};
  };
  const settle = () => { lastInput = clock.time; };
  addEventListener('pointermove', settle, {passive: true});
  addEventListener('keydown', settle);

  const anchor = name => {
    if (name === 'splash') return splashPose();
    const n = nodes[manifest.cameras[name]];
    if (!n) return null;
    const cam = n.isCamera ? n : n.getObjectByProperty('isCamera', true);
    return {position: n.getWorldPosition(new THREE.Vector3()), quaternion: (cam ?? n).getWorldQuaternion(new THREE.Quaternion()), fov: cam?.fov ?? 36};
  };
  const cut = name => {
    const a = anchor(name);
    if (!a) return;
    camera.position.copy(a.position);
    camera.quaternion.copy(a.quaternion);
    camera.fov = a.fov;
    shift = shiftFor(name);
    applyView();
  };
  cut(view);

  const corners = manifest.screenCorners.map(n => nodes[n]).filter(Boolean);
  const fullQuad = () => { const {width: W, height: H} = size(); return [[0, 0], [W, 0], [W, H], [0, H]]; };
  const projected = () => {
    const {width: W, height: H} = size();
    camera.updateMatrixWorld();
    return corners.map(n => { const v = n.getWorldPosition(new THREE.Vector3()).project(camera); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; });
  };
  const pin = quad => { const {width: W, height: H} = size(); overlay.style.transformOrigin = '0 0'; overlay.style.transform = quadMatrix(W, H, quad); };

  // Ambient occlusion grounds every object in its neighbours; the output pass applies tone mapping.
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const ao = new GTAOPass(scene, camera, 1, 1);
  ao.updateGtaoMaterial({radius: .12, distanceExponent: 1.4, thickness: 1, scale: 1.1, samples: 16});
  ao.updatePdMaterial({lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12});
  ao.blendIntensity = .9;
  composer.addPass(ao);
  composer.addPass(new OutputPass());

  const resize = () => {
    const {width, height} = size();
    if (!width) return;
    renderer.setSize(width, height, false);
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(width, height);
    lines.resize(width * renderer.getPixelRatio(), height * renderer.getPixelRatio());
    shift = shiftFor(view);
    applyView();
  };
  new ResizeObserver(resize).observe(host);
  resize();

  const mixer = new THREE.AnimationMixer(gltf.scene);
  const ray = new THREE.Raycaster(), pointer = new THREE.Vector2();
  ray.layers.enable(1);
  const hits = ev => {
    const r = renderer.domElement.getBoundingClientRect();
    pointer.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(pointer, camera);
    return ray.intersectObject(gltf.scene, true).map(h => { const chain = []; for (let n = h.object; n; n = n.parent) chain.push(n.name.replace(/^Hit_/, '')); return chain; });
  };
  // The bench action under the pointer, if any.
  const pick = ev => {
    for (const chain of hits(ev)) for (const name of chain) if (manifest.hotspots[name]) return manifest.hotspots[name];
    return null;
  };
  // Which piece of kit the pointer is on, for the highlight and its label.
  const partOf = {};
  for (const [id, names] of Object.entries(manifest.parts ?? {})) for (const n of names) partOf[n] = id;
  Object.assign(partOf, manifest.partAliases ?? {});
  const pickPart = ev => {
    for (const chain of hits(ev)) for (const name of chain) if (partOf[name]) return partOf[name];
    return null;
  };
  let moving = false, hovered = null;
  renderer.domElement.addEventListener('click', ev => {
    if (paused() || moving) return;
    if (view === 'splash') return intent(pick(ev) ?? 'set');
    const part = pick(ev);
    if (part) intent(part);
  });
  let lastHover = 0;
  renderer.domElement.addEventListener('pointermove', ev => {
    if (ev.timeStamp - lastHover < 50 || moving) return;
    lastHover = ev.timeStamp;
    const part = pick(ev);
    hovered = pickPart(ev);
    lines.hover(hovered);
    renderer.domElement.style.cursor = part || view === 'splash' ? 'pointer' : 'default';
    onHover?.(hovered);
  });
  renderer.domElement.addEventListener('pointerleave', () => { hovered = null; lines.hover(null); onHover?.(null); });

  // Slower machines keep a steady picture: if frames run long, occlusion goes and resolution drops.
  let slow = 0, wall = performance.now(), lightened = false;
  const watchSpeed = () => {
    const now = performance.now(), ms = now - wall;
    wall = now;
    if (lightened || ms > 250) return;
    slow = slow * .97 + (ms > 34 ? .03 : 0);
    if (slow > .6) {
      lightened = true;
      ao.enabled = false;
      renderer.setPixelRatio(1);
      resize();
    }
  };

  let last = clock.time;
  const frame = () => {
    requestAnimationFrame(frame);
    if (!active || document.hidden) return;
    watchSpeed();
    const dt = Math.min(.5, (clock.time - last) / 1000);
    last = clock.time;
    if (!paused()) mixer.update(dt);
    if (view === 'splash' && !moving) {
      // Drift until the learner moves; settle while they aim; drift again once they stop.
      const want = reduced() || clock.time - lastInput < 4500 ? 0 : 1;
      driftSpeed += (want - driftSpeed) * Math.min(1, dt * 1.6);
      drift += dt * driftSpeed;
      const p = splashPose();
      camera.position.copy(p.position);
      camera.quaternion.copy(p.quaternion);
    }
    lines.update(paused() ? 0 : dt);
    composer.render();
    renderer.autoClear = false;
    renderer.render(lineScene, camera);
    renderer.autoClear = true;
    if (tracking && corners.length === 4) pin(projected());
    api.onFrame?.();
  };
  requestAnimationFrame(frame);

  const moveTo = async (name, ms) => {
    const to = anchor(name);
    if (!to || view === name) return;
    const fromShift = shift, toShift = shiftFor(name);
    view = name;
    if (reduced()) return cut(name);
    moving = true;
    const from = {position: camera.position.clone(), quaternion: camera.quaternion.clone(), fov: camera.fov};
    await clock.tween(ms, u => {
      const t = ease(u);
      camera.position.lerpVectors(from.position, to.position, t);
      camera.quaternion.slerpQuaternions(from.quaternion, to.quaternion, t);
      camera.fov = from.fov + (to.fov - from.fov) * t;
      shift = fromShift + (toShift - fromShift) * t;
      applyView();
    });
    moving = false;
  };

  const pose = name => {
    const clip = clips[manifest.clips[name]];
    if (!clip) return;
    const a = mixer.clipAction(clip);
    a.setLoop(THREE.LoopOnce, 1);
    a.clampWhenFinished = true;
    a.play();
    a.time = clip.duration;
    a.paused = true;
    mixer.update(0);
  };
  const posed = new Set();
  const show = () => { active = true; last = clock.time; host.style.visibility = 'visible'; host.style.opacity = 1; };
  const toScreen = world => {
    const v = world.clone().project(camera);
    const {width: W, height: H} = size();
    return {x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H};
  };
  const api = {
    ready: true,
    lines,
    isMoving: () => moving,
    inSplash: () => view === 'splash',
    missing,
    sync(s) {
      for (const [part, on] of Object.entries({power: s.powered, ...s.hardware})) {
        if (on && !posed.has(part)) { posed.add(part); pose(part); }
      }
      if (s.powered) lightUp(false);
      lines.sync(s);
    },
    // At the bench, trace the cable the next step connects.
    route(step) { lines.focus(manifest.routes?.[step] ?? null); },
    async play(part) {
      const station = manifest.stations[part];
      if (station) await moveTo(station, 800);
      const clip = clips[manifest.clips[part]];
      if (!clip) return;
      const a = mixer.clipAction(clip);
      a.reset().setLoop(THREE.LoopOnce, 1);
      a.clampWhenFinished = true;
      a.play();
      posed.add(part);
      if (part === 'power') lightUp(true);
      await clock.tween(clip.duration * 1000, () => {});
    },
    // The welcome page: the set alone, drifting, with every route and outline drawn.
    showSplash() {
      show();
      tracking = false;
      overlay.style.transform = '';
      view = 'splash';
      cut('splash');
      lines.setMode('splash');
    },
    // Out of the welcome page and into the bench, in one move.
    async expand(station) {
      hovered = null;
      lines.hover(null);
      onHover?.(null);
      lines.setMode('bench');
      await moveTo(station, 1500);
      tracking = true;
    },
    showBench(station) {
      // Opening the bench directly, with the desktop already pinned to the monitor.
      show();
      cut(station);
      view = station;
      tracking = true;
      lines.setMode('bench');
    },
    focus: station => moveTo(station, 900),
    // Where a part of the bench appears on screen, for the step pointers.
    screenPoint(name) {
      return toScreen(name === 'Screen' ? panel[0].clone().add(panel[2]).multiplyScalar(.5) : nodes[manifest.pointers[name] ?? name].getWorldPosition(new THREE.Vector3()));
    },
    // The part the learner should act on next, marked with the amber box.
    target(id) { lines.target(id); },
    // A press on a part: its box traces round and opens outward.
    activate(id) { lines.activate(id); },
    hovered: () => hovered,
    // A part's label anchor: the top of its box, and which side has more room.
    partAnchor(id) {
      const box = id && lines.boxes[id];
      if (!box) return null;
      const top = box.getCenter(new THREE.Vector3()).setY(box.max.y);
      const at = toScreen(top), middle = toScreen(sphere.center);
      return {id, x: at.x, y: at.y, side: at.x >= middle.x ? 'right' : 'left'};
    },
    // Monitor to full screen: the desktop stays pinned while the camera closes in, then takes the whole
    // viewport as the monitor and room fade away.
    async toDesktop() {
      hovered = null;
      lines.hover(null);
      if (!reduced() && corners.length === 4) {
        await moveTo('monitor', 1100);
        tracking = false;
        const from = projected(), to = fullQuad();
        await clock.tween(320, u => {
          const t = ease(u);
          pin(lerpQuad(from, to, t));
          host.style.opacity = 1 - t;
        });
      } else tracking = false;
      overlay.style.transform = '';
      host.style.visibility = 'hidden';
      active = false;
    },
    // The same journey backwards, so the learner sees where the desktop lives.
    async toBench(station) {
      show();
      host.style.opacity = 0;
      cut('monitor');
      view = 'monitor';
      lines.setMode('bench');
      if (!reduced() && corners.length === 4) {
        const from = fullQuad(), to = projected();
        pin(from);
        await clock.tween(320, u => {
          const t = ease(u);
          pin(lerpQuad(from, to, t));
          host.style.opacity = t;
        });
      }
      host.style.opacity = 1;
      tracking = true;
      await moveTo(station, 1000);
    },
    hide() { active = false; tracking = false; host.style.visibility = 'hidden'; overlay.style.transform = ''; },
  };
  return api;
}
