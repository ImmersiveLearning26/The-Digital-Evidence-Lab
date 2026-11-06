// File Explorer over the shared filesystem. Deleting is explicit and logged; evidence cannot be touched.
import {app} from '../runtime.js';
import {esc, storyTime} from '../desktop/dom.js';
import {fileIcon, icons} from '../desktop/icons.js';
import {apps, openWindow, registerApp} from '../desktop/wm.js';
import {FOLDERS, PLACES, fileType, filesIn} from '../desktop/filedialog.js';
import {message} from '../desktop/modal.js';
import {registerContext} from '../desktop/context.js';
import {formatBytes} from '../core/domain.js';

const handlers = {};
export const registerOpener = (kind, fn) => { handlers[kind] = fn; };

// Opening is always a learner action. The file goes to its application, which applies its own gates.
export function openFileForLearner(path) {
  const f = app.s.files[path];
  if (!f) return app.guide('That file is no longer there.');
  const ext = f.name.split('.').pop().toLowerCase();
  if (ext === 'txt') return handlers.text?.(path);
  if (['jpg', 'png'].includes(ext) && f.settings.representation !== 'screenshot') return handlers.image?.(path);
  if (['flac', 'wav', 'mp3'].includes(ext)) return handlers.audio?.(path);
  if (ext === 'e01') return app.guide('Add this image to Evidence Imager with File > Add Evidence Item.');
  return app.guide(`${f.name} has no viewer in this lab.`);
}

function go(dir) {
  const e = app.ui.explorer;
  if (dir === e.dir) return;
  (e.back ??= []).push(e.dir);
  e.dir = dir;
  e.selected = null;
  app.ui.status.explorer = '';
  app.render();
}
function crumbs(dir) {
  const parts = dir.split('\\');
  return parts.map((p, i) => `<button class="crumb" data-action="ex:dir" data-dir="${esc(parts.slice(0, i + 1).join('\\'))}" ${i < 2 ? 'disabled' : ''}>${esc(i === 0 ? (p === 'C:' ? 'Local Disk (C:)' : 'Evidence Store (E:)') : p)}</button>`).join('<span class="crumb-sep">›</span>');
}
async function remove(path) {
  const f = app.s.files[path];
  if (!f) return;
  const yes = await message({title: 'Delete file', text: `Delete ${f.name}? This removes it from the processing allocation and is logged.`, buttons: [['Delete', true], ['Cancel', false]]});
  if (yes && app.attempt({type: 'DELETE_FILE', path})) { app.ui.explorer.selected = null; app.render(); }
}
registerContext('file', el => {
  const path = el.dataset.path, f = app.s.files[path];
  return [['Open', () => openFileForLearner(path)], null, ['Delete', () => remove(path)], ['Properties', () => message({title: `${f.name} Properties`, text: `Type: ${fileType(f)}. Version ${f.version}. Allocation counted: ${formatBytes(f.bytes)}.${f.readOnly ? ' Read-only.' : ''}`})]];
});

registerApp({
  id: 'explorer', title: 'File Explorer', icon: icons.explorer, rect: {x: .1, y: .08, w: .66, h: .72},
  windowTitle: () => app.ui.explorer.dir.split('\\').pop(),
  view() {
    const e = app.ui.explorer;
    const subs = (FOLDERS[e.dir] ?? []);
    const files = filesIn(e.dir);
    const sel = e.selected && app.s.files[e.selected];
    return `<div class="explorer" tabindex="-1" data-keys="explorer"><div class="ex-bar"><button class="ex-nav" data-action="ex:back" aria-label="Back" ${e.back?.length ? '' : 'disabled'}>←</button><button class="ex-nav" data-action="ex:up" aria-label="Up one folder" ${e.dir.split('\\').length > 2 ? '' : 'disabled'}>↑</button><div class="ex-path">${crumbs(e.dir)}</div></div>
    <div class="ex-main"><nav class="fd-nav" aria-label="Locations">${PLACES.map(([label, dir, icon]) => `<button class="${e.dir === dir ? 'sel' : ''}" data-action="ex:dir" data-dir="${esc(dir)}">${icon}<span>${esc(label)}</span></button>`).join('')}</nav>
    <div class="fd-list"><table><thead><tr><th>Name</th><th>Date modified</th><th>Type</th><th>Size</th></tr></thead><tbody>
    ${subs.map(n => `<tr class="row"><td><button class="ex-row" data-dbl-action="ex:dir" data-dir="${esc(e.dir)}\\${esc(n)}" title="Double-click to open">${icons.folder}<span>${esc(n)}</span></button></td><td></td><td>File folder</td><td></td></tr>`).join('')}
    ${files.map(f => `<tr class="row ${e.selected === f.path ? 'sel' : ''}" data-key="${esc(f.path)}"><td><button class="ex-row" data-action="ex:select" data-dbl-action="ex:open-path" data-ctx="file" data-path="${esc(f.path)}" aria-pressed="${e.selected === f.path}">${fileIcon(f)}<span>${esc(f.name)}</span></button></td><td>${storyTime(f.savedAt)}</td><td>${esc(fileType(f))}${f.readOnly ? ' · Read-only' : ''}</td><td>${f.kind === 'evidence' ? 'Preserved' : formatBytes(f.actualBytes ?? f.bytes)}</td></tr>`).join('')}
    </tbody></table>${!subs.length && !files.length ? '<p class="fd-empty">This folder is empty.</p>' : ''}</div></div>
    <footer class="ex-foot">${app.ui.status.explorer ? esc(app.ui.status.explorer) : `${files.length} item${files.length === 1 ? '' : 's'}${sel ? ` · ${esc(sel.name)} v${sel.version}` : ''}`}</footer></div>`;
  },
  actions: {
    'ex:dir': el => go(el.dataset.dir),
    'ex:back': () => { const e = app.ui.explorer, dir = e.back?.pop(); if (dir) { e.dir = dir; e.selected = null; app.render(); } },
    'ex:up': () => { const e = app.ui.explorer; go(e.dir.slice(0, e.dir.lastIndexOf('\\'))); },
    'ex:select': el => { app.ui.explorer.selected = el.dataset.path; app.render(); },
    'ex:open': () => openFileForLearner(app.ui.explorer.selected),
    'ex:open-path': el => openFileForLearner(el.dataset.path),
    'ex:delete': () => remove(app.ui.explorer.selected),
  },
});
export {apps, openWindow};
