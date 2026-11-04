// Pure facts and validators. No DOM, so it can be tested in Node and cannot be fooled by a UI label.
import {decode, encode, fromBase64, preservedCount, utf8Encode} from './bytes.js';

export const CASE_ID = 'KIA/DEL/2026/0417';
export const TEXT = 'Habari Chébet 👋 Mzigo umefika ✔ Tuma KSh 50,000 → M-Pesa leo 📦 “Usimwambie yeyote” 🤝 — sawa?';
export const MB = 1e6;
export const ITEM_LIMIT = 100 * MB;
export const CASE_LIMIT = 200 * MB;
export const SOURCE_SIZE = {width: 4000, height: 3000};
export const PLATE_NATIVE_WIDTH = 250;
export const MIN_PLATE_WIDTH = 200;
export const RGB_TOLERANCE = 15;
export const TARGETS = {plate: [250, 210, 20], character: [15, 15, 15], sky: [135, 190, 235]};

export const DIR = {
  store: 'E:\\EvidenceStore\\0417',
  working: 'C:\\Cases\\0417\\Working',
  submitted: 'C:\\Cases\\0417\\Submitted',
  reports: 'C:\\Cases\\0417\\Reports',
};
export const WITNESS_PATH = DIR.working + '\\witness_working.txt';
export const CCTV_WORKING_PATH = DIR.working + '\\cctv_working.jpg';
export const IMAGE_MASTER_PATH = DIR.working + '\\cctv_working.png';
export const isEvidencePath = path => /^[A-Z]:/i.test(path) && path.toUpperCase().startsWith('E:\\');

export function textPreview(encoding) {
  if (encoding === 'screenshot') return TEXT;
  const name = {ASCII: 'US-ASCII', 'Latin-1': 'ISO 8859-1', 'UTF-8': 'UTF-8'}[encoding];
  return decode(encode(TEXT, name), name === 'UTF-8' ? 'UTF-8' : name === 'US-ASCII' ? 'US-ASCII' : 'ISO 8859-1');
}
export const textBytes = encoding => (encoding === 'screenshot' ? 48000 : encoding === 'UTF-8' ? utf8Encode(TEXT).length : [...TEXT].length);
export const textPreserved = encoding => (encoding === 'screenshot' ? null : preservedCount(TEXT, textPreview(encoding)));

export const imageBytes = (width, height) => width * height * 3;
export const plateWidth = width => Math.round(PLATE_NATIVE_WIDTH * (width / SOURCE_SIZE.width));
export const printInches = (pixels, ppi) => pixels / ppi;
export const printPixels = (inches, ppi) => Math.round(inches * ppi);

export const MP3_BYTES = 9600000;
export function audioBytes(rate, bits, format) {
  const pcm = rate * (bits / 8) * 600;
  return format === 'FLAC' ? Math.round(pcm * 0.55) : format === 'MP3' ? MP3_BYTES : pcm;
}
export const nyquist = rate => rate / 2;
export const quantisationLevels = bits => 2 ** bits;
export const dynamicRange = bits => Math.round(bits * 6.02);

// Teaching outcomes for each comparison. Fidelity text is tied to the measured reference clips.
export const SAMPLING = {
  8000: {verdict: 'Incorrect', speech: 'Muffled', buzzer: 'Missing', note: 'Captures up to 4 kHz. The buzzer is lost and speech is muffled.'},
  16000: {verdict: 'Partial', speech: 'Clear', buzzer: 'Partly lost', note: 'Captures up to 8 kHz. Speech is clear, but the buzzer is partly lost.'},
  44100: {verdict: 'Correct', speech: 'Clear', buzzer: 'Present', note: 'Captures up to 22.05 kHz, well above the 10 kHz buzzer harmonics.'},
  96000: {verdict: 'Partial', speech: 'Clear', buzzer: 'Present', note: 'Captures up to 48 kHz. No audible gain here, and a larger file.'},
};
export const QUANTISATION = {
  8: {verdict: 'Incorrect', speech: 'Hiss over quiet speech', note: '256 levels (about 48 dB). Audible hiss; the whisper is lost.'},
  16: {verdict: 'Correct', speech: 'Quiet speech clear', note: '65,536 levels (about 96 dB).'},
  24: {verdict: 'Partial', speech: 'Quiet speech clear', note: '16,777,216 levels (about 144 dB). No audible gain, and 50% larger.'},
};
export const ENCODINGS = {
  MP3: {verdict: 'Incorrect for evidence', note: 'About 128 kbps. Information is discarded permanently.'},
  FLAC: {verdict: 'Correct', note: 'Lossless. The captured samples are recoverable exactly. Size is an estimate.'},
  WAV: {verdict: 'Correct', note: 'Uncompressed PCM. Exact, but the largest.'},
};

export const compareRGB = (rgb, target = TARGETS.plate) => rgb.every((n, i) => Math.abs(n - target[i]) <= RGB_TOLERANCE);

