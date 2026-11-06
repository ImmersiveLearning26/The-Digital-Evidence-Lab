// Amina's two calls. Each turn is one recording; at some turns she asks and the learner answers.
// Captions follow the audio's own clock. If audio fails, the same turns run on the pausable clock and
// the transcript stays available, so a call is never silently marked as heard.
import {app} from '../runtime.js';
import {esc} from '../desktop/dom.js';
import {icons} from '../desktop/icons.js';
import {picture} from '../content/media.js';
import {registerPage} from './browser.js';
import {closeWindow} from '../desktop/wm.js';
import {CALLS} from '../content/calls.js';
import {CASE_ID} from '../core/domain.js';

let manifest = null, player = null, timer = null, analyser = null, meterFrame = null;
const loadManifest = async () => (manifest ??= await fetch('assets/media/voice/manifest.json').then(r => r.json()).catch(() => ({calls: {}})));
const m = () => app.ui.meet;
const call = () => CALLS[m().call ?? 'briefing'];

export function caseSummary() {
  return `<div class="summary"><p class="sum-eyebrow">The Digital Evidence Lab</p><h2>${esc(app.s.name)}</h2><dl>
   <dt>Role</dt><dd>Junior Digital Forensics and Data Processing Engineer</dd><dt>Case</dt><dd>${CASE_ID}, suspected mobile-money fraud ring</dd>
   <dt>Goal</dt><dd>Digitise, process and store three evidence items without losing essential information, inside a limited storage allocation.</dd>
   <dt>Plan</dt><dd>Prepare, text, image, sound, hand over.</dd></dl>
   <p>You will be scored on evidence handling, text, image and audio decisions. Speed is not scored.</p><p class="sum-note">Fictional scenario for learning purposes.</p></div>`;
}

// The rings follow how loud she actually is, as a camera-off speaker does in Meet.
function startMeter(audio) {
  const ctx = app.audio.ctx;
  if (!ctx) return;
  try {
    const source = ctx.createMediaElementSource(audio);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    analyser.connect(app.audio.master);
  } catch { analyser = null; return; }
  const data = new Uint8Array(analyser.fftSize);
  let level = 0;
  const tick = () => {
    if (!analyser) return;
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (const v of data) sum += ((v - 128) / 128) ** 2;
    const now = Math.min(1, Math.sqrt(sum / data.length) * 5);
    level += (now - level) * (now > level ? .45 : .14);
    document.documentElement.style.setProperty('--voice', level.toFixed(3));
    meterFrame = requestAnimationFrame(tick);
  };
  tick();
}
function stopMeter() {
  cancelAnimationFrame(meterFrame);
  analyser = null;
  document.documentElement.style.setProperty('--voice', 0);
}
function stop() {
  stopMeter();
  if (player) { player.pause(); app.audio.unregister(player); player.src = ''; player = null; }
  if (timer) { app.clock.cancel(timer); timer = null; }
}
function hangUp() {
  stop();
  m().speaking = false;
  m().asking = null;
  m().you = null;
  app.busyAudio = false;
}
function finish(skipped) {
  hangUp();
  m().phase = 'ended';
  m().skipped = skipped;
  app.attempt({type: m().call === 'briefing' ? 'BRIEF' : 'CLOSING', skipped});
  app.render();
}
function say(text) { m().said = [...(m().said ?? []), {who: 'amina', text}]; }
function afterTurn(node) {
  m().speaking = false;
  if (node.ask) { m().asking = node.ask; app.render(); requestAnimationFrame(() => document.querySelector('.meet-reply')?.focus()); return; }
  if (!node.next) return finish(false);
  timer = app.clock.after(380, () => { timer = null; playTurn(node.next); });
}
function showLine(cue) {
  if (m().line === cue.text) return;
  m().line = cue.text;
  say(cue.text);
  app.render();
}
// Without audio the same words run on the clock, at about a speaking pace.
function timedTurn(node) {
  let i = 0;
  const next = () => {
    if (i >= node.lines.length) return afterTurn(node);
    showLine({text: node.lines[i]});
    const wait = node.lines[i++].length * 62;
    timer = app.clock.after(wait, next);
  };
  m().speaking = true;
  next();
}
async function playTurn(id) {
  stop();
  await app.audio.unlock();
  await loadManifest();
  const node = call().nodes[id], data = manifest.calls?.[m().call]?.[id];
  Object.assign(m(), {node: id, asking: null, final: manifest.final});
  app.busyAudio = true;
  if (!data) return timedTurn(node);
  const audio = new Audio(data.file);
  player = audio;
  app.audio.register(audio);
  const fail = () => { if (player === audio) { stop(); timedTurn(node); } };
  audio.addEventListener('timeupdate', () => {
    if (player !== audio) return;
    const cue = data.cues.find(c => audio.currentTime < c.end) ?? data.cues.at(-1);
    showLine(cue);
  });
  audio.addEventListener('playing', () => { if (player === audio) { m().speaking = true; app.render(); } });
  audio.addEventListener('ended', () => { if (player === audio) { stop(); afterTurn(node); } });
  audio.addEventListener('error', fail);
  startMeter(audio);
  if (app.ui.paused) return;
  audio.play().catch(fail);
}
function begin() {
  stop();
  Object.assign(m(), {phase: 'incall', said: [], line: null, asking: null, you: null, skipped: false});
  app.render();
  playTurn(call().start);
}

