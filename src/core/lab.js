// Reference clips for the capture comparison. These are prepared comparisons, never another pass of the tape.
import {app} from '../runtime.js';

const FILES = {reference: 'reference_44100_16', s8: 'sample_8000_16', s16: 'sample_16000_16', q8: 'quantised_44100_8'};
const buffers = {};
let current = null, gainNode = null, loading = null;

export function loadClips() {
  loading ??= (async () => {
    await app.audio.unlock();
    const ctx = app.audio.ctx;
    await Promise.all(Object.entries(FILES).map(async ([k, f]) => {
      const data = await fetch(`assets/media/audio/${f}.wav`).then(r => r.arrayBuffer());
      buffers[k] = await ctx.decodeAudioData(data);
    }));
    return buffers;
  })();
  return loading;
}
// Every setting the learner can hear. The rate picks the recording; 8-bit then rounds it to 256 levels, as the
// builder does for the 44.1 kHz file. Above 44.1 kHz and 16-bit nothing more can be heard: the tape stops near
// 10 kHz and its hiss sits far above 16-bit's smallest step, so 96 kHz and 24-bit play the reference.
const RATE_CLIP = {8000: 's8', 16000: 's16'};
export const clipFor = (rate, bits) => {
  const base = RATE_CLIP[rate] ?? 'reference';
  return bits === 8 ? (base === 'reference' ? 'q8' : `${base}-q8`) : base;
};
function quantised(id) {
  const src = buffers[id.replace('-q8', '')], ctx = app.audio.ctx;
  const out = ctx.createBuffer(1, src.length, src.sampleRate), x = src.getChannelData(0), y = out.getChannelData(0);
  // The same rounding as the 8-bit file, read back the way the browser decodes 8-bit audio (steps of 1/128).
  for (let i = 0; i < x.length; i++) y[i] = Math.round(Math.max(-1, Math.min(1, x[i])) * 127) / 128;
  return (buffers[id] = out);
}
export function stopClip() {
  if (current) { current.onended = null; try { current.stop(); } catch { /* already stopped */ } current = null; }
  app.busyAudio = false;
}
export function setClipLevel() { if (gainNode) gainNode.gain.value = app.ui.settings.muted ? 0 : app.ui.settings.volume.evidence; }
export async function playClip(id, onEnd) {
  await loadClips();
  stopClip();
  const ctx = app.audio.ctx;
  const src = ctx.createBufferSource();
  src.buffer = buffers[id] ?? quantised(id);
  gainNode = ctx.createGain();
  setClipLevel();
  src.connect(gainNode).connect(app.audio.master);
  src.onended = () => { current = null; app.busyAudio = false; onEnd?.(); };
  current = src;
  app.busyAudio = true;
  src.start();
}
// Peak envelope drawn from the real samples.
export function peaks(id, bins) {
  const data = buffers[id]?.getChannelData(0);
  if (!data) return null;
  const out = new Float32Array(bins), step = data.length / bins;
  for (let i = 0; i < bins; i++) {
    let m = 0;
    const end = Math.floor((i + 1) * step);
    for (let j = Math.floor(i * step); j < end; j += 4) m = Math.max(m, Math.abs(data[j]));
    out[i] = m;
  }
  return out;
}
