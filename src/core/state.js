// The authoritative case state. Every view and the 3D bench read from here; only event() changes it.
import {COPY, fill} from '../content/copy.js';
import {
  CASE_LIMIT, CCTV_WORKING_PATH, DIR, IMAGE_MASTER_PATH, MIN_PLATE_WIDTH, SOURCE_SIZE, TARGETS, TEXT, WITNESS_PATH,
  audioBytes, compareRGB, formatBytes, imageBytes, isEvidencePath, largestItem, plateWidth, storage, textBytesOf, validate,
} from './domain.js';
import {decode, fromBase64, toBase64, utf8Encode} from './bytes.js';

export const SCHEMA = 3;
const PARTS = ['blocker', 'drive', 'tape', 'interface', 'headphones'];

export function initial() {
  return {
    schema: SCHEMA, name: '', powered: false, story: 9 * 60 + 5,
    folderOpened: false, briefed: false, briefSkipped: false, closingDone: false,
    inspected: [], risk: [], riskHistory: [], riskFeedback: null, rerankUsed: false,
    objective: '', objectiveHistory: [], intake: false,
    hardware: {blocker: false, drive: false, tape: false, interface: false, headphones: false},
    acquisition: null, evidenceAdded: false, copies: false,
    text: {opened: false, comparisons: []},
    image: {opened: false, picks: {}, rgb: [128, 128, 128], rgbDone: false, rationale: '', compared: []},
    audio: {
      opened: false, device: '', rate: 8000, bits: 8, format: 'MP3', step: 0, previews: [], feedback: null,
      captured: false, captureRate: 0, captureBits: 0, rationale: '',
    },
    tapePasses: 0, overwriteAttempts: [],
    files: {}, approved: {text: null, image: null, audio: null}, submissions: [],
    messages: [], outbox: [], review: null,
    handover: false, handoverAttempts: [], handoverFeedback: null,
    reflection: {answers: [], note: ''}, finished: false,
    log: [], revisions: {text: 0, image: 0, audio: 0}, hints: 0, copy: {}, devAssisted: false,
  };
}

export const available = (s, kind) => (kind === 'text' ? s.copies : kind === 'image' ? !!s.approved.text : kind === 'audio' ? !!s.approved.image : false);
export const assignmentOf = file => ({witness: 'text', cctv: 'image', statement: 'audio'}[file?.sourceId] ?? null);
export const lockReason = (s, kind) => (available(s, kind) ? null : {
  text: 'This assignment opens once the verified working copies have been exported from Evidence Imager.',
  image: 'The photograph assignment is released after Amina approves the text.',
  audio: 'The tape deck is booked. Amina releases the audio assignment after the photograph is approved.',
}[kind]);

// Apps reach the desktop when their stage arrives, so nothing shows before it is needed.
export function appAvailable(s, id) {
  return {browser: true, explorer: !!s.acquisition, ftk: s.intake, notepad: s.copies, case: s.copies, gimp: !!s.approved.text, audacity: !!s.approved.image}[id] ?? false;
}

