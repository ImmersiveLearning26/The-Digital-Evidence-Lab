import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {
  TEXT, CCTV_WORKING_PATH, DIR, IMAGE_MASTER_PATH, WITNESS_PATH, audioBytes, compareRGB, grade, imageBytes, plateWidth, storage,
  textBytes, textPreserved, textPreview, validateAudio, weightedScore,
} from '../src/core/domain.js';
import {decode, encode, firstDifference, md5, pngPpi, pngWithPpi, preservedCount, toBase64, utf8Encode} from '../src/core/bytes.js';
import {appAvailable, event, handoverChecks, initial, migrate, nextTask, strandChecks} from '../src/core/state.js';
import {COPY} from '../src/content/copy.js';

const step = (s, type, extra = {}) => event(s, {type, ...extra});
const flush = s => { while (s.outbox.length) s = step(s, 'DELIVER'); return s; };
const lastAmina = s => s.messages.filter(m => m.from === 'amina').at(-1)?.text;
const hash = {witnessSha: 'w', cctvSha: 'c'};
const originals = {witness: true, cctv: true};
const marks = {text: 'readable', image: 'sufficient', audio: 'suitable', originals: 'unchanged', allocation: 'within'};
const b64 = (text, enc = 'UTF-8') => toBase64(encode(text, enc));

function prepared() {
  let s = initial();
  const run = [['POWER'], ['LOGIN', {name: 'Wanjiru'}], ['FOLDER_OPENED'], ['BRIEF'], ...['text', 'image', 'audio'].map(kind => ['INSPECT', {kind}]),
    ['RANK', {risk: ['audio', 'text', 'image']}], ['INTAKE', {objective: 'preserve'}], ['HARDWARE', {part: 'blocker'}], ['HARDWARE', {part: 'drive'}],
    ['ACQUIRE', {source: 'evidence', destination: 'store', verify: true, match: true, md5: 'm', sha1: 's', ...hash}], ['ADD_EVIDENCE'], ['COPIES', hash]];
  for (const [type, extra] of run) s = step(s, type, extra);
  return flush(s);
}
function savedText(s, enc = 'UTF-8') {
  return step(s, 'SAVE_TEXT', {path: WITNESS_PATH, b64: b64(TEXT, enc), encoding: enc});
}
function textApproved() {
  let s = prepared();
  s = step(s, 'OPEN', {kind: 'text'});
  s = savedText(s);
  s = step(s, 'TEXT_CHECK', {path: WITNESS_PATH, version: s.files[WITNESS_PATH].version, decoding: 'UTF-8', reopened: true});
  s = step(s, 'SUBMIT', {path: WITNESS_PATH});
  return flush(step(s, 'REVIEW'));
}
function imageReady(s, settings = {}) {
  s = step(s, 'OPEN', {kind: 'image'});
  for (const target of ['plate', 'character', 'sky']) s = step(s, 'PICK', {target, rgb: {plate: [249, 210, 19], character: [17, 15, 16], sky: [135, 189, 235]}[target], x: 1, y: 1});
  s = step(s, 'RGB_MATCH', {rgb: [245, 205, 25]});
  s = step(s, 'RATIONALE', {kind: 'image', text: 'Keep original pixels.'});
  s = step(s, 'SAVE_IMAGE', {path: IMAGE_MASTER_PATH, width: 4000, height: 3000, ppi: 300, ...settings});
  return step(s, 'IMAGE_CHECK', {path: IMAGE_MASTER_PATH, reopened: true, plateMatch: true});
}
function imageApproved() {
  let s = imageReady(textApproved());
  s = step(s, 'SUBMIT', {path: IMAGE_MASTER_PATH});
  return flush(step(s, 'REVIEW'));
}
function captured() {
  let s = imageApproved();
  for (const part of ['tape', 'interface', 'headphones']) s = step(s, 'HARDWARE', {part});
  s = step(s, 'OPEN', {kind: 'audio'});
  s = step(s, 'AUDIO_DEVICE', {device: 'interface'});
  s = step(s, 'AUDIO_SET', {patch: {rate: 44100}});
  s = step(s, 'AUDIO_STEP');
  s = step(s, 'AUDIO_SET', {patch: {bits: 16}});
  s = step(s, 'AUDIO_STEP');
  s = step(s, 'AUDIO_PREVIEW', {id: 'a'});
  s = step(s, 'AUDIO_PREVIEW', {id: 'b'});
  s = step(s, 'RATIONALE', {kind: 'audio', text: 'Keeps speech and buzzer.'});
  return step(s, 'CAPTURE');
}
const FLAC = `${DIR.working}\\statement_master.flac`;
function audioSaved(s, opts = {}) {
  s = step(s, 'SAVE_AUDIO', {path: FLAC, format: 'FLAC', rate: 44100, bits: 16, ...opts});
  return step(s, 'AUDIO_CHECK', {path: opts.path ?? FLAC});
}
function audioApproved() {
  let s = audioSaved(captured());
  s = step(s, 'SUBMIT', {path: FLAC});
  return flush(step(s, 'REVIEW'));
}
const complete = () => flush(step(audioApproved(), 'HANDOVER', {marks, originals}));

