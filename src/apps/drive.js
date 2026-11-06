import {app} from '../runtime.js';
import {esc} from '../desktop/dom.js';
import {icons} from '../desktop/icons.js';
import {picture} from '../content/media.js';
import {TEXT} from '../core/domain.js';
import {registerPage} from './browser.js';
import {openViewer} from '../desktop/viewer.js';

const RECORDS = {
  text: {
    name: 'Witness message — source record', icon: icons.file, format: 'Text export (.txt), encoding not stated on the label',
    need: 'Make the message readable and searchable while retaining its original characters.',
    risk: 'Medium to high: the source phone’s storage is degrading, so reads can fail.', status: 'Preserve original',
    preview: () => `<blockquote class="d-quote" lang="sw">${esc(TEXT)}</blockquote><p class="d-small">Preview only. This record is not a working file.</p>`,
  },
  image: {
    name: 'CCTV still — source record', icon: icons.fileImage, format: 'JPEG, 4000 × 3000 pixels',
    need: 'Enlarge a marked region: the number plate.', risk: 'Low: the source is stable.', status: 'Stable',
    preview: () => picture('cctvThumb', 'd-img'),
  },
  audio: {
    name: 'Microcassette — intake record', icon: icons.fileAudio, format: 'Analogue microcassette, 10 minutes, mono',
    need: 'Digitise the conversation.', risk: 'High: tape wears with each playback, so play it once, carefully.', status: 'Sealed',
    preview: () => `${picture('tape', 'd-img')}<p class="d-small">Photograph of the sealed tape. No digital recording exists yet, so there is nothing to play.</p>`,
  },
};

// One gentle nudge if the learner sits idle with records unread. It never repeats.
let nudge = null;
function armNudge() {
  if (nudge !== null || app.ui.drive.nudged || app.s.inspected.length === 3) return;
  nudge = app.clock.after(7000, () => {
    nudge = null;
    const next = Object.keys(RECORDS).find(k => !app.s.inspected.includes(k));
    if (!next || app.ui.browser.active !== 'drive') return;
    app.ui.drive.nudged = true;
    app.ui.drive.pulse = next;
    app.status('browser', '');
    app.render();
  });
}

registerPage({
  id: 'drive', title: 'Intake - Case Drive', icon: icons.drive,
  url: () => 'https://files.evidencelab.example/case-0417/intake',
  onOpen() {
    if (!app.s.folderOpened) app.dispatch({type: 'FOLDER_OPENED'});
    armNudge();
  },
  view() {
    const sel = app.ui.drive.selected;
    return `<div class="gdrive">
    <aside class="gd-nav"><div class="gd-logo">${icons.drive}<span>Drive</span></div><button class="gd-link on">Shared with me</button></aside>
    <section class="gd-main"><h1>Shared with me › Case 0417 › <strong>Intake</strong></h1>
     <table class="gd-table"><thead><tr><th>Name</th><th>Owner</th><th>Modified</th><th>Status</th></tr></thead><tbody>
     ${Object.entries(RECORDS).map(([k, r]) => `<tr class="${sel === k ? 'sel' : ''} ${app.ui.drive.pulse === k && !app.s.inspected.includes(k) ? 'pulse' : ''}" data-key="${k}"><td><button class="gd-row" data-action="drive:open" data-kind="${k}" aria-pressed="${sel === k}">${r.icon}<span>${esc(r.name)}</span></button></td><td>Amina Njoroge</td><td>09:05</td><td>${app.s.inspected.includes(k) ? '✓ Read' : 'Not read'}</td></tr>`).join('')}
     </tbody></table>
     <p class="gd-count">${app.s.inspected.length} of 3 records read. Read-only intake records.</p>${app.ui.drive.pulse && app.s.inspected.length < 3 ? '<p class="gd-nudge" role="status">Amina: Tray cards first. Open each record.</p>' : ''}
    </section>
    </div>`;
  },
  actions: {
    // A record opens large in the middle of the screen, with its facts beneath.
    'drive:open': el => {
      const kind = el.dataset.kind, rec = RECORDS[kind];
      app.ui.drive.selected = kind;
      app.dispatch({type: 'INSPECT', kind});
      openViewer({title: rec.name, media: rec.preview(), facts: [['Format', rec.format], ['What it needs', rec.need], ['Risk', rec.risk], ['Status', rec.status]]});
    },
  },
});