// The route through the call when the learner skips, so the transcript is still complete.
function fullRoute() {
  const out = [];
  let id = call().start;
  while (id) {
    const node = call().nodes[id];
    node.lines.forEach(text => out.push({who: 'amina', text}));
    id = node.ask ? node.ask[0].next : node.next;
  }
  return out;
}
const transcript = list => `<ol class="meet-log">${list.map(l => `<li class="${l.who}"><strong>${l.who === 'amina' ? 'Amina' : 'You'}</strong> ${esc(l.text)}</li>`).join('')}</ol>`;

function prejoin() {
  return `<div class="meet-pre"><div class="pre-left"><div class="pre-cam"><span class="me-av big">${esc(app.s.name[0] ?? '?')}</span><p>Camera is off</p><div class="pre-ctl"><span class="roundoff" title="Microphone muted">${icons.mic}</span><span class="roundoff" title="Camera off">${icons.camera}</span></div></div></div>
  <div class="pre-right"><h1>Ready to join?</h1><p>${esc(call().title)}</p><p class="pre-sub">Amina Njoroge is in this call</p><button class="btn meet-join" data-action="meet:join">Join now</button></div></div>`;
}
function incall() {
  const captions = app.ui.settings.captions, st = m();
  return `<div class="meet-call ${st.transcript ? 'with-side' : ''}"><div class="meet-stage">
    <div class="meet-tile ${st.speaking ? 'talking' : ''}"><div class="meet-avatar"><i class="ring one"></i><i class="ring two"></i>${picture('aminaAvatar')}</div><span class="meet-name">Amina Njoroge</span>
    ${st.you ? `<p class="meet-cap you">You: ${esc(st.you)}</p>` : captions && st.line ? `<p class="meet-cap" aria-live="polite">${esc(st.line)}</p>` : ''}
    ${st.asking ? `<div class="meet-replies" role="group" aria-label="Reply to Amina">${st.asking.map((a, i) => `<button class="meet-reply" data-action="meet:reply" data-i="${i}">${esc(a.label)}</button>`).join('')}</div>` : ''}</div>
    <div class="meet-you"><span class="me-av">${esc(app.s.name[0] ?? '?')}</span><small>You</small></div></div>
   ${st.transcript ? `<aside class="meet-side"><h2>Transcript</h2>${transcript(st.said ?? [])}${st.final ? '' : '<p class="sum-note">Some of this call has no recording yet.</p>'}</aside>` : ''}
   <footer class="meet-bar"><span class="meet-label">${esc(call().title)}</span><div class="meet-ctl">
    <button class="round ${captions ? 'on' : ''}" data-action="shell:toggle" data-key="captions" aria-pressed="${captions}" aria-label="Captions">${icons.cc}</button>
    <button class="round ${st.transcript ? 'on' : ''}" data-action="meet:transcript" aria-pressed="${!!st.transcript}" aria-label="Transcript">${icons.transcript}</button>
    <button class="pill" data-action="meet:skip">Skip</button>
    <button class="round leave" data-action="meet:leave" aria-label="Leave call">${icons.phone}</button></div></footer></div>`;
}
function ended() {
  const list = m().skipped ? fullRoute() : (m().said ?? []);
  return `<div class="meet-end"><h1>You left the meeting</h1><p>${m().skipped ? 'You skipped ahead. Everything Amina covers is in the transcript.' : 'Thanks for joining.'}</p>
  <div class="row-gap"><button class="btn" data-action="meet:replay">Rejoin</button><button class="btn primary" data-action="meet:back">Back to Chat</button></div>
  <details class="meet-tr" ${m().skipped ? 'open' : ''}><summary>Transcript</summary>${transcript(list)}</details></div>`;
}

registerPage({
  id: 'meet', title: 'Meet', icon: icons.meet,
  tabTitle: () => `Meet – ${call().title}`,
  url: () => `https://call.evidencelab.example/${call().code}`,
  onOpen({call: id}) {
    if (id && id !== m().call) { hangUp(); Object.assign(m(), {call: id, phase: 'prejoin', said: [], line: null}); }
    m().call ??= 'briefing';
    if (m().phase === 'incall' && !player && !timer && !m().asking) m().phase = 'prejoin';
  },
  onClose() { if (m().phase === 'incall') { hangUp(); m().phase = 'prejoin'; } },
  view: () => `<div class="gmeet">${m().phase === 'incall' ? incall() : m().phase === 'ended' ? ended() : prejoin()}</div>`,
  actions: {
    'meet:join': begin,
    'meet:replay': begin,
    'meet:reply': el => {
      const st = m(), answer = st.asking?.[Number(el.dataset.i)];
      if (!answer) return;
      st.said = [...(st.said ?? []), {who: 'me', text: answer.label}];
      st.asking = null;
      st.you = answer.label;
      st.line = null;
      app.render();
      timer = app.clock.after(750, () => { timer = null; st.you = null; playTurn(answer.next); });
    },
    'meet:skip': () => finish(true),
    'meet:leave': () => { hangUp(); m().phase = 'prejoin'; app.status('browser', 'You left before the end. Your invitation still works.'); app.render(); },
    'meet:transcript': () => { m().transcript = !m().transcript; app.render(); },
    // Leaving the call closes its page; the conversation carries on in the chat panel.
    'meet:back': () => {
      const b = app.ui.browser;
      b.tabs = b.tabs.filter(t => t !== 'meet');
      if (b.active === 'meet') b.active = b.tabs.at(-1) ?? null;
      if (!b.active) closeWindow('browser');
      app.openDock();
    },
  },
});
app.skipMedia = () => { if (m().phase === 'incall') finish(true); };
