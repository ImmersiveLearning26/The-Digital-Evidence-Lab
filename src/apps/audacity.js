// Audacity: one mono track, one real capture presentation. ADC settings, 32-bit float processing and export
// format are kept visibly separate, because confusing them is the misconception this task addresses.
import {app} from '../runtime.js';
import {emptyState, esc, reducedMotion} from '../desktop/dom.js';
import {icons} from '../desktop/icons.js';
import {openWindow, registerApp} from '../desktop/wm.js';
import {menubar} from '../desktop/menu.js';
import {modal} from '../desktop/modal.js';
import {FOLDERS} from '../desktop/filedialog.js';
import {fileDialog} from '../desktop/filedialog.js';
import {DIR, ENCODINGS, ITEM_LIMIT, QUANTISATION, SAMPLING, audioBytes, dynamicRange, formatBytes, nyquist, quantisationLevels} from '../core/domain.js';
import {lockReason} from '../core/state.js';
import {clipFor, loadClips, peaks, playClip, stopClip} from '../core/lab.js';
import {registerCaseTab} from './case.js';
import {registerOpener} from './explorer.js';

const a = () => (app.ui.aud.session ??= {progress: 0, recording: false, playing: null, position: 0});
let wave = null, envelope = null, playback = null;
const SOURCE_SECONDS = 600;

// The 10-second reference clip stands in for the 10-minute tape: the track shows it across the full length.
async function ensureEnvelope() {
  if (envelope) return envelope;
  await loadClips();
  const base = peaks('reference', 480);
  if (!base) return null;
  const out = new Float32Array(1200);
  let seed = 417;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };
  for (let i = 0; i < out.length; i++) out[i] = base[Math.floor((i * 7.3 + rnd() * 40) % base.length)] * (.65 + rnd() * .45);
  envelope = out;
  app.render();
  return out;
}
function drawWave() {
  if (!wave) return;
  const r = wave.getBoundingClientRect(), ratio = Math.min(devicePixelRatio, 2);
  if (!r.width) return;
  if (wave.width !== Math.round(r.width * ratio)) { wave.width = Math.round(r.width * ratio); wave.height = Math.round(r.height * ratio); }
  const g = wave.getContext('2d'), W = wave.width, H = wave.height, st = a();
  g.fillStyle = '#d7dbe2';
  g.fillRect(0, 0, W, H);
  g.strokeStyle = '#9aa3b2';
  g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke();
  const shown = app.s.audio.captured ? 1 : st.progress;
  if (envelope && shown > 0) {
    g.fillStyle = st.recording ? '#c9413d' : '#3f51d6';
    const bars = Math.floor(W / ratio);
    for (let x = 0; x < bars * shown; x++) {
      const v = envelope[Math.floor(x / bars * envelope.length)] * (H / 2) * 1.5;
      g.fillRect(x * ratio, H / 2 - v, ratio, v * 2);
    }
  }
  if (st.playing) { g.fillStyle = '#111'; g.fillRect(st.position * W, 0, ratio, H); }
}
function ensureOpen() {
  const reason = lockReason(app.s, 'audio');
  if (reason) { app.guide(reason); return false; }
  return app.attempt({type: 'OPEN', kind: 'audio'});
}
const mmss = t => `${String(Math.floor(t / 60)).padStart(2, '0')} m ${String(Math.floor(t % 60)).padStart(2, '0')} s`;

async function record() {
  const s = app.s;
  if (a().recording) return;
  if (s.audio.captured) return app.guide('Tape already captured. It plays once. Use the preserved master or the reference previews.');
  if (!ensureOpen()) return;
  if (!app.attempt({type: 'CAPTURE_BEGIN'})) return;
  await ensureEnvelope();
  const st = a();
  st.recording = true; st.progress = 0;
  app.busyAudio = true;
  app.render();
  // A cancelled capture commits nothing: CAPTURE fires once, at the end, on the pausable clock.
  await app.clock.tween(reducedMotion() ? 1500 : 6500, u => { st.progress = u; drawWave(); const t = document.getElementById('aud-time'); if (t) t.textContent = mmss(u * SOURCE_SECONDS); });
  st.recording = false;
  app.busyAudio = false;
  app.dispatch({type: 'CAPTURE'});
  app.status('audacity', 'Recording stopped. Ten minutes of tape captured once. Export a master.');
  app.pump();
}
async function play() {
  if (!app.s.audio.captured) return app.status('audacity', 'Nothing to play yet. Previews are in the Case Record.');
  const st = a();
  st.playing = true; st.position = 0;
  await playClip('reference', () => { st.playing = false; playback = null; app.pump(); app.render(); });
  playback = app.clock.tween(10000, u => { st.position = u; if (st.playing) drawWave(); });
  app.status('audacity', 'Playing the preserved master. The tape itself is not being played.');
}
function stop() { stopClip(); a().playing = null; app.render(); }

