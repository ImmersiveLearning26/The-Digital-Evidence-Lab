// GIMP: a canvas over the actual photograph pixels. Picks read real pixels, Scale resamples real pixels,
// Export writes a real PNG. An enlargement keeps the smaller pixel store, because it adds no information.
import {app} from '../runtime.js';
import {clamp, emptyState, esc} from '../desktop/dom.js';
import {icons} from '../desktop/icons.js';
import {openWindow, registerApp} from '../desktop/wm.js';
import {menubar} from '../desktop/menu.js';
import {modal} from '../desktop/modal.js';
import {fileDialog} from '../desktop/filedialog.js';
import {loadEvidence} from '../core/evidence.js';
import {CCTV_WORKING_PATH, DIR, IMAGE_MASTER_PATH, ITEM_LIMIT, SOURCE_SIZE, TARGETS, formatBytes, imageBytes, pickTarget, plateWidth, printInches, printPixels} from '../core/domain.js';
import {lockReason} from '../core/state.js';
import {pngPpi, pngWithPpi} from '../core/bytes.js';
import {getBlob, putBlob} from '../core/store.js';
import {registerOpener} from './explorer.js';
import {registerCaseTab} from './case.js';

const g = () => app.ui.gimp;
const ZOOMS = [.0625, .125, .25, .5, 1, 2, 4, 8, 16, 32];
let view = null, ctx = null, sourceBitmap = null;
// doc.px holds real pixels at doc.pxW × doc.pxH; doc.w × doc.h is the logical image size.
let doc = null;

function pixelCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}
async function source() {
  if (sourceBitmap) return sourceBitmap;
  const e = await loadEvidence();
  sourceBitmap = await createImageBitmap(new Blob([e.cctv.bytes], {type: 'image/jpeg'}), {colorSpaceConversion: 'none', premultiplyAlpha: 'none'});
  return sourceBitmap;
}
async function load(path) {
  const f = app.s.files[path];
  let bitmap, ppi = f.settings.ppi ?? 72, reopened = false;
  if (path === CCTV_WORKING_PATH) bitmap = await source();
  else {
    const blob = f.blobKey ? await getBlob(f.blobKey) : null;
    if (blob) {
      bitmap = await createImageBitmap(blob, {colorSpaceConversion: 'none', premultiplyAlpha: 'none'});
      ppi = pngPpi(new Uint8Array(await blob.arrayBuffer())) ?? ppi;
      reopened = true;
    } else {
      // An oversized trial has no stored pixels: it reopens from the source it was derived from.
      bitmap = await source();
      reopened = true;
    }
  }
  const px = pixelCanvas(bitmap.width, bitmap.height);
  const pctx = px.getContext('2d', {willReadFrequently: true});
  pctx.drawImage(bitmap, 0, 0);
  g().path = path;
  doc = {path, version: f.version, px, pctx, pxW: bitmap.width, pxH: bitmap.height, w: f.settings.width, h: f.settings.height, ppi, detailW: f.settings.detailWidth ?? bitmap.width, dirty: false, reopened, exportedFrom: null};
  g().reopened = reopened;
  fit();
  app.persist();
  app.render();
}
function fit() {
  if (!view || !doc) return;
  const r = view.parentElement.getBoundingClientRect();
  g().zoom = Math.min(r.width / doc.w, r.height / doc.h) * .96;
  g().cx = doc.w / 2; g().cy = doc.h / 2;
}
function draw() {
  if (!view || !doc) { if (ctx) { ctx.fillStyle = '#2b2b2b'; ctx.fillRect(0, 0, view.width, view.height); } return; }
  const r = view.parentElement.getBoundingClientRect();
  const ratio = Math.min(devicePixelRatio, 2);
  if (view.width !== Math.round(r.width * ratio) || view.height !== Math.round(r.height * ratio)) { view.width = Math.round(r.width * ratio); view.height = Math.round(r.height * ratio); }
  const z = g().zoom * ratio, W = view.width, H = view.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#2b2b2b';
  ctx.fillRect(0, 0, W, H);
  const dx = W / 2 - g().cx * z, dy = H / 2 - g().cy * z;
  // Real pixels show as blocks. An enlarged trial interpolates, which is exactly the blur it adds.
  const interpolated = doc.w > doc.pxW;
  ctx.imageSmoothingEnabled = interpolated || z < 1;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(doc.px, dx, dy, doc.w * z, doc.h * z);
  if (z / (doc.w / doc.pxW) >= 8 && !interpolated) {
    const step = z * (doc.w / doc.pxW);
    ctx.strokeStyle = 'rgba(0,0,0,.28)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = ((dx % step) + step) % step; x < W; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = ((dy % step) + step) % step; y < H; y += step) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();
  }
  if (meta) {
    const s = doc.w / meta.width, p = meta.plate;
    ctx.setLineDash([6 * ratio, 5 * ratio]);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5 * ratio;
    ctx.strokeRect(dx + (p.x - 12) * s * z, dy + (p.y - 12) * s * z, (p.w + 24) * s * z, (p.h + 24) * s * z);
    ctx.setLineDash([]);
  }
}
let meta = null;
loadEvidence().then(e => { meta = e.meta; }).catch(() => {});

