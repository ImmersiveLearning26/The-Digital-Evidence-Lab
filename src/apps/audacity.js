// Audio Recorder: one mono track, one real capture presentation. ADC settings, 32-bit float processing and export
// format are kept visibly separate, because confusing them is the misconception this task addresses.
import {app} from '../runtime.js';
import {emptyState, esc, reducedMotion} from '../desktop/dom.js';
import {icons} from '../desktop/icons.js';
import {openWindow, registerApp} from '../desktop/wm.js';
import {menubar} from '../desktop/menu.js';
import {modal} from '../desktop/modal.js';
import {DIR, ENCODINGS, audioBytes, formatBytes, nyquist, quantisationLevels} from '../core/domain.js';
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

const WHY = ['Lossless, so nothing heard is thrown away', 'Small enough to send within the budget', 'Matches the reference quality'];
async function exportAudio() {
  const au = app.s.audio;
  if (!au.captured) return app.status('audacity', 'There is no audio to export. Capture the tape first.');
  const choice = await modal({
    title: 'Export Audio', width: 520, owner: 'audacity', state: {format: 'FLAC', why: au.rationale ?? ''},
    view: st => {
      const bytes = audioBytes(au.captureRate, au.captureBits, st.format);
      return `<h3 class="ex-h">Format</h3><div class="seg ex-seg" role="radiogroup" aria-label="Format">${[['FLAC', 'FLAC · lossless, compressed'], ['WAV', 'WAV · uncompressed'], ['MP3', 'MP3 · lossy']].map(([k, t]) => `<button role="radio" aria-checked="${st.format === k}" class="${st.format === k ? 'on' : ''}" data-m="fmt" data-f="${k}">${t}</button>`).join('')}</div>
      <p class="ex-read">${esc(ENCODINGS[st.format]?.note ?? '')} About ${formatBytes(bytes)} for ten minutes, mono, at the ${au.captureRate / 1000} kHz, ${au.captureBits}-bit capture.</p>
      <h3 class="ex-h">Why these settings?</h3><div class="ex-why">${WHY.map(w => `<button class="${st.why === w ? 'on' : ''}" data-m="why" data-why="${esc(w)}">${esc(w)}</button>`).join('')}</div>
      <footer class="modal-foot"><span class="ex-to">Saves to Working › statement_master</span><button class="btn" data-m="cancel">Cancel</button><button class="btn primary" data-m="ok" data-default>Export</button></footer>`;
    },
    actions: {
      fmt: (el, ev, api) => { api.state.format = el.dataset.f; api.update(); },
      why: (el, ev, api) => { api.state.why = el.dataset.why; api.update(); },
      ok: (el, ev, api) => api.close({...api.state}),
    },
  });
  if (!choice) return;
  if (choice.why) app.dispatch({type: 'RATIONALE', kind: 'audio', text: choice.why});
  const ext = {FLAC: 'flac', WAV: 'wav', MP3: 'mp3'}[choice.format], path = `${DIR.working}\\statement_master.${ext}`;
  if (!app.attempt({type: 'SAVE_AUDIO', path, format: choice.format, rate: au.captureRate, bits: au.captureBits})) return;
  // The export is read back against the capture at once.
  app.attempt({type: 'AUDIO_CHECK', path});
  app.status('audacity', `Exported statement_master.${ext} and checked it against the capture. Send it to Amina in the chat.`);
}
// Sample rate and bit depth, each with a listen button, and what the choice keeps. The tape is never played here.
function setup(au) {
  const opt = (key, value, label) => `<span class="au-opt"><button class="${au[key] === value ? 'on' : ''}" data-action="au:set" data-key="${key}" data-v="${value}" aria-pressed="${au[key] === value}">${label}</button><button class="au-listen" data-action="au:listen" data-key="${key}" data-v="${value}" aria-label="Listen to ${label}">▶</button></span>`;
  const rate = au.rate ?? 44100, bits = au.bits ?? 16;
  return `<div class="au-setup"><div><h3 class="ex-h">Sample rate</h3><div class="au-opts">${[[8000, '8 kHz'], [16000, '16 kHz'], [44100, '44.1 kHz'], [96000, '96 kHz']].map(([v, t]) => opt('rate', v, t)).join('')}</div></div>
    <div><h3 class="ex-h">Bit depth</h3><div class="au-opts">${[[8, '8-bit'], [16, '16-bit'], [24, '24-bit']].map(([v, t]) => opt('bits', v, t)).join('')}</div></div>
    <p class="ex-read">Captures up to ${nyquist(rate) / 1000} kHz (the buzzer reaches about 10 kHz) · ${quantisationLevels(bits).toLocaleString('en')} levels · about ${formatBytes(audioBytes(rate, bits, 'WAV'))} for ten minutes. Listening never plays the tape.</p></div>`;
}
const menus = () => [
  {name: 'File', items: [{label: 'Save Project', action: 'au:save-project', key: 'Ctrl+S'}, {label: 'Export Audio...', action: 'au:export', key: 'Shift+Ctrl+E'}, '-', {label: 'Exit', action: 'win:close'}]},
  {name: 'Edit', items: [{label: 'Undo'}, {label: 'Preferences'}]}, {name: 'Select', items: [{label: 'All'}]}, {name: 'View', items: [{label: 'Zoom In'}]},
  {name: 'Transport', items: [{label: 'Play', action: 'au:play'}, {label: 'Stop', action: 'au:stop'}, {label: 'Record', action: 'au:record'}]},
  ...['Tracks', 'Generate', 'Effect', 'Analyze', 'Tools', 'Help'].map(name => ({name, items: [{label: `${name} commands`}]})),
];
registerApp({
  id: 'audacity', title: 'Audio Recorder', icon: icons.audacity, rect: {x: .012, y: .012, w: .695, h: .97},
  windowTitle: () => (app.s.audio.captured ? 'statement_capture - Audio Recorder' : 'Audio Recorder'),
  view() {
    const s = app.s, st = a(), au = s.audio;
    const iface = s.hardware.interface;
    const time = au.captured ? SOURCE_SECONDS : st.progress * SOURCE_SECONDS;
    return `<div class="audacity">${menubar('audacity', menus())}
    <div class="au-transport" role="toolbar" aria-label="Transport"><button data-action="au:play" aria-label="Play">▶</button><button data-action="au:stop" aria-label="Stop">■</button><button class="rec ${st.recording ? 'on' : ''}" data-action="au:record" aria-label="Record">●</button><div class="au-meter" aria-hidden="true"><i style="width:${st.recording ? 62 : 0}%"></i></div></div>
    ${iface ? `<div class="au-device"><label>Recording Device <select data-input="au:device" aria-label="Recording device"><option value="" ${au.device ? '' : 'selected'}>Choose input</option><option value="mic" ${au.device === 'mic' ? 'selected' : ''}>Microphone Array (built-in)</option><option value="interface" ${au.device === 'interface' ? 'selected' : ''}>USB Audio Interface</option></select></label><label>Channels <select disabled><option>1 (Mono) Recording Channel</option></select></label><label>Project Rate <select disabled><option>${au.rate} Hz</option></select></label></div>` : ''}
    ${iface && !au.captured && !st.recording ? setup(au) : ''}
    <div class="au-ruler" aria-hidden="true">${Array.from({length: 11}, (_, i) => `<span>${i}:00</span>`).join('')}</div>
    <div class="au-tracks">${!au.captured && !st.recording ? `<div class="app-start dark">${iface ? emptyState('Nothing recorded yet', 'Choose the sample rate and bit depth above, select the audio interface, then press Record.') : emptyState('No recording input detected', 'Audio Recorder cannot hear the tape. Connect the audio interface at your bench.')}</div>` : ''}<div class="au-track-head"><strong>Audio Track</strong><small>Mono, ${au.captured ? au.captureRate : au.rate} Hz</small><small>32-bit float</small><small class="sep">Internal processing format, not the capture depth.</small></div><canvas data-keep id="aud-wave" role="img" aria-label="${au.captured ? 'Captured waveform, ten minutes represented' : 'Empty track'}"></canvas></div>
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
    'au:set': el => { app.attempt({type: 'AUDIO_SET', patch: {[el.dataset.key]: Number(el.dataset.v)}}); },
    'au:listen': async el => {
      const au = app.s.audio, rate = el.dataset.key === 'rate' ? Number(el.dataset.v) : au.rate ?? 44100, bits = el.dataset.key === 'bits' ? Number(el.dataset.v) : au.bits ?? 16;
      stopClip();
      app.dispatch({type: 'AUDIO_PREVIEW', id: `${rate}-${bits}`});
      await playClip(clipFor(rate, bits), () => app.pump());
    },
    'au:save-project': () => app.status('audacity', 'Project saved. A project is not an audio export: use File > Export Audio for the master.'),
  },
  inputs: {'au:device': el => { app.dispatch({type: 'AUDIO_DEVICE', device: el.value}); if (el.value === 'mic') app.status('audacity', 'The built-in microphone cannot hear the tape. Select the USB Audio Interface.'); }},
});
function ensureOpenSoft() { if (!lockReason(app.s, 'audio') && !app.s.audio.opened) app.dispatch({type: 'OPEN', kind: 'audio'}); }
registerOpener('audio', () => { openWindow('audacity'); app.status('audacity', 'The master is already in this project. Previews stay in the Case Record.'); });

// ---- Case record: what was captured and exported.
registerCaseTab({
  id: 'audio',
  view() {
    const s = app.s, au = s.audio, exports = Object.values(s.files).filter(f => f.kind === 'audio');
    const status = !au.opened ? 'Open Audio Recorder.' : !au.captured ? 'Choose the settings in Audio Recorder, then record. The tape plays once.' : !exports.length ? 'Export a master: File > Export Audio.' : 'Send the master to Amina in the chat.';
    return `<div class="cr-pad"><h2>Audio</h2><p class="cr-next">${status}</p>${exports.map(f => `<div class="export-row" data-key="${esc(f.path)}"><div><strong>${esc(f.name)}</strong><small>${esc(f.settings.format)}, ${f.settings.rate} Hz, ${f.settings.bits}-bit</small></div>${f.settings.checked ? '<span class="tag ok">✓ Checked</span>' : ''}</div>`).join('')}</div>`;
  },
});