// Fidelity of the storyboard's numbers, from real bytes.
test('canonical text has 92 code points and 112 UTF-8 bytes', () => { assert.equal([...TEXT].length, 92); assert.equal(utf8Encode(TEXT).length, 112); assert.equal(textBytes('UTF-8'), 112); });
test('ASCII keeps 83 of 92 and is 92 bytes', () => { assert.equal(textPreserved('ASCII'), 83); assert.equal(encode(TEXT, 'US-ASCII').length, 92); assert.equal(textPreview('ASCII').split('?').length - 1, 10); });
test('Latin-1 keeps 84 of 92 and retains the accent', () => { assert.equal(textPreserved('Latin-1'), 84); assert.ok(textPreview('Latin-1').includes('Chébet')); });
test('wrong decoding of UTF-8 bytes shows the storyboard mojibake', () => assert.ok(decode(utf8Encode(TEXT), 'ANSI').includes('ChÃ©bet')));
test('ANSI decode and encode round-trip all bytes', () => { const all = Uint8Array.from({length: 256}, (_, i) => i); assert.deepEqual(encode(decode(all, 'ANSI'), 'ANSI'), all); });
test('first difference reports the character', () => assert.equal(firstDifference(TEXT, textPreview('ASCII')).expected, 'é'));
test('preservedCount compares code points, not UTF-16 units', () => assert.equal(preservedCount('a👋b', 'a?b'), 2));
test('md5 matches a reference implementation', () => { const b = utf8Encode(TEXT); assert.equal(md5(b), createHash('md5').update(b).digest('hex')); const long = new Uint8Array(1000).fill(7); assert.equal(md5(long), createHash('md5').update(long).digest('hex')); });
test('pHYs chunk stores PPI without touching pixels', () => {
  const ihdr = [0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0, 1, 2, 3, 4];
  const png = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, ...ihdr, 0, 0, 0, 0, 73, 68, 65, 84, 0, 0, 0, 0]);
  assert.equal(pngPpi(pngWithPpi(png, 300)), 300);
  assert.equal(pngPpi(png), null);
});
test('image storage is the uncompressed RGB estimate', () => { assert.equal(imageBytes(4000, 3000), 36000000); assert.equal(imageBytes(8000, 6000), 144000000); assert.equal(imageBytes(640, 480), 921600); });
test('plate widths follow the storyboard table', () => assert.deepEqual([640, 1280, 4000, 8000].map(plateWidth), [40, 80, 250, 500]));
test('PCM and FLAC estimates match duration and mono channel', () => { assert.equal(audioBytes(44100, 16, 'WAV'), 52920000); assert.equal(audioBytes(44100, 16, 'FLAC'), 29106000); assert.equal(audioBytes(96000, 24, 'WAV'), 172800000); });
test('RGB tolerance includes its boundary', () => { assert.ok(compareRGB([235, 225, 35])); assert.ok(!compareRGB([234, 210, 20])); });
test('numeric score stays pending without approved rubric data', () => assert.equal(weightedScore(null), null));
test('weights reproduce the storyboard worked example', () => { assert.equal(weightedScore({handling: 100, text: 90, image: 80, audio: 85}), 87); assert.equal(grade(87), 'Competent Evidence Engineer'); });

