// The one Open/Save dialog every application uses, over the same simulated filesystem.
import {app} from '../runtime.js';
import {esc} from './dom.js';
import {fileIcon, icons} from './icons.js';
import {modal, message} from './modal.js';
import {DIR, formatBytes, isEvidencePath} from '../core/domain.js';
import {storyTime} from './dom.js';

export const FOLDERS = {
  'C:\\Cases\\0417': ['Working', 'Submitted', 'Reports'],
  'E:\\EvidenceStore\\0417': [],
};
export const PLACES = [
  ['Working', DIR.working, icons.folder], ['Submitted', DIR.submitted, icons.folder], ['Reports', DIR.reports, icons.folder],
  ['Local Disk (C:)', 'C:\\Cases\\0417', icons.disk], ['Evidence Store (E:)', DIR.store, icons.disk],
];
export const filesIn = dir => Object.values(app.s.files).filter(f => f.dir === dir).sort((a, b) => a.name.localeCompare(b.name));
const typeOf = f => ({txt: 'Text Document', png: 'PNG Image', jpg: 'JPEG Image', flac: 'FLAC Audio', wav: 'WAV Audio', mp3: 'MP3 Audio', e01: 'EnCase Image', json: 'JSON File'}[f.name.split('.').pop().toLowerCase()] ?? 'File');
export const fileType = typeOf;
const crumb = dir => dir.replace(/^C:\\/, 'This PC › Local Disk (C:) › ').replace(/^E:\\/, 'This PC › Evidence Store (E:) › ').replace(/\\/g, ' › ');
const sizeOf = f => (f.kind === 'evidence' ? 'Preserved' : formatBytes(f.actualBytes ?? f.bytes));
const matches = (f, ext) => !ext?.length || ext.includes(f.name.split('.').pop().toLowerCase());

function view(st) {
  const subs = (FOLDERS[st.dir] ?? []).map(n => `<tr class="row" tabindex="0" data-m="open-dir" data-enter data-dir="${esc(st.dir)}\\${esc(n)}"><td>${icons.folder}<span>${esc(n)}</span></td><td>File folder</td><td></td><td></td></tr>`).join('');
  const rows = filesIn(st.dir).filter(f => matches(f, st.filter)).map(f => `<tr class="row ${st.selected === f.path ? 'sel' : ''}" tabindex="0" data-m="pick" data-dbl="confirm-file" data-enter data-path="${esc(f.path)}" aria-selected="${st.selected === f.path}"><td>${fileIcon(f)}<span>${esc(f.name)}</span></td><td>${esc(typeOf(f))}</td><td>${f.kind === 'evidence' ? '' : 'v' + f.version}</td><td>${sizeOf(f)}</td></tr>`).join('');
  const nameId = 'fd-name';
  return `<div class="fd">
  <div class="fd-path">${esc(crumb(st.dir))}</div>
  <div class="fd-main">
   <nav class="fd-nav" aria-label="Locations">${PLACES.map(([label, dir, icon]) => `<button class="${st.dir === dir ? 'sel' : ''}" data-m="open-dir" data-dir="${esc(dir)}">${icon}<span>${esc(label)}</span></button>`).join('')}</nav>
   <div class="fd-list"><table><thead><tr><th>Name</th><th>Type</th><th>Version</th><th>Size</th></tr></thead><tbody>${subs}${rows}</tbody></table>${!subs && !rows ? '<p class="fd-empty">This folder is empty.</p>' : ''}</div>
  </div>
  ${st.error ? `<p class="fd-error" role="alert">${esc(st.error)}</p>` : ''}
  <div class="fd-foot">
   <label for="${nameId}">File name:</label><input id="${nameId}" data-bind="name" value="${esc(st.name)}" autocomplete="off" spellcheck="false" ${st.mode === 'save' ? 'data-autofocus' : ''}>
   <select aria-label="File type" disabled><option>${esc(st.typeLabel)}</option></select>
   <button class="btn primary" data-m="confirm" data-default>${st.mode === 'save' ? esc(st.saveLabel) : 'Open'}</button><button class="btn" data-m="cancel">Cancel</button>
  </div></div>`;
}

export function fileDialog({mode = 'open', title, dir = DIR.working, name = '', filter = null, typeLabel = 'All files (*.*)', saveLabel = 'Save', validate = null}) {
  const state = {mode, dir, name, filter, typeLabel, saveLabel, selected: null, error: ''};
  return modal({
    title: title ?? (mode === 'save' ? 'Save As' : 'Open'), cls: 'file-dialog', width: 760, state, view,
    actions: {
      'open-dir': (el, ev, api) => { state.dir = el.dataset.dir; state.selected = null; state.error = ''; api.update(); },
      pick: (el, ev, api) => { state.selected = el.dataset.path; state.name = el.dataset.path.split('\\').pop(); state.error = ''; api.update(); },
      'confirm-file': (el, ev, api) => { state.selected = el.dataset.path; state.name = state.selected.split('\\').pop(); confirm(api); },
      confirm: (el, ev, api) => confirm(api),
    },
  });
  async function confirm(api) {
    const name = state.name.trim();
    if (!name) { state.error = 'Type a file name or choose a file.'; api.update(); return; }
    const path = name.includes('\\') ? name : `${state.dir}\\${name}`;
    if (mode === 'open') {
      if (!app.s.files[path]) { state.error = `${name} was not found in this folder.`; api.update(); return; }
      api.close(path);
      return;
    }
    if (isEvidencePath(path)) { state.error = 'The evidence store is read-only. Save working files in the Working folder.'; api.update(); return; }
    if (!(FOLDERS['C:\\Cases\\0417'].some(n => path.startsWith(`C:\\Cases\\0417\\${n}\\`)))) { state.error = 'Choose one of the case folders.'; api.update(); return; }
    const problem = validate?.(path);
    if (problem) { state.error = problem; api.update(); return; }
    const existing = app.s.files[path];
    if (existing) {
      if (existing.readOnly) { state.error = `${name} is read-only and cannot be replaced.`; api.update(); return; }
      const ok = await message({title: 'Confirm Save As', text: `${name} already exists. Replace it? The new save becomes version ${existing.version + 1}.`, buttons: [['Replace', true], ['Cancel', false]]});
      if (!ok) return;
    }
    api.close(path);
  }
}
export {storyTime};