// What to do now, in one line, with the how kept back until the learner asks. It opens nothing by itself.
export function nextTask(s) {
  const master = Object.values(s.files).find(f => f.sourceId === 'statement' && ['FLAC', 'WAV'].includes(f.settings.format));
  const text = s.files[WITNESS_PATH], image = s.files[IMAGE_MASTER_PATH];
  const task = (id, t, how, open) => ({id, text: t, how, open});
  if (s.review || s.outbox.length) return {id: 'wait', text: 'Amina is replying', how: '', open: 'chat', quiet: true};
  if (!s.folderOpened) return task('message', 'Read Amina’s message', 'Open the chat on the right. Her message has the shared folder in it.', 'chat');
  if (!s.briefed) return task('brief', 'Join Amina’s briefing', 'In Chat, click Join on her invitation, then Join now.', 'chat');
  if (!s.intake) return task('intake', 'Complete the evidence intake', 'Open the intake record from Amina’s message. Look at the three items, rank them by risk of loss, choose what we are protecting, then confirm.', 'intake');
  if (!s.hardware.blocker || !s.hardware.drive) return task('bench', 'Connect the evidence drive', 'The computer cannot reach the drive yet. It has to be plugged in at your bench, through the write-blocker.', 'equipment');
  if (!s.acquisition) return task('acquire', 'Create a disk image', 'In Evidence Imager, open the File menu and choose Create Disk Image. Save it to the evidence store and turn on verification.', 'ftk');
  if (!s.copies) return task('export', 'Export the working files', 'In Evidence Imager, click Export working copies, and send them to the Working folder.', 'ftk');
  if (!s.approved.text) {
    if (text?.version > 1 && text.settings.reopened && text.settings.decoding === 'UTF-8') return task('sendText', 'Send the text file to Amina', 'In Chat, click the paperclip, choose witness_working.txt, then press Send.', 'chat');
    return s.text.opened ? task('fixText', 'Make the text read correctly', 'It is reading the bytes with the wrong rulebook. In Text Editor, choose the right one from the Encoding menu, then Save.', 'notepad') : task('openText', 'Open the witness message', 'In Text Editor, open the File menu, choose Open, and pick witness_working.txt.', 'notepad');
  }
  if (!s.approved.image) {
    if (!s.image.opened) return task('openImage', 'Open the photograph', 'In Image Editor, open the File menu, choose Open, and pick cctv_working.jpg.', 'gimp');
    if (!s.image.rgbDone) return task('pixels', 'Read a pixel', 'In the Case Record, sample the number plate to see what one pixel holds.', 'case-image');
    if (image?.settings.compared) return task('sendImage', 'Send the image to Amina', 'In Chat, click the paperclip, choose cctv_working.png, then press Send.', 'chat');
    return task('imageSet', 'Export the photograph', 'In Image Editor, choose File > Export As. Pick the size and print resolution, then export.', 'gimp');
  }
  if (!s.approved.audio) {
    if (!s.hardware.tape || !s.hardware.interface || !s.hardware.headphones) return task('bench', 'Prepare the tape', 'The tape has to be loaded and connected by hand at your bench before the computer can record it.', 'equipment');
    if (!s.audio.captured) return task('capture', 'Set up and record', 'In Audio Recorder, choose the sample rate and bit depth, select the audio interface, then press Record. The tape plays once.', 'audacity');
    if (master?.settings.checked) return task('sendAudio', 'Send the audio to Amina', `In Chat, click the paperclip, choose ${master.name}, then press Send.`, 'chat');
    return task('exportAudio', 'Export the audio master', 'In Audio Recorder, open the File menu and choose Export Audio.', 'audacity');
  }
  if (!s.handover) return task('handover', 'Complete the final handover', 'Open the record from Amina’s last message, check each item, then submit.', 'handover');
  if (!s.closingDone) return task('closing', 'Join Amina’s handover review', 'In Chat, click Join on her invitation.', 'chat');
  if (!s.finished) return task('debrief', 'Read your feedback', 'Open your record to see what you chose and why it mattered.', 'debrief');
  return task('done', 'Case complete', 'Well done. Your record is saved.', 'debrief');
}

function line(s, key, values) {
  return fill(s.copy[key] ?? COPY[key], {name: s.name, ...values});
}
const say = (s, group) => s.outbox.push(group);
const amina = (s, key, values, extra = {}) => ({text: line(s, key, values), key, ...extra});

// Story clock: moves at milestones only, so it never implies real-time urgency.
const advance = (s, time) => { s.story = Math.max(s.story, time[0] * 60 + time[1]); };

function makeFile(s, path, fields) {
  const previous = s.files[path];
  const name = path.split('\\').pop(), dir = path.slice(0, -name.length - 1);
  s.files[path] = {path, name, dir, version: (previous?.version ?? 0) + 1, readOnly: false, excluded: false, savedAt: s.story, settings: {}, ...fields};
  return s.files[path];
}

function invalidateAfterSave(s, kind, path, previous) {
  if (previous) s.revisions[kind]++;
  if (s.approved[kind]?.path === path) s.approved[kind] = null;
  if (s.handover || s.approved[kind] === null) { s.handover = false; s.finished = false; }
}