// Preservation gates.
test('cannot connect the drive before the blocker, and Amina says why', () => assert.throws(() => step(initial(), 'HARDWARE', {part: 'drive'}), {message: COPY.noBlocker}));
test('cannot acquire without intake', () => assert.throws(() => step(initial(), 'ACQUIRE', {source: 'evidence', destination: 'store', verify: true})));
test('source destination is refused before any write', () => {
  let s = prepared();
  s.acquisition = null;
  assert.throws(() => step(s, 'ACQUIRE', {source: 'evidence', destination: 'source', verify: true}), {message: COPY.sourceAsDestination});
});
test('the system drive is not a valid source', () => { const s = prepared(); assert.throws(() => step(s, 'ACQUIRE', {source: 'system', destination: 'store', verify: true}), {message: COPY.wrongSourceDrive}); });
test('verification is compulsory', () => assert.throws(() => step(prepared(), 'ACQUIRE', {source: 'evidence', destination: 'store', verify: false}), {message: COPY.notVerified}));
test('a failed verification cannot release working files', () => {
  let s = prepared();
  s.copies = false; s.acquisition.verified = false;
  assert.throws(() => step(s, 'COPIES', hash), {message: COPY.notVerified});
});
test('exports that differ from the image are refused', () => {
  let s = prepared();
  s.copies = false;
  assert.throws(() => step(s, 'COPIES', {witnessSha: 'tampered', cctvSha: 'c'}));
});
test('intake needs the correct objective and gives a reason', () => {
  let s = prepared();
  s.intake = false;
  assert.throws(() => step(s, 'INTAKE', {objective: 'enhance'}), /never add to it/);
});
test('intake does not wait for every record to be opened', () => {
  let s = initial(); s = step(s, 'POWER'); s = step(s, 'LOGIN', {name: 'A'}); s = step(s, 'FOLDER_OPENED'); s = step(s, 'BRIEF');
  s = step(s, 'RANK', {risk: ['audio', 'text', 'image']});
  assert.equal(step(s, 'INTAKE', {objective: 'preserve'}).intake, true);
});
test('every risk ranking gets a specific reply and never blocks', () => {
  const cases = [[['audio', 'text', 'image'], 'riskBest'], [['text', 'audio', 'image'], 'riskTextFirst'], [['audio', 'image', 'text'], 'riskImageMiddle'], [['text', 'image', 'audio'], 'riskAudioLast'], [['image', 'text', 'audio'], 'riskAudioLast'], [['image', 'audio', 'text'], 'riskImageFirst']];
  for (const [risk, key] of cases) assert.equal(step(initial(), 'RANK', {risk}).riskFeedback.key, key);
});
test('the evidence store cannot be written', () => {
  const s = step(prepared(), 'OPEN', {kind: 'text'});
  assert.throws(() => step(s, 'SAVE_TEXT', {path: `${DIR.store}\\x.txt`, b64: b64(TEXT), encoding: 'UTF-8'}), /read-only/);
});
test('the working JPEG cannot be overwritten or deleted, and the attempt is logged', () => {
  let s = step(textApproved(), 'OPEN', {kind: 'image'});
  assert.throws(() => step(s, 'SAVE_IMAGE', {path: CCTV_WORKING_PATH, width: 4000, height: 3000, ppi: 300}), /read-only/);
  assert.throws(() => step(s, 'DELETE_FILE', {path: CCTV_WORKING_PATH}), /Access denied/);
});
test('assignments stay locked until the previous approval', () => {
  assert.throws(() => step(prepared(), 'OPEN', {kind: 'image'}), /after Amina approves the text/);
  assert.throws(() => step(prepared(), 'HARDWARE', {part: 'tape'}), /booked/);
});