function screenToImage(ev) {
  const r = view.getBoundingClientRect(), z = g().zoom;
  return {x: g().cx + (ev.clientX - r.left - r.width / 2) / z, y: g().cy + (ev.clientY - r.top - r.height / 2) / z};
}
function readPixel(x, y) {
  const sx = doc.pxW / doc.w, sy = doc.pxH / doc.h;
  const px = clamp(Math.floor(x * sx), 0, doc.pxW - 1), py = clamp(Math.floor(y * sy), 0, doc.pxH - 1);
  const d = doc.pctx.getImageData(px, py, 1, 1).data;
  return [d[0], d[1], d[2]];
}
function pick(x, y) {
  if (x < 0 || y < 0 || x >= doc.w || y >= doc.h) return;
  const rgb = readPixel(x, y);
  g().fg = rgb;
  g().pointer = {x: Math.floor(x), y: Math.floor(y), rgb};
  const target = meta && doc.w === SOURCE_SIZE.width ? pickTarget(x, y, doc.w, rgb, meta) : null;
  if (target) app.dispatch({type: 'PICK', target, rgb, x: Math.floor(x), y: Math.floor(y), detail: target});
  else app.render();
  return target;
}
function focusOn(target) {
  if (!doc || !meta) return false;
  const [x, y] = meta.samples[target];
  const s = doc.w / meta.width;
  g().cx = x * s + .5; g().cy = y * s + .5; g().zoom = target === 'sky' ? 2 : 8;
  return true;
}
function zoomBy(dir, ev) {
  const cur = g().zoom;
  const next = dir > 0 ? ZOOMS.find(z => z > cur * 1.01) ?? cur : [...ZOOMS].reverse().find(z => z < cur * .99) ?? cur;
  if (ev) {
    const before = screenToImage(ev);
    g().zoom = next;
    const after = screenToImage(ev);
    g().cx += before.x - after.x; g().cy += before.y - after.y;
  } else g().zoom = next;
  app.render();
}
function bind() {
  let pan = null;
  view.addEventListener('pointerdown', ev => {
    if (!doc || app.ui.paused) return;
    const tool = g().tool;
    if (tool === 'zoom') return zoomBy(ev.altKey ? -1 : 1, ev);
    if (tool === 'move' || ev.button === 1) { pan = {x: ev.clientX, y: ev.clientY, cx: g().cx, cy: g().cy}; view.setPointerCapture(ev.pointerId); return; }
    const {x, y} = screenToImage(ev);
    pick(x, y);
  });
  view.addEventListener('pointermove', ev => {
    if (!doc) return;
    if (pan) { g().cx = pan.cx - (ev.clientX - pan.x) / g().zoom; g().cy = pan.cy - (ev.clientY - pan.y) / g().zoom; draw(); return; }
    const {x, y} = screenToImage(ev);
    if (x >= 0 && y >= 0 && x < doc.w && y < doc.h) { const el = document.getElementById('gimp-coord'); if (el) el.textContent = `${Math.floor(x)}, ${Math.floor(y)}`; }
  });
  view.addEventListener('pointerup', () => { pan = null; });
  view.addEventListener('wheel', ev => { if (!doc) return; ev.preventDefault(); zoomBy(ev.deltaY < 0 ? 1 : -1, ev); }, {passive: false});
}
async function openPath(path) {
  const reason = lockReason(app.s, 'image');
  if (reason) return app.guide(reason);
  const f = app.s.files[path];
  if (!f) return;
  openWindow('gimp');
  if (!app.attempt({type: 'OPEN', kind: 'image'})) return;
  await load(path);
}
registerOpener('image', openPath);
async function askOpen() {
  const path = await fileDialog({title: 'Open Image', filter: ['jpg', 'png'], typeLabel: 'Image files (*.jpg, *.png)'});
  if (path) openPath(path);
}
async function scaleDialog() {
  if (!doc) return app.status('gimp', 'Open an image first.');
  const ratio = doc.h / doc.w;
  const ok = await modal({
    title: 'Scale Image', width: 400, state: {w: String(doc.w), h: String(doc.h), error: ''},
    view: st => `<label class="f-field"><span>Width (px)</span><input type="number" min="16" max="16000" data-bind="w" value="${esc(st.w)}" data-autofocus></label><label class="f-field"><span>Height (px)</span><input type="number" readonly value="${Math.round(Number(st.w) * ratio) || ''}" aria-label="Height, linked to width"></label><dl class="f-dl"><dt>Interpolation</dt><dd>Cubic</dd><dt>RGB estimate</dt><dd>${formatBytes(imageBytes(Number(st.w) || 0, Math.round(Number(st.w) * ratio) || 0))}</dd></dl>${st.error ? `<p class="fd-error">${esc(st.error)}</p>` : ''}<footer class="modal-foot"><button class="btn primary" data-m="ok" data-default>Scale</button><button class="btn" data-m="reset">Reset</button><button class="btn" data-m="cancel">Cancel</button></footer>`,
    actions: {
      reset: (el, ev, api) => { api.state.w = String(doc.w); api.update(); },
      ok: (el, ev, api) => { const w = Number(api.state.w); if (!(w >= 16 && w <= 16000)) { api.state.error = 'Enter a width from 16 to 16000 pixels.'; api.update(); return; } api.close(w); },
    },
  });
  if (!ok) return;
  const w = ok, h = Math.round(w * ratio);
  if (w <= doc.pxW) {
    // Real resampling: discarded pixels are gone until the file is reverted.
    const next = pixelCanvas(w, h), nctx = next.getContext('2d', {willReadFrequently: true});
    nctx.imageSmoothingQuality = 'high';
    nctx.drawImage(doc.px, 0, 0, w, h);
    doc.px = next; doc.pctx = nctx; doc.pxW = w; doc.pxH = h;
  }
  doc.detailW = Math.min(doc.detailW, w);
  doc.w = w; doc.h = h; doc.dirty = true;
  fit();
  app.status('gimp', w > SOURCE_SIZE.width ? 'More pixels, but no new information: the software invented them.' : w < SOURCE_SIZE.width ? 'Pixels discarded. File > Revert restores the working copy.' : '');
}
async function printDialog() {
  if (!doc) return app.status('gimp', 'Open an image first.');
  const ppi = await modal({
    title: 'Set Image Print Resolution', width: 400, state: {ppi: String(doc.ppi)},
    view: st => { const p = Number(st.ppi) || 1; return `<dl class="f-dl"><dt>Width</dt><dd>${printInches(doc.w, p).toFixed(2)} in</dd><dt>Height</dt><dd>${printInches(doc.h, p).toFixed(2)} in</dd><dt>Pixels</dt><dd>${doc.w} × ${doc.h} (unchanged)</dd></dl><label class="f-field"><span>X and Y resolution (pixels/in)</span><input type="number" min="1" max="2400" data-bind="ppi" value="${esc(st.ppi)}" data-autofocus></label><footer class="modal-foot"><button class="btn primary" data-m="ok" data-default>OK</button><button class="btn" data-m="cancel">Cancel</button></footer>`; },
    actions: {ok: (el, ev, api) => api.close(Number(api.state.ppi))},
  });
  if (!ppi) return;
  doc.ppi = ppi; doc.dirty = true;
  app.status('gimp', 'Print density changed. The pixels did not.');
}
async function exportAs() {
  if (!doc) return app.status('gimp', 'Open an image first.');
  const path = await fileDialog({
    mode: 'save', title: 'Export Image', name: IMAGE_MASTER_PATH.split('\\').pop(), dir: DIR.working, filter: ['png', 'jpg'], typeLabel: 'PNG image (*.png)', saveLabel: 'Export',
    validate: p => (p === CCTV_WORKING_PATH ? 'cctv_working.jpg is the read-only working baseline. Export a separate PNG.' : p.endsWith('.png') ? null : 'Export a PNG. Another JPEG save would recompress the evidence.'),
  });
  if (!path) return;
  app.status('gimp', 'Exporting…');
  let blobKey = null, actualBytes = null;
  if (doc.w === doc.pxW) {
    const blob = await new Promise(r => doc.px.toBlob(r, 'image/png'));
    const png = pngWithPpi(new Uint8Array(await blob.arrayBuffer()), doc.ppi);
    blobKey = path; actualBytes = png.length;
    await putBlob(path, new Blob([png], {type: 'image/png'}));
  }
  if (app.attempt({type: 'SAVE_IMAGE', path, width: doc.w, height: doc.h, ppi: doc.ppi, detailWidth: doc.detailW, actualBytes, blobKey})) {
    doc.path = path; doc.dirty = false; doc.reopened = false; g().reopened = false; doc.version = app.s.files[path].version;
    app.status('gimp', `Exported ${path.split('\\').pop()}${actualBytes ? ` (${formatBytes(actualBytes)} actual PNG)` : ''}. Reopen it to check it.`);
  }
}
const menus = () => [
  {name: 'File', items: [{label: 'Open...', action: 'gi:open', key: 'Ctrl+O'}, {label: 'Revert', action: 'gi:revert', disabled: !doc}, '-', {label: 'Export As...', action: 'gi:export', key: 'Shift+Ctrl+E', disabled: !doc}, {label: 'Close', action: 'gi:close-doc', disabled: !doc}]},
  {name: 'Edit', items: [{label: 'Undo'}, {label: 'Preferences'}]}, {name: 'Select', items: [{label: 'All'}, {label: 'None'}]},
  {name: 'View', items: [{label: 'Zoom In', action: 'gi:zoom', arg: 1}, {label: 'Zoom Out', action: 'gi:zoom', arg: -1}, {label: 'Fit Image in Window', action: 'gi:fit'}]},
  {name: 'Image', items: [{label: 'Scale Image...', action: 'gi:scale', disabled: !doc}, {label: 'Print Size...', action: 'gi:print', disabled: !doc}]},
  ...['Layer', 'Colors', 'Tools', 'Filters', 'Windows', 'Help'].map(name => ({name, items: [{label: `${name} commands`}]})),
];
const TOOLS = [['picker', 'Color Picker'], ['zoom', 'Zoom'], ['move', 'Pan']];
registerApp({
  id: 'gimp', title: 'GIMP', icon: icons.gimp, rect: {x: .012, y: .012, w: .695, h: .97},
  windowTitle: () => (doc ? `${doc.dirty ? '*' : ''}[${doc.path.split('\\').pop().split('.')[0]}] (imported)-1.0 (RGB color 8-bit gamma integer, GIMP built-in sRGB, 1 layer) ${doc.w}x${doc.h} – GIMP` : 'GNU Image Manipulation Program'),
  mount() {
    const path = g().path;
    if (path && app.s.files[path] && !doc) load(path);
  },
  view() {
    const st = g(), fg = st.fg ?? [0, 0, 0], p = st.pointer, name = doc?.path.split('\\').pop();
    return `<div class="gimp">${menubar('gimp', menus())}<div class="gi-main ${doc ? '' : 'empty'}">
    ${doc ? '' : ''}<aside class="gi-tools" aria-label="Toolbox" ${doc ? '' : 'hidden'}>${TOOLS.map(([k, t]) => `<button class="${st.tool === k ? 'on' : ''}" data-action="gi:tool" data-tool="${k}" aria-pressed="${st.tool === k}">${t}</button>`).join('')}<div class="gi-swatch" style="background:rgb(${fg.join(',')})" role="img" aria-label="Foreground colour R ${fg[0]}, G ${fg[1]}, B ${fg[2]}"></div><dl class="gi-rgb"><dt>R</dt><dd>${fg[0]}</dd><dt>G</dt><dd>${fg[1]}</dd><dt>B</dt><dd>${fg[2]}</dd></dl><p class="gi-hint">${st.tool === 'picker' ? 'Click a pixel to read it.' : st.tool === 'zoom' ? 'Click to zoom. Alt-click zooms out.' : 'Drag to move around.'}</p></aside>
    <div class="gi-canvas"><canvas data-keep id="gimp-canvas" aria-label="${doc ? 'Photograph canvas. Use the Case Record buttons for keyboard access to each sample.' : 'Empty canvas'}"></canvas>${doc ? '' : `<div class="gi-empty">${emptyState('No image open', 'Open a photograph to inspect it here.')}</div>`}</div>
    <aside class="gi-dock" ${doc ? '' : 'hidden'}><h3>Layers</h3>${doc ? `<div class="gi-layer">${esc(name)}</div>` : '<p>No layers</p>'}<h3>Pointer</h3><dl class="gi-rgb"><dt>X, Y</dt><dd id="gimp-coord">${p ? `${p.x}, ${p.y}` : '–'}</dd></dl>${p ? `<p>Last pixel: R ${p.rgb[0]}, G ${p.rgb[1]}, B ${p.rgb[2]}</p>` : ''}<h3>Image</h3>${doc ? `<dl class="gi-rgb"><dt>Pixels</dt><dd>${doc.w} × ${doc.h}</dd><dt>Print</dt><dd>${doc.ppi} PPI</dd><dt>RGB est.</dt><dd>${formatBytes(imageBytes(doc.w, doc.h))}</dd></dl>` : ''}</aside></div>
    <footer class="status-bar dark"><span>px</span><span>${doc ? `${Math.round(st.zoom * 100)} %` : ''}</span><span>${doc ? esc(name) : ''}</span><span>${esc(app.ui.status.gimp ?? '')}</span></footer></div>`;
  },
  after(body) {
    const c = body.querySelector('#gimp-canvas');
    if (c && c !== view) { view = c; ctx = c.getContext('2d'); bind(); if (doc) fit(); }
    draw();
  },
  unmount() { view = null; ctx = null; },
  onResize() { if (view) draw(); },
  actions: {
    'gi:open': askOpen,
    'gi:revert': () => doc && load(doc.path),
    'gi:export': exportAs, 'gi:scale': scaleDialog, 'gi:print': printDialog,
    'gi:close-doc': () => { doc = null; g().path = null; app.render(); },
    'gi:tool': el => { g().tool = el.dataset.tool; app.render(); },
    'gi:zoom': el => zoomBy(Number(el.dataset.arg)),
    'gi:fit': () => { fit(); app.render(); },
  },
});

