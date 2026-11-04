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
export const clipFor = (rate, bits) => (bits === 8 ? 'q8' : rate === 8000 ? 's8' : rate === 16000 ? 's16' : 'reference');
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
  src.buffer = buffers[id];
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