// Submission and review.
test('sending does not approve; review validates saved bytes', () => {
  let s = step(prepared(), 'OPEN', {kind: 'text'});
  s = savedText(s, 'US-ASCII');
  s = step(s, 'SUBMIT', {path: WITNESS_PATH});
  assert.equal(s.approved.text, null);
  s = flush(step(s, 'REVIEW'));
  assert.equal(s.approved.text, null);
  assert.equal(lastAmina(s), COPY.asciiLoss);
});
for (const [enc, key] of [['US-ASCII', 'asciiLoss'], ['ISO 8859-1', 'latin1Loss']]) {
  test(`${key} comes from the bytes`, () => {
    let s = savedText(step(prepared(), 'OPEN', {kind: 'text'}), enc);
    s = flush(step(step(s, 'SUBMIT', {path: WITNESS_PATH}), 'REVIEW'));
    assert.equal(lastAmina(s), COPY[key]);
  });
}
test('screenshot of text is refused', () => {
  const path = `${DIR.working}\\witness_screenshot.png`;
  let s = step(prepared(), 'SAVE_SCREENSHOT', {path, actualBytes: 40000});
  assert.equal(s.files[path].bytes, 48000);
  s = flush(step(step(s, 'SUBMIT', {path}), 'REVIEW'));
  assert.equal(lastAmina(s), COPY.screenshot);
});
test('right bytes with the wrong decoding are refused', () => {
  let s = savedText(step(prepared(), 'OPEN', {kind: 'text'}));
  s = step(s, 'TEXT_CHECK', {path: WITNESS_PATH, version: s.files[WITNESS_PATH].version, decoding: 'ANSI', reopened: true});
  s = flush(step(step(s, 'SUBMIT', {path: WITNESS_PATH}), 'REVIEW'));
  assert.equal(lastAmina(s), COPY.wrongDecoding);
});
test('saving without reopening is refused', () => {
  let s = savedText(step(prepared(), 'OPEN', {kind: 'text'}));
  s = flush(step(step(s, 'SUBMIT', {path: WITNESS_PATH}), 'REVIEW'));
  assert.equal(lastAmina(s), COPY.textNotReopened);
});
test('an edited character is refused', () => {
  let s = step(prepared(), 'OPEN', {kind: 'text'});
  s = step(s, 'SAVE_TEXT', {path: WITNESS_PATH, b64: b64(TEXT.replace('50,000', '60,000')), encoding: 'UTF-8'});
  s = step(s, 'TEXT_CHECK', {path: WITNESS_PATH, version: s.files[WITNESS_PATH].version, decoding: 'UTF-8', reopened: true});
  s = flush(step(step(s, 'SUBMIT', {path: WITNESS_PATH}), 'REVIEW'));
  assert.equal(lastAmina(s), COPY.textChanged);
});
test('valid text unlocks the image and does not open anything', () => { const s = textApproved(); assert.ok(s.approved.text); assert.equal(lastAmina(s), COPY.imageRelease); assert.equal(s.image.opened, false); });
test('the attached snapshot is independent of later saves', () => {
  let s = textApproved();
  s = step(s, 'SUBMIT', {path: WITNESS_PATH});
  const snapshot = s.review.settings.b64;
  s = savedText(s, 'US-ASCII');
  assert.equal(s.review.settings.b64, snapshot);
});
test('a file saved during review cancels that review', () => {
  let s = textApproved();
  s = step(s, 'SUBMIT', {path: WITNESS_PATH});
  s = savedText(s, 'UTF-8');
  s = flush(step(s, 'REVIEW'));
  assert.equal(lastAmina(s), COPY.staleFile);
  assert.equal(s.approved.text, null);
});
test('a file for a locked assignment is not reviewed as approved', () => {
  let s = step(prepared(), 'SUBMIT', {path: CCTV_WORKING_PATH});
  s = flush(step(s, 'REVIEW'));
  assert.equal(lastAmina(s), COPY.staleFile);
});
for (const [name, settings, key] of [
  ['downscale', {width: 640, height: 480}, 'imageTooLow'], ['marginal', {width: 1280, height: 960}, 'imageTooLow'],
  ['upscale within budget', {width: 5000, height: 3750}, 'imageUpscaled'], ['over budget', {width: 8000, height: 6000}, 'imageOverBudget'],
  ['PPI left at 72', {ppi: 72}, 'ppiConfused'], ['scaled down then back up', {detailWidth: 640}, 'imageTooLow'],
]) {
  test(`image review: ${name}`, () => {
    let s = imageReady(textApproved(), settings);
    s = flush(step(step(s, 'SUBMIT', {path: IMAGE_MASTER_PATH}), 'REVIEW'));
    assert.equal(lastAmina(s), COPY[key]);
    assert.equal(s.approved.image, null);
  });
}
test('PPI changes alone leave the RGB estimate unchanged', () => {
  const a = imageReady(textApproved(), {ppi: 72}), b = imageReady(textApproved(), {ppi: 1200});
  assert.equal(a.files[IMAGE_MASTER_PATH].bytes, b.files[IMAGE_MASTER_PATH].bytes);
});
test('RGB match needs all three real picks within tolerance', () => {
  let s = step(textApproved(), 'OPEN', {kind: 'image'});
  assert.throws(() => step(s, 'RGB_MATCH', {rgb: [250, 210, 20]}), {message: COPY.rgbIncomplete});
  for (const target of ['plate', 'character', 'sky']) s = step(s, 'PICK', {target, rgb: [249, 210, 19], x: 1, y: 1});
  assert.throws(() => step(s, 'RGB_MATCH', {rgb: [100, 100, 100]}), /±15/);
});
test('image approval releases the bench, not Audio Recorder', () => { const s = imageApproved(); assert.equal(s.audio.opened, false); assert.ok(s.messages.slice(-2).some(m => m.card?.type === 'bench')); });

