// Evidence Imager wrapper. Acquisition is short and simulated, but its hashes are computed over real bytes.
import {ring} from '../desktop/motion.js';
import {app} from '../runtime.js';
import {emptyState, esc, reducedMotion} from '../desktop/dom.js';
import {icons} from '../desktop/icons.js';
import {registerApp} from '../desktop/wm.js';
import {menubar} from '../desktop/menu.js';
import {modal} from '../desktop/modal.js';
import {fileDialog} from '../desktop/filedialog.js';
import {loadEvidence} from '../core/evidence.js';
import {COPY} from '../content/copy.js';
import {md5, sha} from '../core/bytes.js';
import {CASE_ID, DIR, formatBytes} from '../core/domain.js';

const SYSTEM = {id: 'system', label: '\\\\.\\PHYSICALDRIVE0 - Workstation SSD, 476.9 GB (system disk C:)'};
const EVIDENCE = {id: 'evidence', label: '\\\\.\\PHYSICALDRIVE1 - Evidence Drive 0417 via write-blocker, read-only'};
const f = () => (app.ui.ftk ??= {folder: false, selected: null});
const IMAGE_FILES = [{id: 'witness', name: 'witness_message.txt'}, {id: 'cctv', name: 'cctv_still.jpg'}];
let evidence = null;
loadEvidence().then(e => { evidence = e; }).catch(() => {});

const menus = () => [
  {name: 'File', items: [
    {label: 'Add Evidence Item...', action: 'ftk:add', key: ''}, {label: 'Add All Attached Devices'}, {label: 'Image Mounting...'}, '-',
    {label: 'Remove Evidence Item', action: 'ftk:remove', disabled: !app.s.evidenceAdded}, {label: 'Remove All Evidence Items'}, '-',
    {label: 'Create Disk Image...', action: 'ftk:create'}, {label: 'Export Disk Image...'}, {label: 'Export Logical Image (AD1)...'}, '-',
    {label: 'Export Files...', action: 'ftk:export', disabled: !f().folder}, {label: 'Export File Hash List...'}, '-', {label: 'Verify Drive/Image...', action: 'ftk:verify-again', disabled: !app.s.acquisition}, '-', {label: 'Exit', action: 'win:close'},
  ]},
  {name: 'View', items: [{label: 'Evidence Tree', checked: true}, {label: 'File List', checked: true}, {label: 'Properties', checked: true}]},
  {name: 'Mode', items: [{label: 'Automatic', checked: true}, {label: 'Text'}, {label: 'Hex'}]},
  {name: 'Help', items: [{label: 'Help Topics'}, {label: 'About Evidence Imager'}]},
];

function hexDump(bytes) {
  const rows = [];
  for (let off = 0; off < Math.min(bytes.length, 160); off += 16) {
    const line = [...bytes.subarray(off, off + 16)];
    rows.push(`${off.toString(16).padStart(8, '0')}  ${line.map(b => b.toString(16).padStart(2, '0')).join(' ').padEnd(47)}  ${line.map(b => (b >= 32 && b < 127 ? String.fromCharCode(b) : '.')).join('')}`);
  }
  return rows.join('\n');
}

