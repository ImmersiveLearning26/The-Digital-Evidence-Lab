// Developer gear. Previewing never awards credit; seeding a stage marks the run as developer-assisted.
import {app} from '../runtime.js';
import {esc} from './dom.js';
import {icons} from './icons.js';
import {COPY} from '../content/copy.js';
import {TEXT, DIR, IMAGE_MASTER_PATH, WITNESS_PATH} from '../core/domain.js';
import {encode, toBase64} from '../core/bytes.js';
import {loadEvidence} from '../core/evidence.js';
import {openWindow} from './wm.js';
import {openCase} from '../apps/case.js';

const SCREENS = {
  'Equipment bench': () => app.setMode('equipment'), 'Chat': () => app.openPage('chat'), 'Shared folder': () => app.openPage('drive'), 'Evidence intake': () => app.openPage('intake'),
  'Briefing call': () => app.openPage('meet', {call: 'briefing'}), 'Evidence Imager': () => openWindow('ftk'), 'Text Editor and encoding case': () => { openWindow('notepad'); openCase('text'); },
  'Image Editor and pixel case': () => { openWindow('gimp'); openCase('image'); }, 'Audio Recorder and ADC case': () => { openWindow('audacity'); openCase('audio'); },
  'File Explorer': () => openWindow('explorer'), 'Final handover': () => app.openPage('handover'), 'Debrief': () => app.openPage('debrief'),
};
const FLUSH = () => { while (app.s.outbox.length) app.dispatch({type: 'DELIVER'}); };
const say = (...events) => { for (const e of events) app.dispatch(e); FLUSH(); };
async function seed(stage) {
  const e = await loadEvidence();
  const s = () => app.s;
  app.dispatch({type: 'DEV_ASSIST'});
  if (!s().powered) app.dispatch({type: 'POWER'});
  if (!s().name) app.dispatch({type: 'LOGIN', name: 'Developer'});
  app.ui.mode = 'desktop';
  app.scene3d?.hide();
  const hash = {witnessSha: e.witness.sha256, cctvSha: e.cctv.sha256, cctvBytes: e.cctv.bytes.length};
  if (!s().intake) say({type: 'FOLDER_OPENED'}, {type: 'BRIEF', skipped: true}, ...['text', 'image', 'audio'].map(kind => ({type: 'INSPECT', kind})), {type: 'RANK', risk: ['audio', 'text', 'image']}, {type: 'INTAKE', objective: 'preserve'});
  if (stage === 'ftk') return;
  if (!s().copies) say({type: 'HARDWARE', part: 'blocker'}, {type: 'HARDWARE', part: 'drive'}, {type: 'ACQUIRE', source: 'evidence', destination: 'store', verify: true, match: true, md5: e.drive.md5, sha1: e.drive.sha1, witnessSha: e.witness.sha256, cctvSha: e.cctv.sha256}, {type: 'ADD_EVIDENCE'}, {type: 'COPIES', ...hash});
  if (stage === 'text') return;
  if (!s().approved.text) {
    say({type: 'OPEN', kind: 'text'}, {type: 'SAVE_TEXT', path: WITNESS_PATH, b64: toBase64(encode(TEXT, 'UTF-8')), encoding: 'UTF-8'});
    say({type: 'TEXT_CHECK', path: WITNESS_PATH, version: s().files[WITNESS_PATH].version, decoding: 'UTF-8', reopened: true}, {type: 'SUBMIT', path: WITNESS_PATH}, {type: 'REVIEW'});
  }
  if (stage === 'image') return;
  if (!s().approved.image) {
    const m = e.meta.measured;
    say({type: 'OPEN', kind: 'image'}, ...Object.keys(m).map(target => ({type: 'PICK', target, rgb: m[target], x: 0, y: 0})), {type: 'RGB_MATCH', rgb: m.plate}, {type: 'RATIONALE', kind: 'image', text: 'Developer seed.'}, {type: 'SAVE_IMAGE', path: IMAGE_MASTER_PATH, width: 4000, height: 3000, ppi: 300}, {type: 'IMAGE_CHECK', path: IMAGE_MASTER_PATH, reopened: true}, {type: 'SUBMIT', path: IMAGE_MASTER_PATH}, {type: 'REVIEW'});
  }
  if (stage === 'audio') return;
  if (!s().approved.audio) {
    const path = `${DIR.working}\\statement_master.flac`;
    say(...['tape', 'interface', 'headphones'].map(part => ({type: 'HARDWARE', part})), {type: 'OPEN', kind: 'audio'}, {type: 'AUDIO_DEVICE', device: 'interface'}, {type: 'AUDIO_SET', patch: {rate: 44100}}, {type: 'AUDIO_STEP'}, {type: 'AUDIO_SET', patch: {bits: 16}}, {type: 'AUDIO_STEP'}, {type: 'RATIONALE', kind: 'audio', text: 'Developer seed.'}, {type: 'CAPTURE'}, {type: 'SAVE_AUDIO', path, format: 'FLAC', rate: 44100, bits: 16}, {type: 'AUDIO_CHECK', path}, {type: 'SUBMIT', path}, {type: 'REVIEW'});
  }
}
export function devPanel() {
  // Hidden from learners. Add ?dev to the address to show the gear; the tests open the panel directly.
  if (!app.ui.dev) return new URLSearchParams(location.search).has('dev') ? `<button class="dev-gear" data-action="dev:toggle" aria-label="Developer controls">${icons.gear}</button>` : '';
  const keys = Object.keys(COPY), key = app.ui.devKey ?? keys[0];
  return `<aside class="dev" aria-label="Developer controls"><header><strong>Developer controls</strong><button data-action="dev:toggle" aria-label="Close developer controls">×</button></header>
  <label>Preview a screen <select id="dev-screen">${Object.keys(SCREENS).map(k => `<option>${esc(k)}</option>`).join('')}</select></label><button class="btn" data-action="dev:screen">Preview</button><p>Previews award nothing.</p>
  <label>Seed a stage <select id="dev-stage"><option value="ftk">Ready for imaging</option><option value="text">Ready for text</option><option value="image">Ready for image</option><option value="audio">Ready for audio</option><option value="handover">Ready for handover</option></select></label><button class="btn" data-action="dev:seed">Seed</button><p>Marks the run as developer-assisted.</p>
  <div class="row-gap"><button class="btn" data-action="dev:pause">${app.ui.paused ? 'Resume' : 'Freeze'}</button><button class="btn" data-action="dev:skip">Skip media</button><button class="btn" data-action="dev:reset">Restart</button></div>
  <label>Edit Amina's draft line <select id="dev-key" data-input="dev:key">${keys.map(k => `<option value="${k}" ${k === key ? 'selected' : ''}>${k}</option>`).join('')}</select></label><textarea id="dev-copy" aria-label="Draft text">${esc(app.s.copy[key] ?? COPY[key])}</textarea><button class="btn" data-action="dev:copy">Save draft</button>
  <details><summary>State inspector</summary><pre>${esc(JSON.stringify({...app.s, files: Object.keys(app.s.files), log: app.s.log.slice(-12)}, null, 1))}</pre></details></aside>`;
}
app.register({
  'dev:toggle': () => { app.ui.dev = !app.ui.dev; app.render(); },
  'dev:screen': () => { SCREENS[document.getElementById('dev-screen').value](); },
  'dev:seed': () => seed(document.getElementById('dev-stage').value).catch(e => app.guide(e.message)),
  'dev:pause': () => app.setPaused(!app.ui.paused),
  'dev:skip': () => app.skipMedia?.(),
  'dev:reset': () => { if (confirm('Restart? This removes the saved session.')) app.reset(); },
  'dev:copy': () => app.dispatch({type: 'DEV_COPY', key: app.ui.devKey ?? Object.keys(COPY)[0], text: document.getElementById('dev-copy').value}),
}, {'dev:key': el => { app.ui.devKey = el.value; app.render(); }});
