// The lab's own web record: intake, final handover and the personalised debrief.
import {app} from '../runtime.js';
import {esc} from '../desktop/dom.js';
import {icons} from '../desktop/icons.js';
import {picture} from '../content/media.js';
import {registerPage} from './browser.js';
import {CASE_ID, CASE_LIMIT, MB, formatBytes, plateWidth, storage, countedFiles} from '../core/domain.js';
import {handoverChecks, strandChecks} from '../core/state.js';
import {originalsIntact} from '../core/evidence.js';
import {openFileForLearner} from './explorer.js';

const NAMES = {audio: 'Tape', text: 'Text', image: 'Photograph'};
const LAB_URL = 'https://lab.digitalevidence.example/cases/0417';
const shell = (crumb, body) => `<div class="lab"><header class="lab-top">${picture('labLogo', 'lab-logo')}<span class="lab-case">Case 0417 · <em>${app.s.handover ? 'Complete' : 'Processing'}</em></span><span class="lab-user"><span class="me-av">${esc(app.s.name[0] ?? '?')}</span>${esc(app.s.name)}</span></header><main class="lab-main"><nav class="crumbs" aria-label="Breadcrumb">Cases › Case 0417 › ${esc(crumb)}</nav>${body}</main></div>`;

// ---- Intake
const OBJECTIVES = [
  ['small', 'Make everything as small as possible to share quickly.'], ['enhance', 'Enhance everything so it looks and sounds as clear as possible.'],
  ['common', 'Convert everything to one common format.'], ['preserve', 'Keep the original information intact and verifiable, within the storage quota.'],
];
const intakeForm = () => (app.ui.intake ??= {rank: ['', '', ''], objective: ''});
function intakeView() {
  const s = app.s, f = intakeForm();
  const read = s.inspected.length === 3;
  const unread = ['text', 'image', 'audio'].filter(k => !s.inspected.includes(k)).map(k => NAMES[k].toLowerCase());
  const ranked = s.risk.length === 3;
  const rankLocked = ranked && (s.rerankUsed || !s.riskFeedback || s.riskFeedback.ok);
  const rows = [['audio', 'Audio', 'Recorded statement', 'Analogue microcassette. Wears with each playback.'], ['text', 'Document', 'Witness message', 'Text export from a phone with degrading storage.'], ['image', 'Image', 'CCTV still', 'JPEG from a stable source.']];
  return shell('Evidence intake', `<h1>Evidence intake</h1><p class="lab-sub">Case ${CASE_ID}</p>
  <table class="lab-table"><thead><tr><th>Item</th><th>Description</th><th>Status</th></tr></thead><tbody>${rows.map(([k, sub, n, d]) => `<tr><td><strong>${NAMES[k]}</strong><small>${sub}</small></td><td>${n}. ${d}</td><td>${s.inspected.includes(k) ? '<span class="tag ok">✓ Inspected</span>' : '<span class="tag">Not inspected</span>'}</td></tr>`).join('')}</tbody></table>
  ${!read ? `<p class="lab-need" role="status">Read the remaining evidence label first: ${esc(unread.join(', '))}. The records are in the shared Drive folder.</p>` : !s.briefed ? '<p class="lab-need" role="status">Join Amina’s briefing first.</p>' : `
  <section class="lab-card"><h2>Rank the risk of loss</h2><p>Which could we lose for good? Highest risk first. This never changes the work order.</p>
   <div class="rank-row">${['Highest risk', 'Middle', 'Lowest risk'].map((label, i) => `<label class="lab-field"><span>${label}</span><select data-input="intake:rank" data-i="${i}" aria-label="${label}" ${rankLocked || s.intake ? 'disabled' : ''}><option value="">Choose</option>${Object.entries(NAMES).map(([k, n]) => `<option value="${k}" ${(ranked ? s.risk[i] : f.rank[i]) === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>`).join('')}</div>
   ${ranked ? '' : '<button class="btn" data-action="intake:rank">Record ranking</button>'}
   ${s.riskFeedback ? `<div class="feedback ${s.riskFeedback.ok ? 'ok' : 'warn'}"><strong>${s.riskFeedback.ok ? 'Good reasoning' : 'Think again'}</strong><p>${esc(s.riskFeedback.text)}</p>${!s.riskFeedback.ok && !s.rerankUsed && !s.intake ? '<button class="btn" data-action="intake:rerank">Re-rank</button>' : ''}</div>` : ''}
  </section>
  ${ranked ? `<section class="lab-card"><h2>Preservation objective</h2><p>What are we protecting across all three items?</p>
   <fieldset class="radios" ${s.intake ? 'disabled' : ''}><legend class="sr">Preservation objective</legend>${OBJECTIVES.map(([k, t]) => `<label><input type="radio" name="objective" value="${k}" data-input="intake:objective" ${(s.intake ? s.objective : f.objective) === k ? 'checked' : ''}><span>${esc(t)}</span></label>`).join('')}</fieldset>
  </section>` : ''}
  ${s.intake ? '<div class="lab-actions"><span class="tag ok">✓ Intake logged. Original untouched.</span></div>' : ranked && f.objective ? '<div class="lab-actions"><button class="btn primary" data-action="intake:confirm">Confirm intake</button></div>' : ''}`}`);
}
registerPage({
  id: 'intake', title: 'Case processing record', icon: icons.record, url: () => `${LAB_URL}/intake`,
  view: intakeView,
  actions: {
    'intake:rank': () => {
      const f = intakeForm();
      if (f.rank.some(r => !r) || new Set(f.rank).size !== 3) return app.guide('Assign each item to one risk position.');
      app.attempt({type: 'RANK', risk: f.rank});
    },
    'intake:rerank': () => { intakeForm().rank = ['', '', '']; app.attempt({type: 'RERANK'}); },
    'intake:confirm': () => {
      if (app.s.risk.length !== 3) return app.guide('Record your risk ranking first.');
      const objective = intakeForm().objective;
      if (!objective) return app.guide('Choose the preservation objective.');
      app.attempt({type: 'INTAKE', objective, detail: objective});
    },
  },
  inputs: {
    'intake:rank': el => { intakeForm().rank[Number(el.dataset.i)] = el.value; },
    'intake:objective': el => { intakeForm().objective = el.value; app.render(); },
  },
});

// ---- Handover
const handoverForm = () => (app.ui.handover ??= {text: '', image: '', audio: '', originals: '', allocation: ''});
const JUDGE = {
  text: [['readable', 'Readable'], ['unreadable', 'Unreadable']], image: [['sufficient', 'Detail sufficient'], ['insufficient', 'Detail insufficient']],
  audio: [['suitable', 'Suitable'], ['needs-revision', 'Needs revision']], originals: [['unchanged', 'Unchanged'], ['changed', 'Changed']], allocation: [['within', 'Within 200 MB'], ['over', 'Over 200 MB']],
};
const judge = (key, label) => `<select data-input="handover:mark" data-key="${key}" aria-label="${label}"><option value="">Choose</option>${JUDGE[key].map(([v, t]) => `<option value="${v}" ${handoverForm()[key] === v ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
function handoverView() {
  const s = app.s;
  const a = s.approved;
  const f = k => (a[k] ? s.files[a[k].path] : null);
  const total = storage(s.files);
  const row = (key, name, detail, sub) => `<tr><td><strong>${name}</strong></td><td>${detail}<small>${sub}</small></td><td>${key === 'originals' || a[key] ? '<span class="tag ok">Ready</span>' : '<span class="tag">Awaiting approval</span>'}</td><td>${judge(key, `${name} judgement`)}</td></tr>`;
  const t = f('text'), i = f('image'), au = f('audio');
  const items = countedFiles(s.files).sort((x, y) => y.bytes - x.bytes);
  return shell('Final handover', `<h1>Final handover · Case 0417</h1><p class="lab-sub">Review each item against its requirement. Your judgement is yours: nothing is pre-selected.</p>
  <table class="lab-table"><thead><tr><th>Item</th><th>Submitted version</th><th>Status</th><th>Your check</th></tr></thead><tbody>
  ${row('text', 'Text', t ? `${esc(t.name)} · v${t.version} · ${esc(t.settings.encoding)}` : 'No approved file', t ? `${t.bytes} B. Reopened as ${esc(t.settings.decoding ?? 'not checked')}.` : '')}
  ${row('image', 'Image', i ? `${esc(i.name)} · v${i.version} · ${i.settings.width} × ${i.settings.height} · ${i.settings.ppi} PPI` : 'No approved file', i ? `RGB estimate ${formatBytes(i.bytes)}. Plate about ${plateWidth(i.settings.detailWidth ?? i.settings.width)} px wide.` : '')}
  ${row('audio', 'Audio', au ? `${esc(au.name)} · v${au.version} · ${au.settings.rate / 1000} kHz, ${au.settings.bits}-bit, ${esc(au.settings.format)}` : 'No approved file', au ? `${au.estimated ? 'Estimated ' : ''}${formatBytes(au.bytes)}. Captured once at ${au.settings.captureRate / 1000} kHz, ${au.settings.captureBits}-bit.` : '')}
  ${row('originals', 'Originals', 'Evidence store and sealed tape', 'Excluded from the allocation. The system compares hashes when you submit.')}
  </tbody></table>
  <section class="lab-card storage"><h2><span>Storage <small>(processing files only)</small></span><span>${formatBytes(total)} / 200 MB</span></h2><div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="200" aria-valuenow="${(total / MB).toFixed(1)}" aria-label="Processing storage"><i style="width:${Math.min(100, total / CASE_LIMIT * 100)}%"></i></div>
  <details><summary>What is counted</summary><ul class="store-list">${items.map(x => `<li>${esc(x.name)}<span>${x.bytes === 0 ? 'read-only baseline, shares the image allocation' : `${x.estimated ? 'estimated ' : ''}${formatBytes(x.bytes)}`}</span></li>`).join('') || '<li>Nothing saved yet.</li>'}</ul></details>
  <label class="lab-field"><span>Is the package inside the allocation?</span>${judge('allocation', 'Allocation judgement')}</label></section>
  ${(s.handoverFeedback ?? []).map(p => `<div class="feedback warn" role="alert"><strong>${esc(p.key[0].toUpperCase() + p.key.slice(1))} check</strong><p>${esc(p.text)}</p>${a[p.key] ? `<button class="btn" data-action="handover:open" data-path="${esc(a[p.key].path)}">Open file</button>` : ''}</div>`).join('')}
  <div class="lab-actions">${s.handover ? '<span class="tag ok">✓ Handover received</span>' : `<button class="btn primary" data-action="handover:submit" ${Object.values(a).every(Boolean) && Object.values(handoverForm()).every(Boolean) ? '' : 'disabled'}>Submit handover</button>`}</div>`);
}
export function processingLog() {
  const s = app.s;
  return {
    simulation_version: '1.0', learner: s.name, case: CASE_ID, processing_order: ['text', 'image', 'audio'], items_inspected: s.inspected, risk_ranking: s.risk, risk_history: s.riskHistory,
    preservation_objective: s.objective, originals_preserved: s.originalsProof ?? null, selected_encoding: s.approved.text?.settings.encoding ?? null,
    text_preview_status: s.approved.text ? 'pass' : null, image: s.approved.image?.settings ?? null, rgb_inspection_complete: s.image.rgbDone, audio: s.approved.audio?.settings ?? null,
    audio_previews: s.audio.previews, storage_total_estimate: storage(s.files), rationale: {image: s.image.rationale, audio: s.audio.rationale}, hints_used: s.hints, revisions: s.revisions,
    handover_attempts: s.handoverAttempts, developer_assisted: s.devAssisted, events: s.log,
  };
}
registerPage({
  id: 'handover', title: 'Digital Evidence Lab', icon: icons.record, url: () => `${LAB_URL}/processing/final-handover`,
  view: handoverView,
  actions: {
    'handover:submit': async () => {
      const originals = await originalsIntact(app.s);
      app.attempt({type: 'HANDOVER', marks: {...handoverForm()}, originals, logBytes: JSON.stringify(processingLog()).length});
    },
    'handover:open': el => openFileForLearner(el.dataset.path),
    'record:log': () => {
      const url = URL.createObjectURL(new Blob([JSON.stringify(processingLog(), null, 2)], {type: 'application/json'}));
      const a = document.createElement('a');
      a.href = url; a.download = 'processing_log.json'; a.click();
      app.clock.after(1000, () => URL.revokeObjectURL(url));
    },
  },
  inputs: {'handover:mark': el => { handoverForm()[el.dataset.key] = el.value; app.render(); }},
});

// ---- Debrief
const QUESTIONS = [
  'Why did we keep the originals unchanged and process working copies, and what could go wrong otherwise?',
  'Why was UTF-8 suitable for the multilingual message, and what could happen if the text were interpreted using an encoding that did not support its characters?',
  'Explain the difference between pixel dimensions/resolution and PPI. Why does changing PPI alone not restore missing image detail?',
  'How do RGB values represent a pixel, and how can increasing image dimensions affect storage?',
  'Describe the roles of sampling, quantisation and encoding when converting an analogue recording into digital data.',
  'How did you balance fidelity and storage across the three evidence types? Which requirement most influenced your decisions?',
];
function feedback(key) {
  const s = app.s, a = s.approved;
  const i = a.image?.settings, au = a.audio?.settings;
  const riskFirst = s.riskHistory[0]?.split('>') ?? [];
  const riskStrong = riskFirst.join() === 'audio,text,image';
  const wrongObjectives = s.objectiveHistory.filter(o => o !== 'preserve');
  const cards = {
    preservation: {
      choice: `You ranked ${riskFirst.map(k => NAMES[k]).join(', then ') || 'the items'} and confirmed "keep the original information intact and verifiable".${wrongObjectives.length ? ` You first chose a different objective ${wrongObjectives.length === 1 ? 'once' : `${wrongObjectives.length} times`}.` : ''}`,
      result: `The drive went through the hardware write-blocker. FTK Imager verified the image. Hashes of the witness message and the photograph still match their baselines, and the tape was played ${s.tapePasses} time${s.tapePasses === 1 ? '' : 's'}.`,
      why: 'If we alter an original, we can never prove what it said. Hardware blocks writes to the source; software acquires and verifies the image.',
      expert: riskStrong ? 'Next-level insight: the booked deck set the work order, not the risk. In real practice you would process the most fragile item first.' : 'Strongest path: tape, then the degrading phone, then the stable photograph. The tape wears with every playback, so that loss cannot be undone.',
    },
    text: {
      choice: `You saved ${esc(a.text?.path.split('\\').pop() ?? 'the working copy')} as ${esc(a.text?.settings.encoding ?? 'UTF-8')}, ${s.text.comparisons.length} representation${s.text.comparisons.length === 1 ? '' : 's'} compared, ${s.revisions.text} revision${s.revisions.text === 1 ? '' : 's'}.`,
      result: 'All 92 characters decode correctly from 112 bytes, and the file remains searchable.',
      why: 'ASCII has 128 characters, so nine became question marks. Latin-1 keeps the é but loses the emoji, symbols, curly quotes and dash. A screenshot is a picture of text, not text.',
      expert: 'Next-level insight: decoding is a separate step from encoding. The same correct bytes read as "ChÃ©bet" under the wrong rulebook, without any data being lost.',
    },
    image: {
      choice: `You kept ${i?.width ?? '?'} × ${i?.height ?? '?'} at ${i?.ppi ?? '?'} PPI, ${s.revisions.image} revision${s.revisions.image === 1 ? '' : 's'}.`,
      result: `The plate stays about 250 px wide and legible. The RGB estimate is 36 MB of the 100 MB image allowance. Your plate pixel read R ${s.image.picks.plate?.rgb[0] ?? '?'}, G ${s.image.picks.plate?.rgb[1] ?? '?'}, B ${s.image.picks.plate?.rgb[2] ?? '?'}.`,
      why: 'Pixels are the samples. Each is 3 bytes of RGB, so doubling width and height quadruples storage. Enlarging adds pixels, not information. PPI only sets print density.',
      expert: 'Next-level insight: 4000 × 3000 at 300 PPI prints at 13.33 × 10 inches. The 10 × 7.5 inch print needs 3000 × 2250 pixels, which the original covers.',
    },
    audio: {
      choice: `You captured once at ${(au?.captureRate ?? 0) / 1000} kHz, ${au?.captureBits ?? '?'}-bit, and kept a ${esc(au?.format ?? '')} master after ${s.audio.previews.length} reference previews.`,
      result: `Quiet speech and the buzzer are preserved within the audio allowance, at ${formatBytes(a.audio?.bytes ?? 0)}${au?.format === 'FLAC' ? ' (estimated)' : ''}.`,
      why: 'Sampling must run at least twice the highest frequency, so the 10 kHz buzzer needs more than 20 kHz. Quantisation depth protects quiet speech. Lossless keeps the captured samples.',
      expert: 'Next-level insight: an export cannot put back what capture missed, and lossless means the samples are recoverable, not that every feature of the analogue tape survived.',
    },
  };
  return cards[key];
}
const TABS = [['preservation', 'Preservation'], ['text', 'Text'], ['image', 'Image'], ['audio', 'Audio']];
function debriefView() {
  const s = app.s;
  if (!s.handover) return shell('Case record', '<h1>Handover not complete</h1><p class="lab-sub">Your feedback opens after the final handover is accepted.</p>');
  const tab = app.ui.debriefTab, c = feedback(tab), checks = strandChecks(s);
  const r = (app.ui.reflect ??= {answers: s.reflection.answers ?? [], note: s.reflection.note ?? ''});
  const total = storage(s.files);
  if (s.finished && !app.ui.showFeedback) return shell('Completion record', closure(total));
  return shell('Debrief', `<p class="eyebrow">Case record</p><h1>Case handover complete</h1><p class="lab-sub">Well done, ${esc(s.name)}. You processed and verified all three items for handover.</p>
  ${s.devAssisted ? '<p class="feedback warn"><strong>Developer-assisted run.</strong> Stages were skipped, so this record is not an assessment.</p>' : ''}
  <div class="debrief"><div><div class="d-tabs" role="tablist">${TABS.map(([k, t]) => `<button role="tab" aria-selected="${tab === k}" class="${tab === k ? 'on' : ''}" data-action="debrief:tab" data-key="${k}">${t}</button>`).join('')}</div>
  <div class="d-panel" role="tabpanel"><h2>Your choice</h2><p>${c.choice}</p><h2>What happened</h2><p>${esc(c.result)}</p><h2>Why</h2><p>${esc(c.why)}</p><h2>Expert path</h2><p>${esc(c.expert)}</p></div>
  <details class="lab-more"><summary>Strand checks</summary><div class="strands">${[['handling', 'Handling', 15], ['text', 'Text', 25], ['image', 'Image', 30], ['audio', 'Audio', 30]].map(([k, n, w]) => `<div class="strand"><strong>${n}</strong><small>${w}% of final score</small><ul>${checks[k].map(([l, ok]) => `<li>${ok ? '✓' : '○'} ${esc(l)}</li>`).join('')}</ul></div>`).join('')}</div></details>
  <p class="pending">Numeric scores are pending: the storyboard sets the strand weights and grade bands but no point-level rubric. Speed and revisions are not penalised.</p></div>
  <aside class="lab-card"><h2>Completion record</h2>${completionRows(total)}<button class="btn" data-action="record:log">Download processing log</button></aside></div>
  <details class="lab-more"><summary>Reflection (optional, not scored)</summary><div class="reflect">${QUESTIONS.map((q, i) => `<label class="lab-field"><span>${esc(q)}</span><textarea data-input="debrief:answer" data-i="${i}" aria-label="${esc(q)}">${esc(r.answers[i] ?? '')}</textarea></label>`).join('')}</div></details>
  <label class="lab-field"><span>Lesson-learned note (optional)</span><textarea data-input="debrief:note" aria-label="Lesson-learned note" maxlength="1500">${esc(r.note)}</textarea></label>
  <div class="lab-actions"><button class="btn primary" data-action="debrief:finish">Finish</button></div>`);
}
function completionRows(total) {
  const s = app.s, i = s.approved.image?.settings, au = s.approved.audio?.settings;
  return `<ul class="done-list"><li><strong>Text intact</strong><span>100% preserved in UTF-8.</span></li><li><strong>Plate legible</strong><span>${i?.width} × ${i?.height} at ${i?.ppi} PPI.</span></li><li><strong>Buzzer preserved</strong><span>${(au?.captureRate ?? 0) / 1000} kHz, ${au?.captureBits}-bit, lossless ${esc(au?.format ?? '')}.</span></li><li><strong>Originals unchanged</strong><span>Baseline hashes match; tape played once.</span></li><li><strong>Storage</strong><span>${formatBytes(total)} of 200 MB.</span></li></ul>`;
}
function closure(total) {
  const s = app.s;
  return `<p class="eyebrow">Closure record</p><h1>${esc(s.name)}</h1><p class="lab-sub">Digital Representation of Information: completed</p><section class="lab-card">${completionRows(total)}<p class="signed">Signed: Amina, Senior Forensic Analyst</p></section><p class="pending">Completion indicator for this learning simulation. It is not a professional certification.</p><div class="lab-actions"><button class="btn" data-action="record:log">Download processing log</button><button class="btn" data-action="debrief:reopen">Back to feedback</button></div>`;
}
registerPage({
  id: 'debrief', title: 'Digital Evidence Lab', icon: icons.record, url: () => `${LAB_URL}/complete`,
  view: debriefView,
  actions: {
    'debrief:tab': el => { app.ui.debriefTab = el.dataset.key; app.persist(); app.render(); },
    'debrief:finish': () => { app.ui.showFeedback = false; app.dispatch({type: 'REFLECT', answers: app.ui.reflect?.answers, note: app.ui.reflect?.note}); app.attempt({type: 'FINISH'}); },
    'debrief:reopen': () => { app.ui.showFeedback = true; app.render(); },
  },
  inputs: {
    'debrief:answer': el => { app.ui.reflect.answers[Number(el.dataset.i)] = el.value; },
    'debrief:note': el => { app.ui.reflect.note = el.value; },
  },
});