// ---- Case record: pixels, resolution and print. Separate from the native application.
const c = () => (app.ui.imageCase ??= {dim: 4000, result: null});
const DIMS = [[640, 480, 'Unreadable', 'You can’t read what was never captured.'], [1280, 960, 'Marginal', 'Characters start to merge.'], [4000, 3000, 'Clearly legible', 'The original: within budget.'], [8000, 6000, 'Blurred', 'More pixels, no new information.']];
const PRINTS = [[72, 'Blocky'], [150, 'Soft: small details blur'], [300, 'Sharp, and available from the 4000-pixel original'], [1200, 'Needs far more pixels than the original has']];
function samples() {
  const picks = app.s.image.picks;
  return `<div class="samples">${[['plate', 'Plate background'], ['character', 'Character'], ['sky', 'Sky']].map(([k, label]) => {
    const p = picks[k], rgb = p?.rgb, t = TARGETS[k];
    return `<div class="sample"><span class="sw" style="background:rgb(${(rgb ?? [230, 230, 230]).join(',')})"></span><div><strong>${label}</strong><small>${rgb ? `Read R ${rgb[0]}, G ${rgb[1]}, B ${rgb[2]}` : `Target about ${t.join(', ')}`}</small></div><button class="btn sm" data-action="ic:goto" data-t="${k}" aria-label="Go to ${label} pixel and sample it">${rgb ? '✓ Again' : 'Sample'}</button></div>`;
  }).join('')}</div>`;
}
function matchPanel() {
  const rgb = app.s.image.rgb, picks = app.s.image.picks, ready = ['plate', 'character', 'sky'].every(t => picks[t]);
  if (app.s.image.rgbDone) return `<div class="feedback ok"><strong>RGB check complete</strong><p>Each pixel is three values from 0 to 255: 24 bits, or 3 bytes, with 16,777,216 possible colours.</p></div>`;
  return `<div class="match ${ready ? '' : 'dim'}"><div class="swatches"><span style="background:rgb(${(picks.plate?.rgb ?? [200, 200, 200]).join(',')})" aria-label="Plate sample"></span><span style="background:rgb(${rgb.join(',')})" aria-label="Your mix"></span></div>${['R', 'G', 'B'].map((n, i) => `<label class="slider"><span>${n}</span><input type="range" min="0" max="255" value="${rgb[i]}" data-input="ic:rgb" data-i="${i}" aria-label="${n} channel" ${ready ? '' : 'disabled'}><output>${rgb[i]}</output></label>`).join('')}<button class="btn" data-action="ic:match" ${ready ? '' : 'disabled'}>Match swatch</button><p class="d-small">${ready ? 'Mix the plate colour. Each channel must be within ±15.' : 'Sample all three pixels first.'}</p></div>`;
}
const STEPS = ['Read pixels', 'Compare sizes', 'Print size', 'Explain and check'];
registerCaseTab({
  id: 'image',
  view() {
    const s = app.s, file = s.files[IMAGE_MASTER_PATH], st = c();
    const reached = s.image.rgbDone ? Math.max(st.reached ?? 2, 2) : 1;
    const step = Math.min(st.step ?? 1, reached);
    const header = `<ol class="stepper">${STEPS.map((t, i) => `<li class="${i + 1 < reached ? 'done' : i + 1 === step ? 'on' : ''}"><button data-action="ic:step" data-n="${i + 1}" ${i + 1 <= reached ? '' : 'disabled'}>${i + 1 < reached ? '✓ ' : ''}${t}</button></li>`).join('')}</ol>`;
    const next = n => `<button class="btn primary" data-action="ic:next" data-n="${n}">Continue</button>`;
    let body;
    if (step === 1) {
      body = `<p class="cr-lead">Pixels are the samples that make up a digital image. Each one holds red, green and blue values.</p>${doc ? '' : '<p class="cr-next">Open cctv_working.jpg in GIMP.</p>'}${samples()}${matchPanel()}${s.image.rgbDone ? next(2) : ''}`;
    } else if (step === 2) {
      const dim = st.dim, row = DIMS.find(d => d[0] === dim);
      body = `<p class="cr-lead">More pixels mean more detail and more storage, up to what the camera captured. Compare the plate at each size.</p><div class="seg" role="radiogroup" aria-label="Dimensions">${DIMS.map(([w, h]) => `<button role="radio" aria-checked="${dim === w}" class="${dim === w ? 'on' : ''}" data-action="ic:dim" data-w="${w}">${w} × ${h}</button>`).join('')}</div>
      <canvas class="plate-view" data-w="${dim}" width="300" height="180" aria-label="Number plate rendered at ${dim} pixels wide"></canvas>
      <dl class="f-dl"><dt>Plate width</dt><dd>about ${plateWidth(dim)} px</dd><dt>RGB estimate</dt><dd>${formatBytes(imageBytes(row[0], row[1]))}${imageBytes(row[0], row[1]) > ITEM_LIMIT ? ', over the 100 MB budget' : ''}</dd><dt>Result</dt><dd>${row[2]}. ${row[3]}</dd></dl>${next(3)}`;
    } else if (step === 3) {
      body = `<p class="cr-lead">PPI sets how densely pixels print. For a 10 × 7.5 inch print, pixels needed = inches × PPI. Changing PPI alone adds no detail.</p>
      <table class="mini"><thead><tr><th>PPI</th><th>Pixels needed</th><th>Storage</th></tr></thead><tbody>${PRINTS.map(([ppi, note]) => { const w = printPixels(10, ppi), h = printPixels(7.5, ppi); return `<tr title="${esc(note)}"><td>${ppi}</td><td>${w} × ${h}</td><td>${formatBytes(imageBytes(w, h))}</td></tr>`; }).join('')}</tbody></table><p class="d-small">Your retained file stays 4000 × 3000 and prints at 13.33 × 10 in at 300 PPI.</p>${next(4)}`;
    } else {
      const checked = file?.settings.compared;
      body = `<p class="cr-next">${!file ? 'In GIMP, keep 4000 × 3000, set Image > Print Size to 300 PPI, then use File > Export As.' : checked ? 'Now attach cctv_working.png in Chat and send it to Amina.' : 'Reopen cctv_working.png in GIMP, then compare it here.'}</p>
      <label class="lab-field"><span>Why these settings?</span><textarea data-input="ic:why" aria-label="Why these image settings?">${esc(s.image.rationale)}</textarea></label>
      ${file && !checked ? '<button class="btn primary" data-action="ic:compare">Compare with source</button>' : ''}${st.result ? `<div class="feedback ${st.result.ok ? 'ok' : 'warn'}" role="status"><strong>${esc(st.result.title)}</strong><p>${esc(st.result.text)}</p></div>` : ''}`;
    }
    return `<div class="cr-pad"><h2>Image</h2>${header}${body}</div>`;
  },
  after(el) { const pv = el.querySelector('canvas.plate-view'); if (pv) drawPlate(pv); },
  actions: {
    'ic:goto': el => {
      if (!doc) return app.guide('Open the working photograph in GIMP first.');
      if (doc.w !== SOURCE_SIZE.width) return app.guide('Sample from the original-resolution working copy. Use File > Revert.');
      const t = el.dataset.t;
      focusOn(t);
      const [x, y] = meta.samples[t];
      pick(x, y);
    },
    'ic:match': () => app.attempt({type: 'RGB_MATCH', rgb: app.s.image.rgb}),
    'ic:dim': el => { c().dim = Number(el.dataset.w); app.render(); },
    'ic:step': el => { c().step = Number(el.dataset.n); app.render(); },
    'ic:next': el => {
      const n = Number(el.dataset.n);
      c().step = n;
      c().reached = Math.max(c().reached ?? 2, n);
      if (n === 2) fit();
      app.render();
    },
    'ic:compare': compareFile,
  },
  inputs: {
    'ic:rgb': el => { const rgb = [...app.s.image.rgb]; rgb[Number(el.dataset.i)] = Number(el.value); app.dispatch({type: 'RGB_SET', rgb}); },
    'ic:why': el => app.dispatch({type: 'RATIONALE', kind: 'image', text: el.value}),
  },
});
async function drawPlate(canvas) {
  const key = canvas.dataset.w;
  if (canvas.dataset.drawn === key) return;
  canvas.dataset.drawn = key;
  const w = Number(key), bitmap = await source(), e = await loadEvidence(), p = e.meta.plate;
  const pad = 26, sx = p.x - pad, sy = p.y - pad, sw = p.w + pad * 2, sh = p.h + pad * 2;
  const s = w / SOURCE_SIZE.width;
  // Resample the crop to the trial's real pixel count, then enlarge for viewing. No detail is invented.
  const tmp = pixelCanvas(Math.max(1, Math.round(sw * Math.min(s, 1))), Math.max(1, Math.round(sh * Math.min(s, 1))));
  const t = tmp.getContext('2d');
  t.imageSmoothingQuality = 'high';
  t.drawImage(bitmap, sx, sy, sw, sh, 0, 0, tmp.width, tmp.height);
  const g2 = canvas.getContext('2d');
  g2.imageSmoothingEnabled = s > 1;
  g2.drawImage(tmp, 0, 0, canvas.width, canvas.height);
}
async function compareFile() {
  const say = (ok, title, text) => { c().result = {ok, title, text}; app.render(); };
  const f = app.s.files[IMAGE_MASTER_PATH];
  if (!doc || doc.path !== IMAGE_MASTER_PATH) return say(false, 'Not open', 'Open cctv_working.png in GIMP first.');
  if (!doc.reopened) return say(false, 'Not reopened yet', 'Use File > Open to reopen the exported file, so you check what was saved.');
  if (doc.dirty) return say(false, 'Unsaved changes', 'Export your changes first.');
  const src = await source(), e = await loadEvidence(), p = e.meta.plate;
  const a = pixelCanvas(p.w, p.h), ax = a.getContext('2d', {willReadFrequently: true});
  ax.drawImage(src, p.x, p.y, p.w, p.h, 0, 0, p.w, p.h);
  const scale = doc.pxW / SOURCE_SIZE.width;
  const b = pixelCanvas(p.w, p.h), bx = b.getContext('2d', {willReadFrequently: true});
  bx.drawImage(doc.px, p.x * scale, p.y * scale, p.w * scale, p.h * scale, 0, 0, p.w, p.h);
  const da = ax.getImageData(0, 0, p.w, p.h).data, db = bx.getImageData(0, 0, p.w, p.h).data;
  let sum = 0;
  for (let i = 0; i < da.length; i += 4) sum += Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]);
  const diff = sum / (p.w * p.h * 3), match = diff < 1;
  app.attempt({type: 'IMAGE_CHECK', path: f.path, reopened: true, plateMatch: match});
  say(match, match ? 'Plate pixels match the source' : 'Plate pixels differ from the source', `Average difference ${diff.toFixed(2)} of 255 across ${p.w} × ${p.h} plate pixels. File is ${doc.w} × ${doc.h} at ${doc.ppi} PPI, ${formatBytes(f.actualBytes ?? 0)} actual, ${formatBytes(f.bytes)} RGB estimate.`);
}
