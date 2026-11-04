import {app} from '../runtime.js';
import {esc, storyTime} from '../desktop/dom.js';
import {icons} from '../desktop/icons.js';
import {picture} from '../content/media.js';
import {registerPage} from './browser.js';
import {fileDialog} from '../desktop/filedialog.js';
import {COPY} from '../content/copy.js';
import {formatBytes} from '../core/domain.js';
import {openCase} from './case.js';

function card(m) {
  const c = m.card;
  if (!c) return '';
  if (c.type === 'bench') return `<button class="c-card" data-action="shell:equipment">${icons.bench}<span><strong>${esc(c.label)}</strong><small>Leave the computer and go to the workstation</small></span><em>Go</em></button>`;
  if (c.type === 'drive') return `<button class="c-card" data-action="chat:drive">${icons.drive}<span><strong>${esc(c.label)}</strong><small>Folder · Google Drive</small></span></button>`;
  if (c.type === 'meet') return `<button class="c-card" data-action="chat:meet" data-call="${c.call}">${icons.meet}<span><strong>${esc(c.label)}</strong><small>Google Meet · Ready to join</small></span><em>Join</em></button>`;
  if (c.type === 'record') return `<button class="c-card" data-action="chat:record" data-page="${c.page}">${icons.record}<span><strong>${esc(c.label)}</strong><small>Case processing record</small></span></button>`;
  if (c.type === 'case') return `<button class="c-card" data-action="chat:case" data-tab="${c.tab}">${icons.record}<span><strong>${esc(c.label)}</strong><small>Opens the Case Record window</small></span></button>`;
  return '';
}
function bubble(m, prev) {
  const mine = m.from === 'me';
  const sameRun = prev && prev.from === m.from && prev.at === m.at;
  return `<article class="msg-row ${mine ? 'mine' : ''}" data-key="m${m.id}">
   <div class="msg-av">${sameRun ? '' : mine ? `<span class="me-av">${esc(app.s.name[0] ?? '?')}</span>` : picture('aminaFace')}</div>
   <div class="msg-col">${sameRun ? '' : `<header><strong>${mine ? esc(app.s.name) : 'Amina Njoroge'}</strong><time>${storyTime(m.at)}</time></header>`}
   ${m.text ? `<p class="bubble">${esc(m.text)}</p>` : ''}
   ${m.attachment ? `<div class="c-card file">${icons.file}<span><strong>${esc(m.attachment.name)}</strong><small>Version ${m.attachment.version} · ${formatBytes(m.attachment.bytes)}</small></span></div>` : ''}
   ${card(m)}</div></article>`;
}

registerPage({
  id: 'chat', title: 'Google Chat', icon: icons.chat,
  url: () => 'https://chat.google.com/dm/amina-njoroge',
  view() {
    const {s, ui} = app;
    const c = ui.chat ?? {};
    const typing = s.review || s.outbox.length;
    return `<div class="gchat">
    <aside class="gchat-nav"><div class="gchat-logo">${picture('chatLogo')}<span>Chat</span></div>
     <h3>Direct messages</h3><button class="gc-dm on">${picture('aminaFace')}<span>Amina Njoroge</span></button></aside>
    <section class="gchat-main">
     <header class="gc-head">${picture('aminaFace')}<div><strong>Amina Njoroge</strong><small>Senior Forensic Analyst · Active</small></div></header>
     <div class="gc-log" role="log" aria-live="polite" aria-label="Conversation with Amina">
      <p class="gc-day">Today</p>
      ${s.messages.map((m, i) => bubble(m, s.messages[i - 1])).join('')}
      ${typing ? `<p class="gc-typing" role="status"><span class="dots"><i></i><i></i><i></i></span><span class="anim">Amina is typing…</span><span class="still">Reviewing…</span></p>` : ''}
     </div>
     ${c.attachment ? `<div class="gc-chip">${icons.file}<span>${esc(c.attachment.name)} · version ${c.attachment.version}</span><button data-action="chat:drop" aria-label="Remove attachment">×</button></div>` : ''}
     <div class="gc-compose"><button class="gc-clip" data-action="chat:attach" aria-label="Attach a saved file">${icons.clip}</button><input data-input="chat:draft" aria-label="Message Amina" placeholder="History is on" value="${esc(c.draft ?? '')}" data-key-enter="chat:send" autocomplete="off"><button class="gc-send" data-action="chat:send" aria-label="Send" ${s.review ? 'disabled' : ''}>${icons.send}</button></div>
    </section></div>`;
  },
  after(el) {
    const log = el.querySelector('.gc-log');
    if (log && log.dataset.count !== String(app.s.messages.length + (app.s.review ? .5 : 0))) { log.dataset.count = app.s.messages.length + (app.s.review ? .5 : 0); log.scrollTop = log.scrollHeight; }
    if (app.ui.active === 'browser' && (app.ui.unread || app.ui.toasts.some(t => !t.system))) { app.ui.unread = 0; app.ui.toasts = app.ui.toasts.filter(t => t.system); app.render(); }
  },
  actions: {
    'chat:drive': () => app.openPage('drive'),
    'chat:meet': el => app.openPage('meet', {call: el.dataset.call}),
    'chat:record': el => app.openPage(el.dataset.page),
    'chat:case': el => openCase(el.dataset.tab),
    'chat:drop': () => { app.ui.chat.attachment = null; app.render(); },
    'chat:attach': async () => {
      const path = await fileDialog({title: 'Open', mode: 'open'});
      if (!path) return;
      const f = app.s.files[path];
      (app.ui.chat ??= {}).attachment = {path, name: f.name, version: f.version};
      app.render();
    },
    'chat:send': () => {
      const c = (app.ui.chat ??= {});
      if (c.attachment) {
        const f = app.s.files[c.attachment.path];
        if (!f || f.version !== c.attachment.version) { c.attachment = null; app.guide(COPY.staleFile); app.render(); return; }
        if (app.attempt({type: 'SUBMIT', path: f.path, note: c.draft})) { c.attachment = null; c.draft = ''; }
      } else if (c.draft?.trim()) {
        if (app.attempt({type: 'CHAT', text: c.draft})) c.draft = '';
      } else {
        app.guide('Attach a saved file first, or type a message.');
      }
      app.render();
    },
  },
  inputs: {'chat:draft': el => { (app.ui.chat ??= {}).draft = el.value; }},
});
