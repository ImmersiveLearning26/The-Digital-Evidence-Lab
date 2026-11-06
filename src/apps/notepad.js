// Text Editor: a real editor over real bytes. Reading a file (interpretation) and changing its encoding
// (conversion) are different actions here, exactly as they are in the product.
import {app} from '../runtime.js';
import {emptyState, esc} from '../desktop/dom.js';
import {icons} from '../desktop/icons.js';
import {openWindow, registerApp} from '../desktop/wm.js';
import {menubar} from '../desktop/menu.js';
import {message} from '../desktop/modal.js';
import {fileDialog} from '../desktop/filedialog.js';
import {decode, encode, firstDifference, fromBase64, preservedCount, toBase64} from '../core/bytes.js';
import {TEXT, DIR, WITNESS_PATH as WITNESS_PATH_NAME, textBytes, textPreserved, textPreview} from '../core/domain.js';
import {lockReason} from '../core/state.js';
import {registerOpener} from './explorer.js';
import {registerCaseTab} from './case.js';
import {putBlob} from '../core/store.js';

const n = () => app.ui.np;
const doc = () => n().doc;
const LABEL = {ANSI: 'ANSI', 'UTF-8': 'UTF-8', 'UTF-8-BOM': 'UTF-8-BOM', 'ISO 8859-1': 'ISO 8859-1', 'US-ASCII': 'US-ASCII'};
let editor = null;

const bytesOf = d => encode(d.text, d.encoding);
function setEditor() { if (editor && editor.value !== (doc()?.text ?? '')) editor.value = doc()?.text ?? ''; }

function openPath(path) {
  const reason = lockReason(app.s, 'text');
  if (reason) return app.guide(reason);
  const f = app.s.files[path];
  if (!f?.settings?.b64) return app.guide('Text Editor opens the text files in this case.');
  openWindow('notepad');
  if (!app.attempt({type: 'OPEN', kind: 'text'})) return;
  const bytes = fromBase64(f.settings.b64);
  // Autodetect is off on this lab image, so an unlabelled file opens as ANSI until the reader chooses otherwise.
  n().doc = {path, version: f.version, b64: f.settings.b64, encoding: 'ANSI', text: decode(bytes, 'ANSI'), dirty: false, savedHere: false};
  setEditor();
  app.status('notepad', '');
  app.render();
}
registerOpener('text', openPath);