// Requirements the final record checks against the submitted version, not against current editor controls.
export function handoverChecks(s, originals) {
  const get = kind => (s.approved[kind] ? s.files[s.approved[kind].path] : null);
  const current = kind => !!get(kind) && get(kind).version === s.approved[kind].version;
  const text = get('text'), image = get('image'), audio = get('audio');
  const bytes = text && !text.settings.representation ? textBytesOf(text) : new Uint8Array();
  const decoded = decode(bytes, 'UTF-8');
  const width = image?.settings.detailWidth ?? image?.settings.width ?? 0;
  const results = {
    text: {
      item: 'text', ok: current('text') && decoded === TEXT && text.settings.decoding === 'UTF-8',
      evidence: !text ? 'No approved text file.' : !current('text') ? 'A newer save has not been reviewed.' : decoded === TEXT ? 'It decodes to the same 92 characters.' : 'It no longer decodes to the same 92 characters.',
    },
    image: {
      item: 'image', ok: current('image') && plateWidth(width) >= MIN_PLATE_WIDTH && image.settings.width <= SOURCE_SIZE.width && image.bytes <= 100e6,
      evidence: !image ? 'No approved image file.' : !current('image') ? 'A newer save has not been reviewed.' : `The plate is about ${plateWidth(width)} px wide in this file.`,
    },
    audio: {
      item: 'audio', ok: current('audio') && audio.settings.captureRate >= 44100 && audio.settings.captureBits >= 16 && ['FLAC', 'WAV'].includes(audio.settings.format) && audio.bytes <= 100e6,
      evidence: !audio ? 'No approved audio file.' : !current('audio') ? 'A newer save has not been reviewed.' : `Captured at ${audio.settings.captureRate} Hz, ${audio.settings.captureBits}-bit, saved as ${audio.settings.format}.`,
    },
    allocation: {item: 'allocation', ok: storage(s.files) <= CASE_LIMIT, evidence: `The package totals ${formatBytes(storage(s.files))}.`},
    originals: {
      item: 'originals',
      ok: !!originals && originals.witness && originals.cctv && s.tapePasses === 1 && s.overwriteAttempts.every(a => a.blocked),
      evidence: !originals ? 'The originals have not been compared.' : `Witness message ${originals.witness ? 'matches' : 'differs from'} its baseline hash, photograph ${originals.cctv ? 'matches' : 'differs from'} its baseline hash, tape played ${s.tapePasses} time${s.tapePasses === 1 ? '' : 's'}.`,
    },
  };
  return results;
}