registerApp({
  id: 'ftk', title: 'Evidence Imager', icon: icons.ftk, rect: {x: .04, y: .03, w: .74, h: .85},
  windowTitle: () => 'Evidence Imager',
  view() {
    const s = app.s, st = f();
    const list = st.folder ? IMAGE_FILES : [];
    const sel = IMAGE_FILES.find(x => x.id === st.selected);
    const bytes = sel && evidence ? evidence[sel.id].bytes : null;
    const tool = !s.acquisition ? '<button data-action="ftk:create">Create Disk Image</button>' : !s.evidenceAdded ? '<button data-action="ftk:add">Add Evidence Item</button>' : !s.copies ? '<button data-action="ftk:export">Export working copies</button>' : '';
    const empty = !s.hardware.drive ? emptyState('No evidence drive detected', 'Evidence Imager cannot see the drive. It has to be connected at your bench, through the write-blocker.')
      : !s.acquisition ? emptyState('Evidence Drive 0417 detected', 'Read-only through the write-blocker, and ready to image.')
      : emptyState('drive.E01 is in the evidence store', 'Open it here to reach the files inside.');
    const panes = `<div class="ftk-panes ${sel ? '' : 'one-row'}"><section class="ftk-tree"><h3>Evidence Tree</h3><ul><li>▾ ${icons.disk}<span>drive.E01</span><ul><li>▾ Partition 1 [NTFS]<ul><li><button class="tree-btn ${st.folder ? 'sel' : ''}" data-action="ftk:folder">${icons.folder}<span>[root]/Evidence</span></button></li></ul></li></ul></li></ul></section>
    <section class="ftk-list"><h3>File List</h3>${list.length ? `<table><thead><tr><th>Name</th><th>Size</th><th>Type</th><th>Date Modified</th></tr></thead><tbody>${list.map(x => `<tr class="${st.selected === x.id ? 'sel' : ''}" data-key="${x.id}"><td><button class="tree-btn" data-action="ftk:file" data-id="${x.id}">${icons.file}<span>${x.name}</span></button></td><td>${evidence ? formatBytes(evidence[x.id].bytes.length) : ''}</td><td>Regular File</td><td>16/04/2026</td></tr>`).join('')}</tbody></table>` : '<p class="ftk-empty">Select a folder in the tree.</p>'}</section>
    ${sel ? `<section class="ftk-props"><h3>Properties</h3><dl><dt>Image</dt><dd>E:\\EvidenceStore\\0417\\drive.E01</dd><dt>Case</dt><dd>${CASE_ID}</dd><dt>Examiner</dt><dd>${esc(s.acquisition?.examiner)}</dd><dt>Verified</dt><dd>${s.acquisition?.verified ? 'Yes, hashes match' : 'No'}</dd></dl></section>
    <section class="ftk-view"><h3>${esc(sel.name)}</h3>${bytes ? `<pre tabindex="0" aria-label="Hex view of ${esc(sel.name)}">${esc(hexDump(bytes))}</pre>` : ''}</section>` : ''}</div>`;
    return `<div class="ftk">${menubar('ftk', menus())}${tool ? `<div class="ftk-tools" role="toolbar" aria-label="Evidence Imager tools">${tool}</div>` : ''}
    ${s.evidenceAdded ? panes : `<div class="ftk-start">${empty}</div>`}
    <footer class="status-bar"><span>${esc(app.ui.status.ftk ?? 'For Help, press F1')}</span><span>Write-blocker: ${s.hardware.blocker ? 'on' : 'not detected'}</span><span>Evidence drive: ${s.hardware.drive ? 'connected' : 'not connected'}</span></footer></div>`;
  },
  actions: {
    'ftk:create': createImage,
    'ftk:add': addEvidence,
    'ftk:folder': () => { f().folder = true; app.render(); },
    'ftk:file': el => { f().selected = el.dataset.id; app.render(); },
    'ftk:remove': () => { f().folder = false; f().selected = null; app.status('ftk', 'Removed from the view. The image itself is unchanged.'); },
    'ftk:export': exportFiles,
    'ftk:verify-again': showVerify,
  },
});