async function askOpen() {
  const path = await fileDialog({title: 'Open', filter: ['txt'], typeLabel: 'Normal text file (*.txt)'});
  if (path) openPath(path);
}
function interpret(encoding) {
  const d = doc();
  if (!d) return;
  if (d.dirty) return app.status('notepad', 'Save or close your changes before changing how the file is read.');
  d.encoding = encoding;
  d.text = decode(fromBase64(d.b64), encoding === 'UTF-8-BOM' ? 'UTF-8' : encoding);
  setEditor();
  app.render();
}
function convert(encoding) {
  const d = doc();
  if (!d) return;
  // Conversion keeps the characters on screen and changes the stored bytes. What cannot be stored becomes ?.
  d.text = decode(encode(d.text, encoding), encoding === 'UTF-8-BOM' ? 'UTF-8' : encoding);
  d.encoding = encoding;
  d.dirty = true;
  setEditor();
  app.render();
}
function write(path) {
  const d = doc(), b64 = toBase64(bytesOf(d));
  const ok = app.attempt({type: 'SAVE_TEXT', path, b64, encoding: d.encoding === 'UTF-8-BOM' ? 'UTF-8-BOM' : d.encoding});
  if (!ok) return false;
  d.path = path; d.b64 = b64; d.version = app.s.files[path].version; d.dirty = false; d.savedHere = false;
  // Saving reads the file straight back from disk with the current encoding, so what was stored is what is checked.
  const decoding = d.encoding === 'UTF-8-BOM' ? 'UTF-8' : d.encoding;
  app.attempt({type: 'TEXT_CHECK', path, version: d.version, decoding, reopened: true});
  const back = decode(fromBase64(b64), decoding), same = [...back].filter((c, i) => c === [...TEXT][i]).length;
  app.status('notepad', back === TEXT ? `Saved and read back as ${decoding}: all 92 characters intact.` : `Saved and read back as ${decoding}: ${same} of 92 characters match.`);
  return true;
}
async function saveAs() {
  const d = doc();
  if (!d) return;
  const path = await fileDialog({mode: 'save', title: 'Save As', name: d.path.split('\\').pop(), dir: d.path.slice(0, d.path.lastIndexOf('\\')), filter: ['txt'], typeLabel: 'Normal text file (*.txt)', validate: p => (p.endsWith('.txt') ? null : 'Save the working copy as a .txt file.')});
  if (path) write(path);
}
async function closeDoc() {
  const d = doc();
  if (!d) return;
  if (d.dirty) {
    const pick = await message({title: 'Save', text: `Save file "${d.path.split('\\').pop()}"?`, buttons: [['Yes', 'yes'], ['No', 'no'], ['Cancel', 'cancel']]});
    if (pick === 'cancel' || pick === null) return;
    if (pick === 'yes' && !write(d.path)) return;
  }
  n().doc = null;
  setEditor();
  app.render();
}
const enc = (label, value, action) => ({label, action, arg: value, checked: action === 'np:interpret' && doc()?.encoding === value});
const menus = () => [
  {name: 'File', items: [{label: 'Open...', action: 'np:open', key: 'Ctrl+O'}, {label: 'Save', action: 'np:save', key: 'Ctrl+S', disabled: !doc()}, {label: 'Save As...', action: 'np:save-as', disabled: !doc()}, {label: 'Close', action: 'np:close', key: 'Ctrl+W', disabled: !doc()}, '-', {label: 'Exit', action: 'win:close'}]},
  {name: 'Edit', items: [{label: 'Undo', action: 'np:cmd', arg: 'undo', key: 'Ctrl+Z'}, {label: 'Redo', action: 'np:cmd', arg: 'redo', key: 'Ctrl+Y'}, '-', {label: 'Cut', action: 'np:cmd', arg: 'cut', key: 'Ctrl+X'}, {label: 'Copy', action: 'np:cmd', arg: 'copy', key: 'Ctrl+C'}, {label: 'Paste', action: 'np:paste', key: 'Ctrl+V'}, '-', {label: 'Select All', action: 'np:all', key: 'Ctrl+A'}]},
  {name: 'Search', items: [{label: 'Find...', action: 'np:find', key: 'Ctrl+F', disabled: !doc()}]},
  {name: 'View', items: [{label: 'Word wrap', action: 'np:wrap', checked: n().wrap}, '-', {label: 'Zoom In', action: 'np:zoom', arg: 2}, {label: 'Zoom Out', action: 'np:zoom', arg: -2}, {label: 'Restore Default Zoom', action: 'np:zoom', arg: 0}]},
  {name: 'Encoding', items: [enc('ANSI', 'ANSI', 'np:interpret'), enc('UTF-8', 'UTF-8', 'np:interpret'), enc('UTF-8-BOM', 'UTF-8-BOM', 'np:interpret'), '-', {head: 'Character sets'}, enc('Western European: ISO 8859-1', 'ISO 8859-1', 'np:interpret'), '-', enc('Convert to ANSI', 'ANSI', 'np:convert'), enc('Convert to UTF-8', 'UTF-8', 'np:convert'), enc('Convert to UTF-8-BOM', 'UTF-8-BOM', 'np:convert')]},
  ...['Language', 'Settings', 'Tools', 'Macro', 'Run', 'Plugins', 'Window', '?'].map(name => ({name, items: [{label: `${name} options`}]})),
];
registerApp({
  id: 'notepad', title: 'Text Editor', icon: icons.npp, rect: {x: .012, y: .012, w: .695, h: .97},
  windowTitle: () => { const d = doc(); return `${d?.dirty ? '*' : ''}${d ? d.path : 'new 1'} - Text Editor`; },
  mount(body) { app.ui.np ??= {wrap: true}; body.dataset.np = '1'; },
  view() {
    const d = doc(), st = n();
    const find = st.find;
    const matches = find?.q && d ? d.text.split(find.q).length - 1 : 0;
    const line = (d?.text ?? '').slice(0, st.caret ?? 0).split('\n').length;
    return `<div class="npp">${menubar('notepad', menus())}
    <div class="npp-tools" role="toolbar" aria-label="File tools"><button data-action="np:open">Open</button>${d ? '<button data-action="np:save">Save</button><button data-action="np:save-as">Save As</button><button data-action="np:close">Close</button>' : ''}</div>
    ${d ? `<div class="npp-tab">${icons.file}<span>${esc(d.path.split('\\').pop())}${d.dirty ? ' *' : ''}</span></div>` : ''}
    ${find ? `<div class="npp-find"><label>Find what: <input data-input="np:query" value="${esc(find.q)}" aria-label="Find what"></label><span role="status">${find.q ? `${matches} match${matches === 1 ? '' : 'es'}` : ''}</span><button class="btn" data-action="np:find-close">Close</button></div>` : ''}
    <div class="npp-edit">${d ? '' : `<div class="app-start">${emptyState('No file open', 'Open a text file to read it here.')}</div>`}<div class="npp-gutter" aria-hidden="true">1</div><textarea data-keep id="npp-text" class="${st.wrap ? '' : 'nowrap'}" style="font-size:${st.font ?? 15}px" data-input="np:edit" spellcheck="false" aria-label="Text editor" ${d ? '' : 'readonly'}></textarea></div>
    <footer class="status-bar"><span>${esc(app.ui.status.notepad || 'Normal text file')}</span><span>length : ${d ? bytesOf(d).length : 0} &nbsp; lines : 1</span><span>Ln : ${line}</span><span>Windows (CR LF)</span><span>${d ? LABEL[d.encoding] : 'UTF-8'}</span><span>INS</span></footer></div>`;
  },
  after(body) { editor = body.querySelector('#npp-text'); setEditor(); },
  unmount() { editor = null; },
  actions: {
    'np:open': askOpen,
    'np:save': () => { if (doc()) write(doc().path); },
    'np:save-as': saveAs,
    'np:close': closeDoc,
    'np:interpret': el => interpret(el.dataset.arg),
    'np:convert': el => convert(el.dataset.arg),
    'np:wrap': () => { n().wrap = !n().wrap; app.render(); },
    'np:all': () => { editor?.focus(); editor?.select(); },
    'np:cmd': el => { editor?.focus(); document.execCommand(el.dataset.arg); },
    'np:paste': async () => {
      editor?.focus();
      const text = await navigator.clipboard?.readText?.().catch(() => null);
      if (text != null) document.execCommand('insertText', false, text);
      else app.status('notepad', 'Press Ctrl+V to paste here.');
    },
    'np:zoom': el => { const a = Number(el.dataset.arg); n().font = a ? Math.min(30, Math.max(9, (n().font ?? 15) + a)) : 15; app.render(); },
    'np:find': () => { n().find = {q: ''}; app.render(); },
    'np:find-close': () => { n().find = null; app.render(); },
  },
  inputs: {
    'np:edit': el => { const d = doc(); if (d) { d.text = el.value; d.dirty = true; app.render(); } },
    'np:query': el => { n().find.q = el.value; app.render(); },
  },
});