export function event(state, e) {
  const s = structuredClone(state);
  const require = (ok, message) => { if (!ok) throw Error(message); };
  switch (e.type) {
    case 'POWER': s.powered = true; break;
    case 'LOGIN':
      require(s.powered, 'Turn on the computer.');
      require(e.name?.trim(), 'Enter your name.');
      s.name = e.name.trim().slice(0, 60);
      if (!s.messages.length && !s.outbox.length) {
        say(s, {toast: line(s, 'welcomeToast'), lines: [amina(s, 'welcome1'), amina(s, 'welcome2', null, {card: {type: 'drive', label: 'Case 0417 — Intake'}})]});
      }
      break;
    case 'DELIVER': {
      const group = s.outbox.shift();
      if (group) for (const m of group.lines) s.messages.push({id: s.messages.length + 1, from: 'amina', at: s.story, ...m});
      break;
    }
    case 'CHAT':
      require(e.text?.trim(), 'Type a message first.');
      s.messages.push({id: s.messages.length + 1, from: 'me', at: s.story, text: e.text.trim().slice(0, 500)});
      break;
    case 'FOLDER_OPENED':
      if (!s.folderOpened) {
        s.folderOpened = true;
        advance(s, [9, 12]);
        say(s, {toast: line(s, 'briefInvite'), lines: [amina(s, 'briefInvite', null, {card: {type: 'meet', call: 'briefing', label: 'Case 0417 briefing'}})]});
      }
      break;
    case 'BRIEF':
      require(s.folderOpened, 'Open the shared folder first.');
      if (!s.briefed) {
        s.briefed = true;
        s.briefSkipped = !!e.skipped;
        advance(s, [9, 20]);
        say(s, {toast: line(s, 'afterBrief'), lines: [amina(s, 'afterBrief', null, {card: {type: 'record', page: 'intake', label: 'Case record: Evidence intake'}})]});
      }
      break;
    case 'INSPECT':
      require(['text', 'image', 'audio'].includes(e.kind), 'Unknown evidence.');
      if (!s.inspected.includes(e.kind)) s.inspected.push(e.kind);
      break;
    case 'RANK': {
      require(new Set(e.risk).size === 3 && e.risk.length === 3, 'Assign each risk position once.');
      s.risk = [...e.risk];
      s.riskHistory.push(e.risk.join('>'));
      const [a, b, c] = e.risk;
      const key = c === 'audio' ? 'riskAudioLast' : a === 'audio' && b === 'text' ? 'riskBest' : a === 'audio' ? 'riskImageMiddle' : a === 'text' ? 'riskTextFirst' : 'riskImageFirst';
      s.riskFeedback = {key, text: line(s, key), ok: key === 'riskBest'};
      break;
    }
    case 'RERANK': require(!s.rerankUsed, 'You have already used the re-rank.'); s.rerankUsed = true; s.riskFeedback = null; s.risk = []; break;
    case 'INTAKE': {
      require(s.briefed, 'Join the briefing first.');
      require(s.risk.length === 3, 'Rank the three items first.');
      s.objectiveHistory.push(e.objective);
      if (e.objective !== 'preserve') {
        const key = {small: 'objectiveSmall', enhance: 'objectiveEnhance', common: 'objectiveCommon'}[e.objective] ?? 'objectiveWrong';
        throw Error(`${line(s, key)} ${line(s, 'objectiveWrong')}`);
      }
      if (!s.intake) {
        s.intake = true;
        s.objective = e.objective;
        advance(s, [9, 35]);
        say(s, {toast: line(s, 'afterIntake'), lines: [amina(s, 'afterIntake', null, {card: {type: 'bench', label: 'Go to your bench'}})]});
      }
      break;
    }
    case 'HARDWARE':
      require(PARTS.includes(e.part), 'Unknown hardware.');
      if (e.part === 'drive') require(s.hardware.blocker, line(s, 'noBlocker'));
      if (['tape', 'interface', 'headphones'].includes(e.part)) require(s.approved.image, 'The tape deck is booked. Amina will release it after the photograph is approved.');
      s.hardware[e.part] = true;
      break;
    case 'ACQUIRE':
      require(s.intake, 'Complete the intake record first.');
      require(s.hardware.blocker && s.hardware.drive, line(s, 'noBlocker'));
      require(e.source === 'evidence', line(s, 'wrongSourceDrive'));
      require(e.destination === 'store', line(s, 'sourceAsDestination'));
      require(e.verify, line(s, 'notVerified'));
      s.acquisition = {verified: e.match === true, md5: e.md5 ?? null, sha1: e.sha1 ?? null, badSectors: 0, witnessSha: e.witnessSha ?? null, cctvSha: e.cctvSha ?? null, examiner: s.name};
      makeFile(s, `${DIR.store}\\drive.E01`, {kind: 'evidence', readOnly: true, excluded: true, bytes: 0, label: 'Preserved acquisition image'});
      // A verified image is added to the evidence tree at once, ready to export from.
      s.evidenceAdded = true;
      advance(s, [10, 24]);
      break;
    case 'ADD_EVIDENCE': require(s.acquisition, 'Create the image first.'); s.evidenceAdded = true; break;
    case 'COPIES':
      require(s.acquisition?.verified, line(s, 'notVerified'));
      require(s.evidenceAdded, 'Add drive.E01 as an evidence item, then export from it.');
      if (!s.copies) {
        require(e.witnessSha === s.acquisition.witnessSha && e.cctvSha === s.acquisition.cctvSha, 'The exported bytes do not match the preserved image. Export them again.');
        s.copies = true;
        makeFile(s, WITNESS_PATH, {kind: 'text', sourceId: 'witness', bytes: utf8Encode(TEXT).length, settings: {b64: toBase64(utf8Encode(TEXT)), encoding: 'unlabelled', baseline: true}});
        // The JPEG working copy is the same pixels as the image master, so it shares that allocation.
        makeFile(s, CCTV_WORKING_PATH, {kind: 'image', sourceId: 'cctv', bytes: 0, actualBytes: e.cctvBytes ?? 0, readOnly: true, label: 'Read-only working baseline', settings: {width: SOURCE_SIZE.width, height: SOURCE_SIZE.height, ppi: 72, format: 'JPEG'}});
        advance(s, [10, 40]);
        say(s, {toast: line(s, 'copiesReady1'), lines: [amina(s, 'copiesReady1'), amina(s, 'copiesReady2')]});
      }
      break;
    case 'OPEN':
      require(['text', 'image', 'audio'].includes(e.kind), 'Unknown kind.');
      require(available(s, e.kind), lockReason(s, e.kind));
      s[e.kind].opened = true;
      break;
    case 'COMPARE_TEXT':
      if (!s.text.comparisons.includes(e.encoding)) s.text.comparisons.push(e.encoding);
      break;
    case 'SAVE_TEXT': {
      require(available(s, 'text'), lockReason(s, 'text'));
      require(!isEvidencePath(e.path), 'The evidence store is read-only. Save working files in the Working folder.');
      const previous = s.files[e.path];
      const bytes = fromBase64(e.b64);
      // The record states what the bytes are, not what the editor's status bar happened to say.
      const encoding = decode(bytes, 'UTF-8') === TEXT && bytes.length === 112 ? 'UTF-8' : e.encoding;
      makeFile(s, e.path, {kind: 'text', sourceId: 'witness', bytes: bytes.length, settings: {b64: e.b64, encoding, reopened: false, decoding: null}});
      invalidateAfterSave(s, 'text', e.path, previous);
      break;
    }
    case 'SAVE_SCREENSHOT': {
      require(available(s, 'text'), lockReason(s, 'text'));
      const previous = s.files[e.path];
      makeFile(s, e.path, {kind: 'text', sourceId: 'witness', bytes: 48000, actualBytes: e.actualBytes, blobKey: e.blobKey, settings: {representation: 'screenshot'}});
      invalidateAfterSave(s, 'text', e.path, previous);
      break;
    }
    case 'TEXT_CHECK': {
      const f = s.files[e.path];
      require(f, 'Save the text first.');
      require(e.version === f.version, 'The editor is not showing the latest saved version. Reopen the file.');
      require(e.reopened, 'Close the saved file and reopen it first.');
      f.settings.reopened = true;
      f.settings.decoding = e.decoding;
      break;
    }
    case 'PICK': {
      require(available(s, 'image') && s.image.opened, 'Open the working photograph first.');
      if (e.target) s.image.picks[e.target] = {rgb: e.rgb, x: e.x, y: e.y};
      // Reading the plate's own pixel is the lesson: what one sample holds.
      if (e.target === 'plate') { s.image.rgb = e.rgb; s.image.rgbDone = true; }
      break;
    }
    case 'RGB_SET': s.image.rgb = e.rgb; break;
    case 'RGB_MATCH': {
      require(['plate', 'character', 'sky'].every(t => s.image.picks[t]), line(s, 'rgbIncomplete'));
      const target = s.image.picks.plate.rgb;
      require(compareRGB(e.rgb, target), `Not yet. Each channel must be within ±15 of the plate pixel you sampled (R ${target[0]}, G ${target[1]}, B ${target[2]}).`);
      s.image.rgb = e.rgb;
      s.image.rgbDone = true;
      break;
    }
    case 'RATIONALE': s[e.kind].rationale = String(e.text).slice(0, 800); break;
    case 'SAVE_IMAGE': {
      require(available(s, 'image') && s.image.opened, 'Open the working photograph first.');
      require(!isEvidencePath(e.path), 'The evidence store is read-only. Export to the Working folder.');
      if (e.path === CCTV_WORKING_PATH) {
        s.overwriteAttempts.push({path: e.path, blocked: true});
        throw Error('cctv_working.jpg is the read-only working baseline. Overwriting it would recompress the JPEG. Export a separate PNG.');
      }
      const previous = s.files[e.path];
      makeFile(s, e.path, {
        kind: 'image', sourceId: 'cctv', bytes: imageBytes(e.width, e.height), actualBytes: e.actualBytes ?? null, blobKey: e.blobKey ?? null,
        settings: {width: e.width, height: e.height, ppi: e.ppi, detailWidth: e.detailWidth ?? e.width, format: 'PNG', compared: false},
      });
      invalidateAfterSave(s, 'image', e.path, previous);
      break;
    }
    case 'IMAGE_CHECK': {
      const f = s.files[e.path];
      require(f, 'Export the image first.');
      require(e.reopened, 'Reopen the exported image first.');
      f.settings.compared = true;
      f.settings.plateMatch = e.plateMatch ?? null;
      break;
    }
    case 'AUDIO_DEVICE': s.audio.device = e.device; break;
    case 'AUDIO_SET': {
      require(s.audio.opened, 'Open Audio Recorder first.');
      if (s.audio.captured) break;
      Object.assign(s.audio, e.patch);
      s.audio.feedback = null;
      break;
    }
    case 'AUDIO_PREVIEW': if (!s.audio.previews.includes(e.id)) s.audio.previews.push(e.id); break;
    case 'AUDIO_STEP': {
      // Controls unlock one at a time. A weak choice gets Amina's reason and stays on this step.
      require(s.audio.opened, 'Open Audio Recorder first.');
      const a = s.audio;
      if (a.step === 0) {
        const key = {8000: 'audio8k', 16000: 'audio16k', 96000: 'audioExcess'}[a.rate];
        a.feedback = key ? {key, text: line(s, key)} : null;
        if (!key) a.step = 1;
      } else if (a.step === 1) {
        const key = {8: 'audio8bit', 24: 'audioExcess'}[a.bits];
        a.feedback = key ? {key, text: line(s, key)} : null;
        if (!key) a.step = 2;
      } else if (a.step === 2) {
        a.feedback = a.format === 'MP3' ? {key: 'audioMp3', text: line(s, 'audioMp3')} : null;
        if (a.format !== 'MP3') a.step = 3;
      }
      break;
    }
    case 'CAPTURE_BEGIN':
    case 'CAPTURE':
      require(!s.audio.captured, 'Tape already captured. Use the preserved master or the reference previews.');
      require(available(s, 'audio') && s.audio.opened, lockReason(s, 'audio') ?? 'Open Audio Recorder first.');
      require(s.hardware.tape && s.hardware.interface && s.hardware.headphones, 'Prepare the tape, interface and headphones at the bench first.');
      require(s.audio.device === 'interface', 'Select the USB Audio Interface as the recording device.');
      // The tape plays once, so a setting that would lose or invent detail is stopped before it starts.
      if (s.audio.rate !== 44100) throw Error(line(s, {8000: 'audio8k', 16000: 'audio16k'}[s.audio.rate] ?? 'audioExcess'));
      if (s.audio.bits !== 16) throw Error(line(s, s.audio.bits === 8 ? 'audio8bit' : 'audioExcess'));
      if (e.type === 'CAPTURE') {
        s.audio.captured = true;
        s.audio.captureRate = s.audio.rate;
        s.audio.captureBits = s.audio.bits;
        s.tapePasses += 1;
        advance(s, [14, 27]);
      }
      break;
    case 'SAVE_AUDIO': {
      require(available(s, 'audio') && s.audio.opened, lockReason(s, 'audio') ?? 'Open Audio Recorder first.');
      require(s.audio.captured, line(s, 'audioNoCapture'));
      require(!isEvidencePath(e.path), 'The evidence store is read-only. Export to the Working folder.');
      const previous = s.files[e.path];
      makeFile(s, e.path, {
        kind: 'audio', sourceId: 'statement', bytes: audioBytes(e.rate, e.bits, e.format), estimated: e.format === 'FLAC' || e.format === 'MP3',
        settings: {format: e.format, rate: e.rate, bits: e.bits, captureRate: s.audio.captureRate, captureBits: s.audio.captureBits, checked: false},
      });
      invalidateAfterSave(s, 'audio', e.path, previous);
      break;
    }
    case 'AUDIO_CHECK': {
      const f = s.files[e.path];
      require(f?.kind === 'audio', 'Export the audio first.');
      f.settings.checked = true;
      break;
    }
    case 'DELETE_FILE': {
      const f = s.files[e.path];
      require(f, 'That file is not there.');
      if (f.readOnly || isEvidencePath(e.path)) {
        s.overwriteAttempts.push({path: e.path, blocked: true});
        throw Error('Access denied. Preserved evidence and the read-only working baseline cannot be deleted.');
      }
      const kind = f.kind;
      require(s.approved[kind]?.path !== e.path, 'This file is the approved submission. Keep it for the handover.');
      delete s.files[e.path];
      break;
    }
    case 'SUBMIT': {
      require(!s.review, 'Amina is still reviewing the last attachment.');
      const f = s.files[e.path];
      require(f, 'Choose a saved attachment.');
      s.review = structuredClone(f);
      s.submissions.push({path: f.path, version: f.version, at: s.story});
      s.messages.push({id: s.messages.length + 1, from: 'me', at: s.story, text: e.note?.trim() || '', attachment: {path: f.path, name: f.name, version: f.version, bytes: f.bytes}});
      break;
    }
    case 'REVIEW': {
      require(s.review, 'No submission to review.');
      const sent = s.review;
      s.review = null;
      if (s.files[sent.path]?.version !== sent.version) {
        say(s, {toast: line(s, 'staleFile'), lines: [amina(s, 'staleFile')]});
        break;
      }
      const kind = assignmentOf(sent);
      if (!kind || !available(s, kind)) {
        say(s, {toast: line(s, 'staleFile'), lines: [amina(s, 'staleFile')]});
        break;
      }
      const result = validate(kind, sent, s);
      if (!result.pass) {
        const text = result.keys.map(k => line(s, k)).join(' ');
        say(s, {toast: text, lines: [{text, key: result.keys[0]}]});
        break;
      }
      const firstTime = !s.approved[kind] && !(kind === 'text' ? s.approved.image : kind === 'image' ? s.approved.audio : s.handover);
      s.approved[kind] = {path: sent.path, version: sent.version, settings: sent.settings, bytes: sent.bytes};
      if (kind === 'text') {
        advance(s, [11, 10]);
        say(s, {toast: line(s, 'textPass'), lines: [amina(s, 'textPass'), ...(firstTime ? [amina(s, 'imageRelease', null, {card: {type: 'case', tab: 'image', label: 'Case record: Read a pixel'}})] : [])]});
      } else if (kind === 'image') {
        advance(s, [12, 40]);
        say(s, {toast: line(s, 'imagePass'), lines: [amina(s, 'imagePass'), ...(firstTime ? [amina(s, 'audioRelease1', null, {card: {type: 'bench', label: 'Go to your bench'}}), amina(s, 'audioRelease2')] : [])]});
      } else {
        advance(s, [14, 45]);
        say(s, {toast: line(s, 'audioPass'), lines: [amina(s, 'audioPass'), amina(s, 'handoverOpen1', null, {card: {type: 'record', page: 'handover', label: 'Case record: Final handover'}})]});
      }
      break;
    }
    case 'CANCEL_REVIEW': s.review = null; break;
    case 'HANDOVER': {
      require(Object.values(s.approved).every(Boolean), 'All three outputs need approval first.');
      const marks = e.marks ?? {};
      require(marks.text && marks.image && marks.audio && marks.originals && marks.allocation, 'Make all five judgements before you submit.');
      const checks = handoverChecks(s, e.originals);
      const expected = {text: 'readable', image: 'sufficient', audio: 'suitable', originals: 'unchanged', allocation: 'within'};
      const label = {text: 'text', image: 'image', audio: 'audio', originals: 'originals', allocation: 'allocation'};
      const problems = [];
      for (const key of ['text', 'image', 'audio', 'originals', 'allocation']) {
        if (!checks[key].ok || marks[key] !== expected[key]) {
          if (key === 'allocation' && !checks.allocation.ok) {
            const big = largestItem(s.files);
            problems.push({key, text: line(s, 'handoverBudget', {largest: big?.name ?? 'the largest file'})});
          } else {
            const evidence = checks[key].ok ? `The system check passed: ${checks[key].evidence} Your mark disagrees, so look again.` : checks[key].evidence;
            problems.push({key, text: line(s, 'handoverFail', {item: label[key], evidence})});
          }
        }
      }
      s.handoverAttempts.push({at: s.story, marks, ok: problems.length === 0});
      s.handoverFeedback = problems;
      if (problems.length) break;
      s.handover = true;
      s.originalsProof = e.originals;
      advance(s, [15, 10]);
      makeFile(s, `${DIR.reports}\\processing_log.json`, {kind: 'log', bytes: e.logBytes ?? 2048, settings: {}});
      say(s, {toast: line(s, 'handoverPass1'), lines: [amina(s, 'handoverPass1'), amina(s, 'handoverPass2', null, {card: {type: 'meet', call: 'closing', label: 'Case 0417 handover review'}})]});
      break;
    }
    case 'CLOSING':
      require(s.handover, 'Complete the handover first.');
      if (!s.closingDone) {
        s.closingDone = true;
        advance(s, [15, 30]);
        say(s, {toast: line(s, 'closingCard'), lines: [amina(s, 'closingCard', null, {card: {type: 'record', page: 'debrief', label: 'Case record: Handover and feedback'}})]});
      }
      break;
    case 'REFLECT': s.reflection = {answers: (e.answers ?? []).map(a => String(a).slice(0, 1500)), note: String(e.note ?? '').slice(0, 1500)}; break;
    case 'HINT': s.hints++; break;
    case 'FINISH':
      require(s.handover, 'Complete the handover first.');
      s.finished = true;
      makeFile(s, `${DIR.reports}\\completion_record.json`, {kind: 'log', bytes: 1024, settings: {}});
      break;
    case 'DEV_COPY':
      if (e.text?.trim()) s.copy[e.key] = e.text; else delete s.copy[e.key];
      break;
    case 'DEV_ASSIST': s.devAssisted = true; break;
    default: throw Error('Unknown event ' + e.type);
  }
  if (!['DELIVER', 'RGB_SET'].includes(e.type)) s.log.push({event: e.type, at: s.story, detail: e.detail ?? e.kind ?? e.part ?? e.path ?? undefined});
  return s;
}

