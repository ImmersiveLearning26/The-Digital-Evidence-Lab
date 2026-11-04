// The lab's own training window. Everything that is a custom exercise lives here, never inside the native apps.
import {app} from '../runtime.js';
import {icons} from '../desktop/icons.js';
import {openWindow, registerApp} from '../desktop/wm.js';
import {lockReason} from '../core/state.js';
import {caseSummary} from './meet.js';

const tabs = {};
export const registerCaseTab = tab => { tabs[tab.id] = tab; if (tab.actions) app.register(tab.actions, tab.inputs); };
export function openCase(tab) { if (tab) app.ui.caseTab = tab; openWindow('case'); }
const ORDER = [['summary', 'Case'], ['text', 'Text'], ['image', 'Image'], ['audio', 'Audio']];
const released = () => ORDER.filter(([k]) => k === 'summary' || !lockReason(app.s, k));

registerApp({
  id: 'case', title: 'Case Record', icon: icons.record, rect: {x: .715, y: .012, w: .278, h: .85},
  windowTitle: () => 'Case Record – DELab',
  view() {
    const list = released();
    const id = list.some(([k]) => k === app.ui.caseTab) ? app.ui.caseTab : list.at(-1)[0];
    const body = id === 'summary' ? `<div class="cr-pad">${app.s.name ? caseSummary() : ''}</div>` : tabs[id].view();
    return `<div class="caserec"><nav class="cr-tabs" role="tablist">${list.map(([k, t]) => `<button role="tab" aria-selected="${id === k}" class="${id === k ? 'on' : ''}" data-action="case:tab" data-tab="${k}">${t}</button>`).join('')}</nav><div class="cr-scroll">${body}</div></div>`;
  },
  after(el) { if (released().some(([k]) => k === app.ui.caseTab)) tabs[app.ui.caseTab]?.after?.(el); },
  actions: {'case:tab': el => { app.ui.caseTab = el.dataset.tab; app.persist(); app.render(); }},
});