// ---- Case record: encoding comparison. A separate training window, never a fake Text Editor menu item.
const REPS = [
  ['ASCII', 'ASCII (7-bit)', 'US-ASCII'], ['Latin-1', 'Latin-1 (8-bit)', 'ISO 8859-1'], ['UTF-8', 'UTF-8', 'UTF-8'], ['screenshot', 'Screenshot of the text', null],
];
const t = () => (app.ui.textCase ??= {rep: null, result: null});
function repRow([id, label]) {
  const preserved = textPreserved(id), selected = t().rep === id;
  return `<label class="rep ${selected ? 'on' : ''}"><input type="radio" name="rep" value="${id}" data-input="tc:rep" ${selected ? 'checked' : ''}><span class="rep-name">${label}</span><span class="rep-data">${id === 'screenshot' ? 'Looks complete, not searchable · about 48 KB' : `${preserved} of 92 characters · ${textBytes(id)} B`}</span></label>`;
}
function marked(id) {
  const a = [...TEXT], b = [...textPreview(id)];
  return b.map((c, i) => (c === a[i] ? esc(c) : `<mark title="Was ${esc(a[i])}">${esc(c)}</mark>`)).join('');
}
function verifyResult() {
  const r = t().result;
  if (!r) return '';
  return `<div class="feedback ${r.ok ? 'ok' : 'warn'}" role="status"><strong>${esc(r.title)}</strong><p>${esc(r.text)}</p></div>`;
}
registerCaseTab({
  id: 'text',
  view() {
    const rep = t().rep, d = doc(), file = app.s.files[WITNESS_PATH_NAME];
    const saved = (file?.version ?? 1) > 1;
    const done = saved && file.settings.reopened && file.settings.decoding === 'UTF-8' && t().result?.ok;
    if (!d && !saved) return `<div class="cr-pad"><h2>Text</h2><p class="cr-lead">Open witness_working.txt in Text Editor to begin.</p></div>`;
    if (done) return `<div class="cr-pad"><h2>Text</h2>${verifyResult()}<p class="cr-next">Now attach the saved file in Chat and send it to Amina.</p></div>`;
    const compare = (!saved && !d?.dirty) || t().showReps;
    if (compare) {
      const lost = rep && rep !== 'screenshot' ? [...TEXT].filter((c, i) => c !== [...textPreview(rep)][i]) : [];
      return `<div class="cr-pad"><h2>Compare encodings</h2><p class="cr-lead">An encoding maps characters to bytes, and 8 bits make a byte. ASCII has only 128 characters. Unicode covers many writing systems, and UTF-8 is a common way to store it. Choose one to preview it.</p>
      <div class="reps">${REPS.map(repRow).join('')}</div>
      ${rep ? `<div class="preview" aria-label="Preview of ${esc(rep)}">${rep === 'screenshot' ? '<canvas class="shot" width="560" height="72" aria-label="Picture of the text"></canvas>' : marked(rep)}</div><p class="d-small">${rep === 'screenshot' ? 'A picture of text cannot be searched or copied as text.' : lost.length ? `Lost, shown as ?: ${esc(lost.join(' '))}` : 'Every character is intact.'}</p>
      ${rep === 'screenshot' ? '<button class="btn" data-action="tc:shot">Save screenshot to Working folder</button>' : '<button class="btn primary" data-action="tc:load" ' + (d ? '' : 'disabled') + '>Use this in Text Editor</button>' + (d ? '' : '<p class="d-small">Open the file in Text Editor first.</p>')}` : ''}</div>`;
    }
    const step = d?.dirty ? 'Save the file in Text Editor.' : d?.savedHere ? 'Close the file in Text Editor, then open it again, so you read what was actually saved.' : !d ? 'Open witness_working.txt in Text Editor again.' : null;
    return `<div class="cr-pad"><h2>Check the saved file</h2>${step ? `<p class="cr-next">${step}</p>` : `<p class="cr-next">If the text looks wrong, use the Encoding menu to change how it is read. Then verify it.</p><button class="btn primary" data-action="tc:verify">Verify saved file</button>`}${verifyResult()}<button class="eq-link" data-action="tc:reps">Choose a different encoding</button></div>`;
  },
  after(el) {
    const c = el.querySelector('canvas.shot');
    if (!c || c.dataset.drawn) return;
    c.dataset.drawn = 1;
    drawShot(c);
  },
  actions: {
    'tc:reps': () => { t().showReps = true; t().result = null; app.render(); },
    'tc:load': () => {
      const d = doc(), [, , encoding] = REPS.find(r => r[0] === t().rep);
      if (!d) return;
      d.encoding = encoding;
      d.text = decode(encode(TEXT, encoding), encoding);
      d.dirty = true;
      setEditor();
      t().result = null;
      t().showReps = false;
      t().rep = null;
      app.status('notepad', 'Loaded from the preserved text. Save it to keep this representation.');
    },
    'tc:shot': async () => {
      const path = await fileDialog({mode: 'save', title: 'Save As', name: 'witness_screenshot.png', dir: DIR.working, filter: ['png'], typeLabel: 'PNG image (*.png)', validate: p => (p.endsWith('.png') ? null : 'Screenshots save as .png files.')});
      if (!path) return;
      const c = document.createElement('canvas');
      c.width = 1120; c.height = 144;
      drawShot(c);
      const blob = await new Promise(r => c.toBlob(r, 'image/png'));
      await putBlob(path, blob);
      app.attempt({type: 'SAVE_SCREENSHOT', path, actualBytes: blob.size, blobKey: path});
    },
    'tc:verify': () => {
      const d = doc();
      if (!d) return setResult(false, 'Nothing open', 'Open the saved file in Text Editor first.');
      if (d.dirty) return setResult(false, 'Unsaved changes', 'Save the file first. The check reads the saved bytes.');
      if (d.savedHere) return setResult(false, 'Not reopened yet', 'Close the file and open it again, so you read what was actually saved.');
      if (app.s.files[d.path]?.version === 1) return setResult(false, 'This is the export', 'Save your own working copy first, then reopen it.');
      const reopened = !d.savedHere, decoding = d.encoding === 'UTF-8-BOM' ? 'UTF-8' : d.encoding;
      app.attempt({type: 'TEXT_CHECK', path: d.path, version: d.version, decoding, reopened});
      const bytes = fromBase64(d.b64);
      const asRead = decode(bytes, decoding);
      const diff = firstDifference(TEXT, asRead);
      if (!diff) return setResult(true, 'Characters intact, searchable', `The saved ${bytes.length} bytes read back as the same 92 characters.`);
      const trueBytes = decode(bytes, 'UTF-8') === TEXT;
      if (trueBytes) return setResult(false, 'Same bytes, wrong rulebook', `Reading as ${decoding}, "é" shows as "${[...decode(bytes, decoding)].slice(diff.index, diff.index + 2).join('')}". Change Encoding, not the file.`);
      return setResult(false, 'Characters differ', `${preservedCount(TEXT, asRead)} of 92 match. First difference: "${diff.expected}" became "${diff.actual}".`);
    },
  },
  inputs: {'tc:rep': el => { t().rep = el.value; t().result = null; app.dispatch({type: 'COMPARE_TEXT', encoding: el.value}); }},
});
function setResult(ok, title, text) { t().result = {ok, title, text}; app.render(); }
function drawShot(c) {
  const g = c.getContext('2d'), s = c.width / 560;
  g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#111'; g.font = `${13 * s}px Consolas, Menlo, monospace`;
  const words = TEXT.split(' ');
  let line = '', y = 22 * s;
  for (const w of words) {
    if (g.measureText(`${line} ${w}`).width > c.width - 24 * s) { g.fillText(line, 12 * s, y); line = w; y += 20 * s; } else line = line ? `${line} ${w}` : w;
  }
  g.fillText(line, 12 * s, y);
}