async function exportAudio() {
  if (!app.s.audio.captured) return app.status('audacity', 'There is no audio to export. Capture the tape first.');
  const state = {name: 'statement_master', format: 'FLAC', rate: 44100, bits: 16, folder: DIR.working, error: ''};
  const ext = st => ({FLAC: 'flac', WAV: 'wav', MP3: 'mp3'}[st.format]);
  const choice = await modal({
    title: 'Export Audio', width: 520, state,
    view: st => {
      const bytes = audioBytes(Number(st.rate), Number(st.bits), st.format);
      return `<label class="f-field"><span>File Name</span><input data-bind="name" value="${esc(st.name)}" spellcheck="false" data-autofocus></label>
      <label class="f-field"><span>Folder</span><select data-bind="folder">${FOLDERS['C:\\Cases\\0417'].map(n => `<option value="C:\\Cases\\0417\\${n}" ${st.folder.endsWith(n) ? 'selected' : ''}>C:\\Cases\\0417\\${n}</option>`).join('')}</select></label>
      <label class="f-field"><span>Format</span><select data-bind="format">${[['FLAC', 'FLAC Files'], ['WAV', 'WAV (Microsoft), Signed PCM'], ['MP3', 'MP3 Files']].map(([k, t]) => `<option value="${k}" ${st.format === k ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
      <dl class="f-dl"><dt>Channels</dt><dd>Mono</dd></dl>
      <label class="f-field"><span>Sample Rate</span><select data-bind="rate">${[8000, 16000, 44100, 96000].map(r => `<option value="${r}" ${Number(st.rate) === r ? 'selected' : ''}>${r} Hz</option>`).join('')}</select></label>
      ${st.format === 'MP3' ? '<dl class="f-dl"><dt>Bit Rate</dt><dd>128 kbps</dd></dl>' : `<label class="f-field"><span>Bit Depth</span><select data-bind="bits">${[16, 24].map(b => `<option value="${b}" ${Number(st.bits) === b ? 'selected' : ''}>${b}-bit</option>`).join('')}</select></label>`}
      <p class="d-small">Size: ${st.format === 'WAV' ? '' : 'about '}${formatBytes(bytes)}${st.format === 'FLAC' ? ' (estimate: 55% of PCM)' : ''} of the 100 MB limit. Saved from a ${app.s.audio.captureRate} Hz, ${app.s.audio.captureBits}-bit capture.</p>
      ${st.error ? `<p class="fd-error" role="alert">${esc(st.error)}</p>` : ''}<footer class="modal-foot"><button class="btn primary" data-m="ok" data-default>Export</button><button class="btn" data-m="cancel">Cancel</button></footer>`;
    },
    actions: {ok: (el, ev, api) => { if (!api.state.name.trim()) { api.state.error = 'Enter a file name.'; api.update(); return; } api.close({...api.state}); }},
  });
  if (!choice) return;
  const base = choice.name.trim().replace(/\.[a-z0-9]+$/i, '');
  const path = `${choice.folder}\\${base}.${ext(choice)}`;
  const rate = Number(choice.rate), bits = choice.format === 'MP3' ? 16 : Number(choice.bits);
  if (app.attempt({type: 'SAVE_AUDIO', path, format: choice.format, rate, bits})) app.status('audacity', `Exported ${base}.${ext(choice)}. Check it in the Case Record, then attach it in Chat.`);
}
const menus = () => [
  {name: 'File', items: [{label: 'Save Project', action: 'au:save-project', key: 'Ctrl+S'}, {label: 'Export Audio...', action: 'au:export', key: 'Shift+Ctrl+E'}, '-', {label: 'Exit', action: 'win:close'}]},
  {name: 'Edit', items: [{label: 'Undo'}, {label: 'Preferences'}]}, {name: 'Select', items: [{label: 'All'}]}, {name: 'View', items: [{label: 'Zoom In'}]},
  {name: 'Transport', items: [{label: 'Play', action: 'au:play'}, {label: 'Stop', action: 'au:stop'}, {label: 'Record', action: 'au:record'}]},
  ...['Tracks', 'Generate', 'Effect', 'Analyze', 'Tools', 'Help'].map(name => ({name, items: [{label: `${name} commands`}]})),
];
registerApp({
  id: 'audacity', title: 'Audacity', icon: icons.audacity, rect: {x: .012, y: .012, w: .695, h: .97},
  windowTitle: () => (app.s.audio.captured ? 'statement_capture - Audacity' : 'Audacity'),
  view() {
    const s = app.s, st = a(), au = s.audio;
    const iface = s.hardware.interface;
    const time = au.captured ? SOURCE_SECONDS : st.progress * SOURCE_SECONDS;
    return `<div class="audacity">${menubar('audacity', menus())}
    <div class="au-transport" role="toolbar" aria-label="Transport"><button data-action="au:play" aria-label="Play">▶</button><button data-action="au:stop" aria-label="Stop">■</button><button class="rec ${st.recording ? 'on' : ''}" data-action="au:record" aria-label="Record">●</button><div class="au-meter" aria-hidden="true"><i style="width:${st.recording ? 62 : 0}%"></i></div></div>
    ${iface ? `<div class="au-device"><label>Recording Device <select data-input="au:device" aria-label="Recording device"><option value="" ${au.device ? '' : 'selected'}>Choose input</option><option value="mic" ${au.device === 'mic' ? 'selected' : ''}>Microphone Array (built-in)</option><option value="interface" ${au.device === 'interface' ? 'selected' : ''}>USB Audio Interface</option></select></label><label>Channels <select disabled><option>1 (Mono) Recording Channel</option></select></label><label>Project Rate <select disabled><option>${au.rate} Hz</option></select></label></div>` : ''}
    <div class="au-ruler" aria-hidden="true">${Array.from({length: 11}, (_, i) => `<span>${i}:00</span>`).join('')}</div>
    <div class="au-tracks">${!au.captured && !st.recording ? `<div class="app-start dark">${iface ? emptyState('Nothing recorded yet', 'The tape can be captured here once your settings are confirmed.') : emptyState('No recording input detected', 'Audacity cannot hear the tape. Connect the audio interface at your bench.')}</div>` : ''}<div class="au-track-head"><strong>Audio Track</strong><small>Mono, ${au.captured ? au.captureRate : au.rate} Hz</small><small>32-bit float</small><small class="sep">Internal processing format, not the capture depth.</small></div><canvas data-keep id="aud-wave" role="img" aria-label="${au.captured ? 'Captured waveform, ten minutes represented' : 'Empty track'}"></canvas></div>
    <div class="au-sel"><span>Project Rate (Hz) ${au.rate}</span><span class="au-time" id="aud-time" aria-label="Source time">${mmss(time)}</span><span>${au.captured ? 'Ten minutes of source represented. Capture took seconds here.' : st.recording ? 'Recording. Tape is playing once.' : 'Ready.'}</span></div>
    <footer class="status-bar"><span>${esc(app.ui.status.audacity ?? 'Stopped.')}</span></footer></div>`;
  },
  after(body) {
    ensureOpenSoft();
    const c = body.querySelector('#aud-wave');
    if (c) { wave = c; if (app.s.audio.captured) ensureEnvelope(); drawWave(); }
  },
  onResize() { drawWave(); },
  unmount() { wave = null; },
  actions: {
    'au:play': play, 'au:stop': stop, 'au:record': record, 'au:export': exportAudio,
    'au:save-project': () => app.status('audacity', 'Project saved. A project is not an audio export: use File > Export Audio for the master.'),
  },
  inputs: {'au:device': el => { app.dispatch({type: 'AUDIO_DEVICE', device: el.value}); if (el.value === 'mic') app.status('audacity', 'The built-in microphone cannot hear the tape. Select the USB Audio Interface.'); }},
});
function ensureOpenSoft() { if (!lockReason(app.s, 'audio') && !app.s.audio.opened) app.dispatch({type: 'OPEN', kind: 'audio'}); }
registerOpener('audio', () => { openWindow('audacity'); app.status('audacity', 'The master is already in this project. Previews stay in the Case Record.'); });

// ---- Case record: ADC comparison.
const STEPS = ['Sampling rate', 'Quantisation', 'Encoding'];
const c = () => (app.ui.audioCase ??= {playing: null, result: null});
const preview = (id, label, detail) => `<button class="ab ${c().playing === id ? 'on' : ''}" data-action="ac:play" data-id="${id}" aria-pressed="${c().playing === id}"><span aria-hidden="true">${c().playing === id ? '■' : '▶'}</span><span><strong>${label}</strong><small>${detail}</small></span></button>`;
function setting(s, key, label, options) {
  const au = s.audio;
  return `<label class="lab-field"><span>${label}</span><select data-input="ac:set" data-key="${key}" aria-label="${label}">${options.map(([v, t]) => `<option value="${v}" ${String(au[key]) === String(v) ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`;
}
function findings(s) {
  const au = s.audio, sam = SAMPLING[au.rate], q = QUANTISATION[au.bits];
  return `<ul class="findings" aria-label="What to listen for"><li><strong>Speech:</strong> ${esc(au.bits === 8 ? q.speech : sam.speech)}</li><li><strong>Buzzer:</strong> ${esc(sam.buzzer)}</li><li><strong>Captures up to:</strong> ${nyquist(au.rate) / 1000} kHz (buzzer reaches about 10 kHz)</li><li><strong>Levels:</strong> ${quantisationLevels(au.bits).toLocaleString('en')} (about ${dynamicRange(au.bits)} dB)</li></ul><p class="d-small">${esc(au.step === 0 ? sam.note : au.step === 1 ? q.note : ENCODINGS[au.format].note)}</p>`;
}
function coverage(rate) {
  const pct = v => Math.min(100, v / 24 * 100);
  return `<div class="coverage" role="img" aria-label="Frequency coverage up to ${nyquist(rate) / 1000} kilohertz; buzzer harmonics reach 10 kilohertz"><i class="cov-band" style="width:${pct(nyquist(rate) / 1000)}%"></i><i class="cov-buzz" style="left:${pct(1)}%;width:${pct(9)}%"></i><span>0</span><span>12 kHz</span><span>24 kHz</span></div>`;
}
function drawSignal(cv, rate, bits) {
  const g = cv.getContext('2d'), W = cv.width, H = cv.height;
  g.clearRect(0, 0, W, H);
  const sig = t => .55 * Math.sin(t * 9) + .25 * Math.sin(t * 31) + .12 * Math.sin(t * 57);
  g.strokeStyle = '#9aa7ba'; g.lineWidth = 1.5; g.beginPath();
  for (let x = 0; x < W; x++) { const y = H / 2 - sig(x / W * 6.3) * H * .42; x ? g.lineTo(x, y) : g.moveTo(x, y); }
  g.stroke();
  const n = {8000: 10, 16000: 18, 44100: 42, 96000: 70}[rate], levels = {8: 7, 16: 40, 24: 90}[bits];
  g.strokeStyle = '#1259c3'; g.fillStyle = '#1259c3'; g.lineWidth = 1.5; g.beginPath();
  let last = null;
  for (let i = 0; i <= n; i++) {
    const x = i / n * W, v = Math.round(sig(x / W * 6.3) * levels) / levels, y = H / 2 - v * H * .42;
    if (last !== null) { g.lineTo(x, last); g.lineTo(x, y); } else g.moveTo(x, y);
    last = y;
    if (n < 50) g.fillRect(x - 1.5, y - 1.5, 3, 3);
  }
  g.stroke();
}
registerCaseTab({
  id: 'audio',
  view() {
    const s = app.s, au = s.audio;
    if (!au.opened) return '<div class="cr-pad"><h2>Audio</h2><p class="cr-next">Open Audacity.</p></div>';
    if (au.captured) {
      const exports = Object.values(s.files).filter(f => f.kind === 'audio').sort((x, y) => x.name.localeCompare(y.name));
      const master = exports.find(f => ['FLAC', 'WAV'].includes(f.settings.format));
      return `<div class="cr-pad"><h2>Audio</h2><p class="cr-next">${!exports.length ? 'Tape captured once. In Audacity, use File > Export Audio to save a master.' : master?.settings.checked ? 'Now attach the master in Chat and send it to Amina.' : 'Check your export against the capture.'}</p>
      ${exports.map(f => `<div class="export-row" data-key="${esc(f.path)}"><div><strong>${esc(f.name)}</strong><small>${esc(f.settings.format)}, ${f.settings.rate} Hz, ${f.settings.bits}-bit, from a ${f.settings.captureRate} Hz, ${f.settings.captureBits}-bit capture.</small></div>${f.settings.checked ? '<span class="tag ok">✓ Checked</span>' : `<button class="btn sm" data-action="ac:check" data-path="${esc(f.path)}" aria-label="Check ${esc(f.name)}">Check</button>`}</div>`).join('')}
      <label class="lab-field"><span>Why these settings?</span><textarea data-input="ac:why" aria-label="Why these audio settings?">${esc(au.rationale)}</textarea></label></div>`;
    }
    if (au.step >= 3) return `<div class="cr-pad"><h2>Ready to capture</h2><p class="cr-next">${au.device === 'interface' ? 'Press Record in Audacity. The tape plays once.' : 'In Audacity, set the Recording Device to USB Audio Interface, then press Record. The tape plays once.'}</p></div>`;
    const bytes = audioBytes(au.rate, au.bits, au.step >= 2 ? au.format : 'WAV');
    const bClip = clipFor(au.rate, au.bits);
    const control = au.step === 0 ? setting(s, 'rate', 'Sampling rate', [[8000, '8 kHz'], [16000, '16 kHz'], [44100, '44.1 kHz'], [96000, '96 kHz']])
      : au.step === 1 ? setting(s, 'bits', 'Quantisation', [[8, '8-bit'], [16, '16-bit'], [24, '24-bit']])
      : setting(s, 'format', 'Encoding', [['MP3', 'Lossy MP3 (128 kbps)'], ['FLAC', 'Lossless FLAC'], ['WAV', 'Uncompressed WAV (PCM)']]);
    const lead = ['Sampling measures the signal at intervals. To capture a frequency, sample at least twice as fast.', 'Quantisation maps each sample to a discrete level. More levels keep quiet sounds cleaner.', 'Encoding stores the values. Lossy formats throw information away for good.'][au.step];
    return `<div class="cr-pad"><h2>ADC comparison</h2><ol class="stepper">${STEPS.map((t, i) => `<li class="${au.step > i ? 'done' : au.step === i ? 'on' : ''}">${au.step > i ? '✓ ' : ''}${t}</li>`).join('')}</ol>
    <p class="cr-lead">${lead}</p>${control}
    ${au.step < 2 ? `<div class="ab-row">${preview('reference', 'A · Reference', '44.1 kHz, 16-bit')}${preview(bClip === 'reference' ? 'reference-b' : bClip, 'B · Your setting', `${au.rate / 1000} kHz, ${au.bits}-bit`)}</div>
    <canvas class="signal" width="320" height="86" data-rate="${au.rate}" data-bits="${au.bits}" role="img" aria-label="Sample points and quantisation steps for ${au.rate} hertz at ${au.bits} bits"></canvas>${au.step === 0 ? coverage(au.rate) : ''}` : ''}${findings(s)}
    <dl class="f-dl"><dt>Estimated size</dt><dd>${formatBytes(bytes)} for 10 min mono${bytes > ITEM_LIMIT ? ', over the 100 MB budget' : ''}</dd></dl>
    ${au.feedback ? `<div class="feedback warn" role="status"><strong>Amina</strong><p>${esc(au.feedback.text)}</p></div>` : ''}
    <button class="btn primary" data-action="ac:confirm">Confirm</button><p class="d-small">Previews never play the tape.</p></div>`;
  },
  after(el) { const cv = el.querySelector('canvas.signal'); if (cv) drawSignal(cv, Number(cv.dataset.rate), Number(cv.dataset.bits)); },
  actions: {
    'ac:play': async el => {
      const id = el.dataset.id, st = c();
      if (st.playing === id) { stopClip(); st.playing = null; app.render(); return; }
      st.playing = id;
      app.dispatch({type: 'AUDIO_PREVIEW', id, detail: id});
      await playClip(id === 'reference-b' ? 'reference' : id, () => { st.playing = null; app.pump(); app.render(); });
    },
    'ac:confirm': () => app.attempt({type: 'AUDIO_STEP'}),
    'ac:check': el => app.attempt({type: 'AUDIO_CHECK', path: el.dataset.path}),
  },
  inputs: {
    'ac:set': el => { const k = el.dataset.key; app.attempt({type: 'AUDIO_SET', patch: {[k]: k === 'format' ? el.value : Number(el.value)}}); },
    'ac:why': el => app.dispatch({type: 'RATIONALE', kind: 'audio', text: el.value}),
  },
});

