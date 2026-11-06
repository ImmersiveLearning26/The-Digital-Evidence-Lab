// A robot first-time learner. It knows nothing about the apps: it only clicks what the guidance marks.
// It makes decisions only where the glow marks a whole set of options, which is the learner's own thinking.
// If guidance has a gap anywhere, this stops and names the step.
import {chromium} from 'playwright';
const URL = process.env.URL ?? 'http://127.0.0.1:4173';
const browser = await chromium.launch({headless: true, executablePath: process.env.CHROME || undefined, args: ['--autoplay-policy=no-user-gesture-required', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader']});
const [width, height] = (process.env.SIZE ?? '1366x768').split('x').map(Number);
const page = await (await browser.newContext({viewport: {width, height}})).newPage();
page.setDefaultTimeout(20000);
const errors = [];
page.on('pageerror', e => errors.push(e.message));
const watchdog = setTimeout(() => { console.error('WATCHDOG'); process.exit(2); }, 580000);
const state = () => page.evaluate(() => window.__app.s);
const task = () => page.evaluate(() => { const b = document.querySelector('.tip-text'); return {tip: b?.textContent ?? null}; });

await page.goto(URL);
await page.waitForFunction(() => window.__app?.sceneState !== 'loading', null, {timeout: 60000});
const bench = async () => {
  for (let i = 0; i < 12; i++) {
    await page.locator('#eq-pointer:not([hidden])').waitFor({timeout: 40000});
    const part = await page.locator('#eq-pointer').getAttribute('data-part');
    console.log('  bench:', part);
    await page.locator('#eq-pointer').click({force: true});
    if (part === 'use') { await page.waitForFunction(() => window.__app.ui.mode === 'desktop', null, {timeout: 60000}); return; }
    await page.waitForFunction(p => (p === 'power' || p === 'start' ? window.__app.s.powered : window.__app.s.hardware[p]), part, {timeout: 40000});
    await page.waitForTimeout(300);
  }
};
await bench();
await page.locator('#login-name').fill('First Timer');
await page.keyboard.press('Enter');
await page.waitForFunction(() => window.__app.s.name);

let clicks = 0, idle = 0, last = '', repeats = 0;
const seen = {};
for (; clicks < 260; ) {
  const s = await state();
  if (s.finished) break;
  // A real learner reads and reacts. Give Amina's replies time to land.
  await page.waitForTimeout(120);
  const look = await page.evaluate(() => {
    const el = window.__app.guideTarget();
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {tag: el.tagName, cls: el.className?.toString?.().slice(0, 40), action: el.dataset.action ?? el.dataset.m ?? '', part: el.dataset.part ?? el.dataset.id ?? el.dataset.kind ?? '', text: el.textContent.trim().slice(0, 40), x: r.left + r.width / 2, y: r.top + Math.min(r.height / 2, 30), reps: !!el.matches('.reps'), rank: !!el.matches('.rank-row'), radios: !!el.matches('.radios'), match: !!el.matches('.match'), ab: !!el.matches('.ab-row'), table: !!el.matches('.lab-table'), row: el.tagName === 'TR', dropdown: !!el.matches('.dropdown'), exgrid: !!el.matches('.ex-grid'), exwhy: !!el.matches('.ex-why'), ausetup: !!el.matches('.au-setup'), select: el.tagName === 'SELECT', input: el.tagName === 'INPUT'};
  });
  const busy = await page.evaluate(() => window.__app.busyAudio || window.__app.s.review || window.__app.s.outbox.length || window.__app.switching || document.querySelector('.modal[aria-label="Creating Image..."]'));
  if (await page.locator('.meet-reply').count()) { await page.locator('.meet-reply').first().click(); await page.waitForTimeout(600); continue; }
  // The call may end on its own between seeing Skip and pressing it.
  if (await page.locator('[data-action="meet:skip"]').count() && busy) { await page.locator('[data-action="meet:skip"]').click({timeout: 2000}).catch(() => {}); continue; }
  if (await page.locator('[data-action="meet:back"]').count()) { await page.locator('[data-action="meet:back"]').click({timeout: 2000}).catch(() => {}); continue; }
  if (busy) { await page.waitForTimeout(400); continue; }
  if (await page.locator('.modal[aria-label="Drive/Image Verify Results"]').count()) { await page.locator('.modal[aria-label="Drive/Image Verify Results"] .btn').click(); continue; }
  if (await page.locator('.modal[aria-label="Case guidance"]').count()) { console.log('  guidance dialog:', (await page.locator('.modal[aria-label="Case guidance"]').textContent()).slice(0, 90)); await page.locator('.modal[aria-label="Case guidance"] .btn').last().click(); continue; }
  if (await page.locator('.eq-bar').isVisible().catch(() => false)) { await bench(); continue; }
  if (!look) {
    if (++idle > 12) { console.log('STUCK: nothing to glow at', JSON.stringify((await task()))); process.exitCode = 1; break; }
    await page.waitForTimeout(300);
    continue;
  }
  idle = 0;
  const key = `${look.action || look.cls}|${look.part}|${look.tag}`;
  repeats = key === last ? repeats + 1 : 0;
  last = key;
  const tip = (await task()).tip;
  seen[tip + key] = (seen[tip + key] ?? 0) + 1;
  if (repeats >= 6 || seen[tip + key] >= 9) {
    console.log(`STUCK: the glow keeps marking ${key} at "${(await task()).tip}"`);
    console.log(await page.evaluate(() => JSON.stringify({ui: window.__app.ui.textCase, front: window.__app.ui.active, buttons: [...document.querySelectorAll('.win[data-win="case"] .btn')].map(b => { const r = b.getBoundingClientRect(), hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return {text: b.textContent, disabled: b.disabled, top: Math.round(r.top), bottom: Math.round(r.bottom), hit: hit && `${hit.tagName}.${hit.className}`}; })})));
    await page.screenshot({path: process.env.SHOT ?? 'stuck.png'});
    process.exitCode = 1;
    break;
  }
  console.log(`${String(++clicks).padStart(3)} ${(await task()).tip ?? ''} -> ${look.action || look.cls || look.tag} ${look.part} ${look.text.slice(0, 26)}`);
  if (look.reps) { await page.locator('input[value="UTF-8"]').check(); }
  else if (look.exgrid) {
    for (const sel of ['[data-m="dim"][data-w="4000"]', '[data-m="ppi"][data-ppi="300"]', '.ex-why button']) await page.locator(`.modal ${sel}`).first().click();
  } else if (look.exwhy) { await page.locator('.modal .ex-why button').first().click(); }
  else if (look.ausetup) {
    for (const [k, v] of [['rate', 44100], ['bits', 16]]) await page.locator(`[data-action="au:set"][data-key="${k}"][data-v="${v}"]`).click();
  } else if (look.dropdown) { await page.locator('.npp .dropdown [role="menuitem"]', {hasText: /^.?UTF-8$/}).click(); }
  else if (look.rank) { for (const [i, v] of ['audio', 'text', 'image'].entries()) await page.locator(`select[data-i="${i}"]`).selectOption(v); }
  else if (look.radios) { await page.locator('input[value="preserve"]').check(); }
  else if (look.match) {
    const rgb = s.image.picks.plate.rgb;
    for (const i of [0, 1, 2]) await page.locator(`input[data-input="ic:rgb"][data-i="${i}"]`).evaluate((el, v) => { el.value = v; el.dispatchEvent(new Event('input', {bubbles: true})); }, rgb[i]);
    await page.locator('[data-action="ic:match"]').click();
  } else if (look.ab) {
    await page.locator('[data-action="ac:play"]').first().click();
    await page.waitForTimeout(300);
    await page.locator('[data-action="ac:play"]').first().click();
    await page.locator('[data-action="ac:play"]').nth(1).click();
    await page.waitForTimeout(300);
    await page.locator('[data-action="ac:play"]').nth(1).click();
  } else if (look.table) {
    for (const [k, v] of [['text', 'readable'], ['image', 'sufficient'], ['audio', 'suitable'], ['originals', 'unchanged'], ['allocation', 'within']]) await page.locator(`select[data-key="${k}"]`).selectOption(v);
  } else if (look.select) {
    await page.locator('.au-device select[data-input="au:device"]').selectOption('interface');
  } else if (look.input) {
    await page.locator('.modal[aria-label="Set Image Print Resolution"] input').fill('300');
    await page.locator('.modal[aria-label="Set Image Print Resolution"] [data-m="ok"]').click();
  } else {
    if (look.action === 'ac:confirm') {
      const a = s.audio;
      if (a.step === 0) await page.locator('[data-input="ac:set"][data-key="rate"]').selectOption('44100');
      if (a.step === 1) await page.locator('[data-input="ac:set"][data-key="bits"]').selectOption('16');
      if (a.step === 2) await page.locator('[data-input="ac:set"][data-key="format"]').selectOption('FLAC');
    }
    if (look.action === 'ic:next' && s.image.rationale === '') await page.waitForTimeout(10);
    await page.mouse.click(look.x, look.y);
    if (look.row) await page.waitForTimeout(150);
  }
  // Short written reasons are the learner's own, so the robot supplies them when the box is on screen.
  for (const why of ['ic:why', 'ac:why']) { const box = page.locator(`[data-input="${why}"]`); if (await box.count() && !(await box.inputValue())) await box.fill('Keeps what the task needs inside the budget.'); }
  await page.waitForTimeout(250);
}
const s = await state();
clearTimeout(watchdog);
console.log(JSON.stringify({clicks, finished: s.finished, handover: !!s.handover, approved: Object.values(s.approved).map(a => a?.path.split('\\').pop()), errors}));
await browser.close();
if (!s.finished) { console.error('The glow alone did not reach the end of the case.'); process.exit(1); }
console.log('A first-timer following only the guidance finished the case.');