async function createImage() {
  if (!app.s.intake) return app.guide('Complete the intake record first. Amina will then send you here.');
  if (app.s.acquisition) return app.status('ftk', 'drive.E01 already exists in the evidence store. Add it as an evidence item.');
  const type = await modal({
    title: 'Select Source', width: 400, state: {type: 'physical'},
    view: st => `<fieldset class="radios"><legend>Please Select the Source Evidence Type</legend>${[['physical', 'Physical Drive'], ['logical', 'Logical Drive'], ['image', 'Image File'], ['folder', 'Contents of a Folder']].map(([k, t]) => `<label><input type="radio" name="src" value="${k}" data-bind="type" ${st.type === k ? 'checked' : ''}><span>${t}</span></label>`).join('')}</fieldset>${st.type !== 'physical' ? '<p class="fd-error">This case images the whole physical drive.</p>' : ''}<footer class="modal-foot"><button class="btn primary" data-m="next" data-default ${st.type === 'physical' ? '' : 'disabled'}>Next &gt;</button><button class="btn" data-m="cancel">Cancel</button></footer>`,
    actions: {next: (el, ev, api) => api.close('physical')},
  });
  if (!type) return;
  const drives = [SYSTEM, ...(app.s.hardware.drive ? [EVIDENCE] : [])];
  const drive = await modal({
    title: 'Select Drive', width: 560, state: {drive: drives.at(-1).id},
    view: st => `<label class="f-field"><span>Source Drive Selection</span><select data-bind="drive">${drives.map(d => `<option value="${d.id}" ${st.drive === d.id ? 'selected' : ''}>${esc(d.label)}</option>`).join('')}</select></label>${app.s.hardware.drive ? '' : '<p class="fd-error">No protected evidence drive is attached. Check the bench.</p>'}<footer class="modal-foot"><button class="btn primary" data-m="next" data-default>Finish</button><button class="btn" data-m="cancel">Cancel</button></footer>`,
    actions: {next: (el, ev, api) => api.close(api.state.drive)},
  });
  if (!drive) return;
  if (drive === 'system') return app.guide(app.s.hardware.drive ? COPY.wrongSourceDrive : COPY.noBlocker);
  if (!app.s.hardware.blocker || !app.s.hardware.drive) return app.guide(COPY.noBlocker);
  const go = await modal({
    title: 'Create Image', width: 620, state: {dest: null, verify: false, error: ''},
    view: st => `<fieldset class="f-group"><legend>Source</legend><dl class="f-dl"><dt>Evidence Source</dt><dd>\\\\.\\PHYSICALDRIVE1</dd><dt>Evidence Type</dt><dd>Physical Drive</dd><dt>Protection</dt><dd>Hardware write-blocker</dd></dl></fieldset>
    <fieldset class="f-group"><legend>Destination</legend><div class="dest-row"><div class="dest-list" aria-label="Image Destinations">${st.dest ? `<span class="sel">${esc(st.dest)}</span>` : '<span>No destination added.</span>'}</div><button class="btn" data-m="add" ${st.dest ? 'disabled' : ''}>Add...</button><button class="btn" data-m="remove" ${st.dest ? '' : 'disabled'}>Remove</button></div></fieldset>
    <fieldset class="f-group"><legend>Image Options</legend><label class="check"><input type="checkbox" data-bind="verify" ${st.verify ? 'checked' : ''}><span>Verify images after they are created</span></label></fieldset>
    ${st.error ? `<p class="fd-error" role="alert">${esc(st.error)}</p>` : ''}<footer class="modal-foot"><button class="btn primary" data-m="start" data-default>Start</button><button class="btn" data-m="cancel">Cancel</button></footer>`,
    actions: {
      add: async (el, ev, api) => { const d = await addDestination(); if (d) { api.state.dest = d; api.state.error = ''; api.update(); } },
      remove: (el, ev, api) => { api.state.dest = null; api.update(); },
      start: (el, ev, api) => {
        if (!api.state.dest) { api.state.error = 'Add an image destination first.'; api.update(); return; }
        if (!api.state.verify) { api.state.error = COPY.notVerified; api.update(); return; }
        api.close(true);
      },
    },
  });
  if (go) acquire();
}
function addDestination() {
  const FOLDER = {store: DIR.store, source: 'F:\\ (Evidence Drive 0417)', working: DIR.working};
  return modal({
    title: 'Image Destination', width: 520, state: {folder: 'store', name: 'drive', error: ''},
    view: st => `<dl class="f-dl"><dt>Image Type</dt><dd>E01 (Expert Witness Format)</dd><dt>Case Number</dt><dd>${CASE_ID}</dd><dt>Examiner</dt><dd>${esc(app.s.name)}</dd></dl>
    <label class="f-field"><span>Image Destination Folder</span><select data-bind="folder" data-enter>${Object.entries(FOLDER).map(([k, v]) => `<option value="${k}" ${st.folder === k ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select></label>
    <label class="f-field"><span>Image Filename (Excluding Extension)</span><input data-bind="name" value="${esc(st.name)}" spellcheck="false"></label>
    ${st.error ? `<p class="fd-error" role="alert">${esc(st.error)}</p>` : ''}<footer class="modal-foot"><button class="btn primary" data-m="ok" data-default>Finish</button><button class="btn" data-m="cancel">Cancel</button></footer>`,
    actions: {ok: (el, ev, api) => {
      const st = api.state;
      if (st.folder !== 'store') { st.error = COPY.sourceAsDestination; api.update(); return; }
      if (st.name.trim() !== 'drive') { st.name = 'drive'; }
      api.close(`${DIR.store}\\drive.E01`);
    }},
  });
}
async function acquire() {
  const e = await loadEvidence();
  const dialog = modal({
    title: 'Creating Image...', width: 420, closable: false, state: {p: 0},
    view: st => `${ring(st.p, st.p < 70 ? 'Imaging the evidence drive' : 'Verifying the image', 'PHYSICALDRIVE1 → E:\\EvidenceStore\\0417\\drive.E01')}<p class="d-small">Shortened for the simulation. A real drive takes much longer.</p>`,
  });
  await app.clock.tween(reducedMotion() ? 300 : 2600, u => { dialog.api.state.p = u * 100; dialog.api.update(); });
  dialog.api.close();
  // Source and image are the same immutable bytes here, so a mismatch would mean real corruption.
  const imageMd5 = md5(e.drive.bytes);
  app.attempt({type: 'ACQUIRE', source: 'evidence', destination: 'store', verify: true, match: imageMd5 === e.drive.md5, md5: imageMd5, sha1: e.drive.sha1, witnessSha: e.witness.sha256, cctvSha: e.cctv.sha256});
  await showVerify();
}
async function showVerify() {
  const a = app.s.acquisition;
  if (!a) return;
  const hash = (label, value) => `<tr><th>${label}</th><td><code>${value}</code></td><td><code>${value}</code></td><td>Match</td></tr>`;
  await modal({
    title: 'Drive/Image Verify Results', width: 720,
    view: () => `<table class="verify"><thead><tr><th></th><th>Computed hash</th><th>Report hash</th><th>Result</th></tr></thead><tbody>${hash('MD5', a.md5)}${hash('SHA1', a.sha1)}</tbody></table><dl class="f-dl"><dt>Bad sectors</dt><dd>No bad sectors found</dd><dt>Basis</dt><dd>Computed over the bytes of this simulated drive.</dd></dl><footer class="modal-foot"><button class="btn primary" data-m="cancel" data-default>Close</button></footer>`,
  });
}
async function addEvidence() {
  const type = await modal({
    title: 'Select Source', width: 400, state: {type: 'image'},
    view: st => `<fieldset class="radios"><legend>Please Select the Source Evidence Type</legend>${[['physical', 'Physical Drive'], ['image', 'Image File']].map(([k, t]) => `<label><input type="radio" name="src2" value="${k}" data-bind="type" ${st.type === k ? 'checked' : ''}><span>${t}</span></label>`).join('')}</fieldset><footer class="modal-foot"><button class="btn primary" data-m="next" data-default>Next &gt;</button><button class="btn" data-m="cancel">Cancel</button></footer>`,
    actions: {next: (el, ev, api) => api.close(api.state.type)},
  });
  if (!type) return;
  if (type === 'physical') return app.status('ftk', 'Work from the preserved image, not the live drive.');
  const path = await fileDialog({title: 'Select Image', dir: DIR.store, filter: ['e01'], typeLabel: 'Image files (*.E01)'});
  if (!path) return;
  if (app.attempt({type: 'ADD_EVIDENCE', path})) f().folder = true;
  app.render();
}
async function exportFiles() {
  if (!app.s.acquisition?.verified) return app.guide(COPY.notVerified);
  if (app.s.copies) return app.status('ftk', 'Working copies are already in the Working folder.');
  const dest = await modal({
    title: 'Browse For Folder', width: 460, state: {dir: DIR.working, error: ''},
    view: st => `<p>Export witness_message.txt and cctv_still.jpg to:</p><label class="f-field"><span>Destination</span><select data-bind="dir"><option value="${esc(DIR.working)}">${esc(DIR.working)}</option><option value="${esc(DIR.store)}">${esc(DIR.store)}</option></select></label>${st.error ? `<p class="fd-error" role="alert">${esc(st.error)}</p>` : ''}<footer class="modal-foot"><button class="btn primary" data-m="ok" data-default>OK</button><button class="btn" data-m="cancel">Cancel</button></footer>`,
    actions: {ok: (el, ev, api) => { if (api.state.dir === DIR.store) { api.state.error = 'The evidence store is read-only. Export working files to the Working folder.'; api.update(); return; } api.close(api.state.dir); }},
  });
  if (!dest) return;
  const e = await loadEvidence();
  // The exported bytes are hashed again and compared with the image, so a bad copy cannot pass.
  const witnessSha = await sha('SHA-256', e.witness.bytes.slice());
  const cctvSha = await sha('SHA-256', e.cctv.bytes.slice());
  if (app.attempt({type: 'COPIES', witnessSha, cctvSha, cctvBytes: e.cctv.bytes.length})) app.status('ftk', 'Exported 2 files. Hashes match the preserved image. Lab profile named them witness_working.txt and cctv_working.jpg.');
}
