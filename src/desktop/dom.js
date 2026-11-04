export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

const key = n => (n.nodeType === 1 ? n.getAttribute('data-key') : null);
const same = (a, b) => a.nodeType === b.nodeType && a.nodeName === b.nodeName && key(a) === key(b);

function patchAttributes(a, b) {
  for (const {name} of [...a.attributes]) if (!b.hasAttribute(name)) a.removeAttribute(name);
  for (const {name, value} of [...b.attributes]) if (a.getAttribute(name) !== value) a.setAttribute(name, value);
}
function patchNode(a, b) {
  if (a.nodeType === 3 || a.nodeType === 8) { if (a.data !== b.data) a.data = b.data; return; }
  if (a.hasAttribute('data-keep')) { for (const n of ['class', 'style', 'hidden']) { if (b.hasAttribute(n)) { if (a.getAttribute(n) !== b.getAttribute(n)) a.setAttribute(n, b.getAttribute(n)); } else a.removeAttribute(n); } return; }
  patchAttributes(a, b);
  if (a.nodeName === 'INPUT') {
    if (a.type === 'checkbox' || a.type === 'radio') a.checked = b.hasAttribute('checked');
    else if (document.activeElement !== a && a.value !== b.getAttribute('value')) a.value = b.getAttribute('value') ?? '';
    return;
  }
  if (a.nodeName === 'TEXTAREA') { if (document.activeElement !== a) a.value = b.textContent; return; }
  patchChildren(a, b);
  if (a.nodeName === 'SELECT') { const sel = b.querySelector('option[selected]'); if (sel) a.value = sel.value; }
}
function patchChildren(parent, next) {
  let a = parent.firstChild, b = next.firstChild;
  while (b) {
    const after = b.nextSibling;
    if (a && same(a, b)) { patchNode(a, b); a = a.nextSibling; }
    else {
      const k = b.nodeType === 1 ? key(b) : null;
      const found = k ? [...parent.children].find(c => key(c) === k) : null;
      if (found) { parent.insertBefore(found, a); patchNode(found, b); if (found === a) a = a.nextSibling; }
      else if (a && !k && !(a.nodeType === 1 && key(a))) {
        // Different element at this position: replace it instead of inserting, so a stale node cannot linger.
        const old = a; a = a.nextSibling; parent.replaceChild(b, old);
      }
      else parent.insertBefore(b, a);
    }
    b = after;
  }
  while (a) { const n = a.nextSibling; a.remove(); a = n; }
}
export function morph(el, html) {
  const t = document.createElement('template');
  t.innerHTML = html;
  patchChildren(el, t.content);
}
export const on = (root, type, selector, fn) => root.addEventListener(type, ev => { const t = ev.target.closest?.(selector); if (t && root.contains(t)) fn(t, ev); });
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const storyTime = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
export const reducedMotion = () => document.documentElement.classList.contains('reduce-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;

// Every app opens the same way: one calm statement of what it can see right now.
export const emptyState = (title, line) => `<div class="empty-state"><strong>${esc(title)}</strong><span>${esc(line)}</span></div>`;