// The four areas Amina reviews. Check lists only: the storyboard gives no approved point deductions.
export function strandChecks(s) {
  const text = s.approved.text ? s.files[s.approved.text.path] : null;
  const image = s.approved.image ? s.files[s.approved.image.path] : null;
  const audio = s.approved.audio ? s.files[s.approved.audio.path] : null;
  return {
    handling: [
      ['All three items inspected', s.inspected.length === 3],
      ['Risk ranking recorded', s.risk.length === 3],
      ['Preservation objective confirmed', s.intake],
      ['Source protected and image verified', !!s.acquisition?.verified],
      ['Working copies used, originals unchanged', !!s.originalsProof?.witness && !!s.originalsProof?.cctv && s.tapePasses === 1],
      ['Handover completed', s.handover],
    ],
    text: [
      ['Saved as UTF-8 without BOM', text?.settings.encoding === 'UTF-8' && text?.bytes === 112],
      ['Reopened with matching decoding', text?.settings.decoding === 'UTF-8'],
      ['Approved by Amina', !!s.approved.text],
    ],
    image: [
      ['Plate, character and sky pixels inspected', ['plate', 'character', 'sky'].every(t => s.image.picks[t])],
      ['RGB swatch matched', s.image.rgbDone],
      ['4000 × 3000 retained at 300 PPI', image?.settings.width === 4000 && image?.settings.ppi === 300],
      ['Approved by Amina', !!s.approved.image],
    ],
    audio: [
      ['Compared before the single capture', s.audio.previews.length >= 2],
      ['Captured once at 44.1 kHz, 16-bit', s.audio.captureRate === 44100 && s.audio.captureBits === 16 && s.tapePasses === 1],
      ['Lossless master', ['FLAC', 'WAV'].includes(audio?.settings.format)],
      ['Approved by Amina', !!s.approved.audio],
    ],
  };
}

// Schema changes must never let an old session satisfy newer rules.
export function migrate(saved) {
  if (saved?.schema === SCHEMA) return saved;
  return null;
}

export {TARGETS, IMAGE_MASTER_PATH};