test('sampling, quantisation and encoding unlock one at a time with reasons', () => {
  let s = imageApproved();
  s = step(s, 'OPEN', {kind: 'audio'});
  s = step(s, 'AUDIO_SET', {patch: {rate: 8000}});
  s = step(s, 'AUDIO_STEP');
  assert.equal(s.audio.step, 0);
  assert.equal(s.audio.feedback.text, COPY.audio8k);
  s = step(s, 'AUDIO_SET', {patch: {rate: 96000}});
  assert.equal(step(s, 'AUDIO_STEP').audio.feedback.text, COPY.audioExcess);
  s = step(step(s, 'AUDIO_SET', {patch: {rate: 44100}}), 'AUDIO_STEP');
  assert.equal(s.audio.step, 1);
  assert.equal(step(step(s, 'AUDIO_SET', {patch: {bits: 8}}), 'AUDIO_STEP').audio.feedback.text, COPY.audio8bit);
});
test('capture needs the bench, the interface and confirmed settings', () => {
  let s = imageApproved();
  s = step(s, 'OPEN', {kind: 'audio'});
  assert.throws(() => step(s, 'CAPTURE'), /Prepare the tape/);
  for (const part of ['tape', 'interface', 'headphones']) s = step(s, 'HARDWARE', {part});
  assert.throws(() => step(s, 'CAPTURE'), /USB Audio Interface/);
  s = step(s, 'AUDIO_DEVICE', {device: 'interface'});
  // A setting that would lose detail is refused with its reason, before the single pass of the tape.
  s = step(s, 'AUDIO_SET', {patch: {rate: 8000, bits: 16}});
  assert.throws(() => step(s, 'CAPTURE'), {message: COPY.audio8k});
  s = step(s, 'AUDIO_SET', {patch: {rate: 44100, bits: 8}});
  assert.throws(() => step(s, 'CAPTURE'), {message: COPY.audio8bit});
  s = step(s, 'AUDIO_SET', {patch: {rate: 44100, bits: 16}});
  assert.equal(step(s, 'CAPTURE').audio.captured, true);
});
test('the tape can be played once', () => { const s = captured(); assert.equal(s.tapePasses, 1); assert.throws(() => step(s, 'CAPTURE'), /already captured/); });
test('previews do not wear the tape', () => assert.equal(step(step(imageApproved(), 'OPEN', {kind: 'audio'}), 'AUDIO_PREVIEW', {id: 'x'}).tapePasses, 0));
for (const [name, opts, key] of [
  ['MP3 master', {format: 'MP3'}, 'audioMp3'], ['8 kHz export', {rate: 8000}, 'audio8k'], ['16 kHz export', {rate: 16000}, 'audio16k'],
  ['96 kHz export', {rate: 96000}, 'audioExcess'], ['over budget', {rate: 96000, bits: 24, format: 'WAV'}, 'audioOverBudget'],
]) {
  test(`audio review: ${name}`, () => {
    let s = audioSaved(captured(), opts);
    s = flush(step(step(s, 'SUBMIT', {path: FLAC}), 'REVIEW'));
    assert.equal(lastAmina(s), COPY[key]);
    assert.equal(s.approved.audio, null);
  });
}
test('a higher export cannot repair a low-rate capture', () => {
  const r = validateAudio({sourceId: 'statement', bytes: 52920000, settings: {rate: 44100, bits: 16, format: 'WAV', captureRate: 8000, captureBits: 8, checked: true}}, {captured: true, rationale: 'x'});
  assert.deepEqual(r.keys, ['audioUpsampled']);
});
test('WAV is accepted as a lossless master', () => {
  const path = `${DIR.working}\\statement_master.wav`;
  let s = audioSaved(captured(), {format: 'WAV', path});
  s = flush(step(step(s, 'SUBMIT', {path}), 'REVIEW'));
  assert.ok(s.approved.audio);
});

