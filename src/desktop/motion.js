// Motion that makes progress and success feel good: a glowing ring that fills around a live number, and a
// short celebration when a milestone lands. Both still read correctly with motion reduced.
import {app} from '../runtime.js';
import {esc, reducedMotion} from './dom.js';

export const ring = (pct, label, sub = '') => `<div class="ring" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}" aria-label="${esc(label)}">
  <svg viewBox="0 0 120 120" aria-hidden="true"><defs><linearGradient id="ring-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5ad1ff"/><stop offset="1" stop-color="#7b5cff"/></linearGradient></defs>
  <circle class="ring-track" cx="60" cy="60" r="50"/><circle class="ring-fill" cx="60" cy="60" r="50" pathLength="100" style="stroke-dashoffset:${100 - pct}"/></svg>
  <div class="ring-num"><b>${Math.round(pct)}</b><small>%</small></div><p class="ring-label">${esc(label)}</p>${sub ? `<p class="ring-sub">${esc(sub)}</p>` : ''}</div>`;

// Milestones, in the order a case reaches them.
const MILESTONES = [
  [s => s.intake, 'Intake logged'], [s => s.acquisition?.verified, 'Image verified'], [s => s.copies, 'Working copies ready'],
  [s => s.approved.text, 'Text approved'], [s => s.approved.image, 'Photograph approved'], [s => s.approved.audio, 'Recording approved'],
  [s => s.handover, 'Handover complete'],
];
let seen = null;
const queue = [];
export function watchMilestones() {
  const now = MILESTONES.map(([test]) => !!test(app.s));
  // Real play reaches one milestone at a time; several at once is a restore or a jump, with nothing to celebrate.
  const fresh = seen ? MILESTONES.filter((m, i) => now[i] && !seen[i]).map(([, label]) => label) : [];
  if (fresh.length === 1) queue.push(fresh[0]);
  seen = now;
  if (queue.length && app.ui.mode === 'desktop' && !document.querySelector('.celebrate')) celebrate(queue.shift());
}
function celebrate(label) {
  const host = document.getElementById('session');
  if (!host) return;
  const el = document.createElement('div');
  el.className = 'celebrate';
  el.setAttribute('role', 'status');
  el.innerHTML = `<div class="cb-orb"><svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="26" pathLength="1"/><path d="M20 33l8 8 16-17" pathLength="1"/></svg>${Array.from({length: 10}, (_, i) => `<i style="--a:${i * 36}deg"></i>`).join('')}</div><p>${esc(label)}</p>`;
  host.append(el);
  app.audio.tone?.(880, .08);
  app.think?.('yes');
  app.clock.after(reducedMotion() ? 1400 : 2100, () => { el.remove(); watchMilestones(); });
}