export function classifyPick(x, y, width, meta) {
  const scale = meta.width / width;
  const sx = x * scale, sy = y * scale, p = meta.plate;
  if (sx >= p.x && sx < p.x + p.w && sy >= p.y && sy < p.y + p.h) return null; // Refined by colour in pickTarget.
  return meta.skyRect && sy < 900 ? 'sky' : null;
}
export function pickTarget(x, y, width, rgb, meta) {
  const scale = meta.width / width, sx = x * scale, sy = y * scale, p = meta.plate;
  if (sx >= p.x && sx < p.x + p.w && sy >= p.y && sy < p.y + p.h) {
    if (compareRGB(rgb, TARGETS.character)) return 'character';
    if (compareRGB(rgb, TARGETS.plate)) return 'plate';
    return null;
  }
  return compareRGB(rgb, TARGETS.sky) ? 'sky' : null;
}

// Each result carries a copy key so a failed review always speaks to the real problem.
const fail = (...keys) => ({pass: false, keys});

export function textBytesOf(file) {
  return file.settings?.b64 ? fromBase64(file.settings.b64) : new Uint8Array();
}

export function validateText(file) {
  if (!file || file.sourceId !== 'witness') return fail('staleFile');
  const p = file.settings;
  if (p.representation === 'screenshot') return fail('screenshot');
  const bytes = textBytesOf(file);
  const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
  if (same(bytes, encode(TEXT, 'US-ASCII'))) return fail('asciiLoss');
  if (same(bytes, encode(TEXT, 'ISO 8859-1'))) return fail('latin1Loss');
  if (!same(bytes, utf8Encode(TEXT))) return fail('textChanged');
  if (!p.reopened) return fail('textNotReopened');
  if (p.decoding !== 'UTF-8') return fail('wrongDecoding');
  return {pass: true, keys: []};
}

export function validateImage(file, image) {
  if (!file || file.sourceId !== 'cctv' || file.path === CCTV_WORKING_PATH) return fail('staleFile');
  const p = file.settings;
  if (!image?.rgbDone) return fail('rgbIncomplete');
  if (file.bytes > ITEM_LIMIT) return fail('imageOverBudget');
  if (p.width > SOURCE_SIZE.width || p.height > SOURCE_SIZE.height) return fail('imageUpscaled');
  if (p.width < SOURCE_SIZE.width || p.height < SOURCE_SIZE.height || (p.detailWidth ?? p.width) < SOURCE_SIZE.width) return fail('imageTooLow');
  if (p.ppi !== 300) return fail('ppiConfused');
  if (!image.rationale?.trim()) return fail('imageRationale');
  if (!p.compared) return fail('imageNotChecked');
  return {pass: true, keys: []};
}

export function validateAudio(file, audio) {
  if (!file || file.sourceId !== 'statement') return fail('staleFile');
  const p = file.settings;
  if (!audio?.captured) return fail('audioNoCapture');
  if (p.captureRate < 44100 && p.rate > p.captureRate) return fail('audioUpsampled');
  if (p.format === 'MP3') return fail('audioMp3');
  if (file.bytes > ITEM_LIMIT) return fail('audioOverBudget');
  if (p.rate === 8000) return fail('audio8k');
  if (p.rate === 16000) return fail('audio16k');
  if (p.bits === 8) return fail('audio8bit');
  if (p.rate !== 44100 || p.bits !== 16) return fail('audioExcess');
  if (!['FLAC', 'WAV'].includes(p.format)) return fail('audioMp3');
  if (!audio.rationale?.trim()) return fail('audioRationale');
  if (!p.checked) return fail('audioNotChecked');
  return {pass: true, keys: []};
}

export function validate(kind, file, state) {
  if (kind === 'text') return validateText(file);
  if (kind === 'image') return validateImage(file, state?.image);
  return validateAudio(file, state?.audio);
}

// Evidence-store objects are excluded; a chat attachment is a reference, so it adds nothing.
export const countedFiles = files => Object.values(files).filter(f => !f.excluded);
export const storage = files => countedFiles(files).reduce((sum, f) => sum + f.bytes, 0);
export const largestItem = files => countedFiles(files).sort((a, b) => b.bytes - a.bytes)[0];

export const grade = score => (score >= 90 ? 'Senior Evidence Engineer' : score >= 75 ? 'Competent Evidence Engineer' : score >= 60 ? 'Developing Evidence Engineer' : 'Review and retry');
export function weightedScore(strands) {
  if (!strands || ['handling', 'text', 'image', 'audio'].some(k => !Number.isFinite(strands[k]))) return null;
  return Math.max(0, Math.min(100, strands.handling * 0.15 + strands.text * 0.25 + strands.image * 0.3 + strands.audio * 0.3));
}

export function formatBytes(n) {
  if (n < 1000) return `${n} B`;
  if (n < MB) return `${(n / 1000).toFixed(1)} KB`;
  return `${(n / MB).toFixed(n >= 10 * MB ? 1 : 2)} MB`;
}