// Handover.
test('end-to-end path reaches handover at the storyboard allocation', () => {
  const s = complete();
  assert.equal(s.handover, true);
  assert.equal(s.finished, false);
  assert.equal(storage(s.files) - s.files[`${DIR.reports}\\processing_log.json`].bytes, 65106112);
  assert.equal(s.messages.at(-1).card.call, 'closing');
});
test('the marks must agree with the system check, and Amina explains', () => {
  const s = step(audioApproved(), 'HANDOVER', {marks: {...marks, audio: 'needs-revision'}, originals});
  assert.equal(s.handover, false);
  assert.match(s.handoverFeedback[0].text, /audio check does not match/);
  assert.match(s.handoverFeedback[0].text, /system check passed/);
});
test('originals cannot be confirmed by a tick alone', () => {
  const s = step(audioApproved(), 'HANDOVER', {marks, originals: {witness: false, cctv: true}});
  assert.equal(s.handover, false);
  assert.equal(s.handoverFeedback[0].key, 'originals');
  assert.match(s.handoverFeedback[0].text, /differs from its baseline/);
});
test('an extra retained copy counts, and attachments do not', () => {
  let s = audioApproved();
  const before = storage(s.files);
  s = step(s, 'SUBMIT', {path: FLAC});
  assert.equal(storage(s.files), before);
  s = flush(step(s, 'REVIEW'));
  const mp3 = `${DIR.working}\\statement_listening.mp3`;
  s = step(s, 'SAVE_AUDIO', {path: mp3, format: 'MP3', rate: 44100, bits: 16});
  assert.equal(storage(s.files), before + 9600000);
  s = step(s, 'DELETE_FILE', {path: mp3});
  assert.equal(storage(s.files), before);
});
test('over-allocation fails handover and names the largest item', () => {
  let s = audioApproved();
  for (let i = 0; i < 3; i++) s = step(s, 'SAVE_AUDIO', {path: `${DIR.working}\\copy${i}.wav`, format: 'WAV', rate: 96000, bits: 16});
  s = step(s, 'HANDOVER', {marks, originals});
  assert.equal(s.handover, false);
  assert.match(s.handoverFeedback.find(p => p.key === 'allocation').text, /exceeds 200 MB/);
});
test('saving a new output invalidates handover and finish', () => {
  const s = step(complete(), 'SAVE_IMAGE', {path: IMAGE_MASTER_PATH, width: 4000, height: 3000, ppi: 300});
  assert.equal(s.handover, false);
  assert.throws(() => step(s, 'FINISH'));
  assert.equal(handoverChecks(s, originals).image.ok, false);
});
test('saving an unrelated listening copy keeps the approval', () => {
  let s = audioApproved();
  s = step(s, 'SAVE_AUDIO', {path: `${DIR.working}\\statement_listening.mp3`, format: 'MP3', rate: 44100, bits: 16});
  assert.ok(s.approved.audio);
});
test('revisions are logged but carry no penalty field', () => {
  const s = savedText(savedText(step(prepared(), 'OPEN', {kind: 'text'})));
  assert.equal(s.revisions.text, 2);
  assert.ok(Object.values(strandChecks(s)).flat().every(([label]) => !/retry|speed|revision/i.test(label)));
});
test('every strand check passes on a clean run', () => {
  const s = complete();
  for (const [strand, checks] of Object.entries(strandChecks(s))) for (const [label, ok] of checks) assert.ok(ok, `${strand}: ${label}`);
});
test('unfinished handover cannot finish', () => assert.throws(() => step(initial(), 'FINISH')));
test('the reducer does not mutate its input', () => { const s = initial(); step(s, 'POWER'); assert.equal(s.powered, false); });
test('learner text is capped and stored, never interpreted', () => { const s = step(initial(), 'CHAT', {text: '<img src=x onerror=alert(1)>'}); assert.equal(s.messages[0].text, '<img src=x onerror=alert(1)>'); });
test('old schemas are discarded rather than trusted', () => { assert.equal(migrate({schema: 1, approved: {text: 1}}), null); assert.ok(migrate(initial())); });
test('messages wait in the outbox so a reload cannot duplicate them', () => {
  let s = step(step(initial(), 'POWER'), 'LOGIN', {name: 'A'});
  assert.equal(s.messages.length, 0);
  assert.equal(s.outbox.length, 1);
  s = step(s, 'LOGIN', {name: 'A'});
  assert.equal(s.outbox.length, 1);
});

// What the learner is shown.
test('the next step is always stated, from first login to completion', () => {
  let s = step(step(initial(), 'POWER'), 'LOGIN', {name: 'Moses'});
  assert.equal(nextTask(s).text, 'Amina is replying');
  assert.equal(nextTask(flush(s)).text, 'Read Amina’s message');
  assert.equal(nextTask(prepared()).text, 'Open the witness message');
  assert.equal(nextTask(textApproved()).text, 'Open the photograph');
  assert.equal(nextTask(imageApproved()).text, 'Prepare the tape');
  assert.equal(nextTask(audioApproved()).text, 'Complete the final handover');
  assert.equal(nextTask(complete()).text, 'Join Amina’s handover review');
});
test('apps appear only when their stage arrives', () => {
  const s = initial();
  assert.deepEqual(['ftk', 'notepad', 'gimp', 'audacity', 'case'].map(id => !!appAvailable(s, id)), [false, false, false, false, false]);
  assert.ok(appAvailable(s, 'browser'));
  assert.ok(appAvailable(prepared(), 'notepad'));
  assert.ok(!appAvailable(prepared(), 'gimp'));
  assert.ok(appAvailable(imageApproved(), 'audacity'));
});
test('every step explains how, and points at the bench when hands are needed', () => {
  let s = step(step(initial(), 'POWER'), 'LOGIN', {name: 'Moses'});
  s = flush(step(step(step(step(step(s, 'FOLDER_OPENED'), 'BRIEF'), 'INSPECT', {kind: 'text'}), 'INSPECT', {kind: 'image'}), 'INSPECT', {kind: 'audio'}));
  s = flush(step(step(s, 'RANK', {risk: ['audio', 'text', 'image']}), 'INTAKE', {objective: 'preserve'}));
  assert.equal(nextTask(s).open, 'equipment');
  assert.equal(s.messages.at(-1).card.type, 'bench');
  for (const state of [prepared(), textApproved(), imageApproved(), audioApproved(), complete()]) assert.ok(nextTask(state).how.length > 10);
});
