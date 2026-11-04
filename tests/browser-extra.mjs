// Second browser pass: layout sizes, keyboard route, pause during review, reload during capture, and the GLB hookup.
import {chromium} from 'playwright';
const URL = process.env.URL ?? 'http://127.0.0.1:4173';
const SHOTS = process.env.SHOTS;
const browser = await chromium.launch({headless: true, executablePath: process.env.CHROME || undefined, args: ['--autoplay-policy=no-user-gesture-required', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader']});
const errors = [], results = [];
const watchdog = setTimeout(() => { console.error('WATCHDOG: no finish after 420 s. Last stage:', stage); process.exit(2); }, 420000);
let stage = 'start';
const section = name => { stage = name; console.log(`-- ${name}`); };
const open = async (viewport = {width: 1366, height: 768}) => {
  const ctx = await browser.newContext({viewport});
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  return page;
};
const ok = (v, label) => { results.push(label); console.log(`${v ? 'ok' : 'FAIL'} - ${label}`); if (!v) throw Error(`FAILED: ${label}`); };
const state = p => p.evaluate(() => window.__app.s);
const toStage = async (p, stage) => {
  await p.goto(URL);
  await p.waitForFunction(() => window.__app);
  await p.evaluate(() => { window.__app.ui.dev = true; window.__app.renderNow(); });
  await p.locator('#dev-stage').selectOption(stage);
  await p.locator('[data-action="dev:seed"]').click();
  await p.waitForFunction(() => window.__app.s.devAssisted && !window.__app.s.outbox.length && window.__app.ui.mode === 'desktop');
  await p.evaluate(() => { window.__app.ui.dev = false; window.__app.setMode('desktop'); window.__app.render(); });
  await p.locator('#taskbar').waitFor();
};

section('sizes');
// Sizes: every primary control stays on screen and the page itself never scrolls.
for (const [w, h] of [[1920, 1080], [1366, 768], [1024, 640], [683, 384]]) {
  const p = await open({width: w, height: h});
  section(`size ${w} x ${h}`);
  await toStage(p, 'image');
  await p.locator('.tb-start').click();
  await p.locator('.start-grid [data-id="gimp"]').click();
  await p.locator('.gimp').waitFor();
  await p.waitForTimeout(250);
  const fits = await p.evaluate(() => {
    const wins = [...document.querySelectorAll('.win:not(.min)')].map(e => e.getBoundingClientRect());
    return {scroll: document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth, inside: wins.every(r => r.left >= 0 && r.top >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight - 47)};
  });
  ok(fits.scroll && fits.inside, `Layout holds at ${w} × ${h}`);
  if (SHOTS) await p.screenshot({path: `${SHOTS}/size-${w}.png`});
  await p.context().close();
}

section('keyboard');
// Keyboard: open a file in Notepad++ with no mouse.
{
  const p = await open();
  await toStage(p, 'text');
  await p.locator('.tb-start').focus();
  await p.keyboard.press('Enter');
  await p.locator('.start-grid [data-id="notepad"]').focus();
  await p.keyboard.press('Enter');
  await p.locator('.npp').waitFor();
  await p.locator('.npp-tools [data-action="np:open"]').focus();
  await p.keyboard.press('Enter');
  await p.locator('.file-dialog').waitFor();
  await p.waitForTimeout(80);
  await p.locator('.file-dialog tr[data-path$="witness_working.txt"]').focus();
  await p.keyboard.press('Enter');
  await p.waitForFunction(() => window.__app.ui.np.doc);
  ok(true, 'A file can be opened by keyboard alone');
  await p.keyboard.press('Control+f').catch(() => {});
  await p.context().close();
}

section('pause');
// Pause during a review: nothing fires, and resume delivers exactly once.
{
  const p = await open();
  await toStage(p, 'text');
  await p.evaluate(() => {
    const s = window.__app.s, path = Object.keys(s.files).find(k => k.endsWith('witness_working.txt'));
    window.__app.dispatch({type: 'SUBMIT', path});
    window.__app.setPaused(true);
  });
  const count = (await state(p)).messages.length;
  await p.waitForTimeout(3200);
  const held = await state(p);
  ok(held.review && held.messages.length === count, 'Pause holds a review with no background delivery');
  await p.locator('[data-action="pause:resume"]').click();
  await p.waitForFunction(n => window.__app.s.messages.length > n && !window.__app.s.review && !window.__app.s.outbox.length, count);
  ok((await state(p)).messages.length === count + 1, 'Resume delivers the reply once');
  await p.context().close();
}

section('reload during capture');
// Reload during capture: nothing is committed and Record works again.
{
  const p = await open();
  await toStage(p, 'audio');
  await p.evaluate(async () => {
    const a = window.__app;
    for (const part of ['tape', 'interface', 'headphones']) a.dispatch({type: 'HARDWARE', part});
  });
  await p.locator('.tb-start').click();
  await p.locator('.start-grid [data-id="audacity"]').click();
  await p.locator('.audacity').waitFor();
  await p.locator('.au-device select[data-input="au:device"]').selectOption('interface');
  await p.evaluate(() => {
    const a = window.__app;
    a.dispatch({type: 'AUDIO_SET', patch: {rate: 44100}}); a.dispatch({type: 'AUDIO_STEP'});
    a.dispatch({type: 'AUDIO_SET', patch: {bits: 16}}); a.dispatch({type: 'AUDIO_STEP'});
  });
  await p.locator('[data-action="au:record"]').click();
  await p.waitForFunction(() => window.__app.ui.aud.session?.recording);
  await p.waitForTimeout(800);
  await p.reload();
  await p.locator('.audacity').waitFor();
  let s = await state(p);
  ok(!s.audio.captured && s.tapePasses === 0, 'Reload during capture commits nothing');
  await p.locator('[data-action="au:record"]').click();
  await p.waitForFunction(() => window.__app.s.audio.captured, null, {timeout: 12000});
  ok((await state(p)).tapePasses === 1, 'Record still works after that reload, once');
  await p.context().close();
}

section('windows');
// It should behave like a Windows PC: nothing here freezes the rest of the screen.
{
  const p = await open();
  await toStage(p, 'text');
  await p.locator('.tb-start').click();
  await p.locator('.start-grid [data-id="notepad"]').click();
  await p.locator('.npp').waitFor();
  await p.locator('.npp-tools [data-action="np:open"]').click();
  await p.locator('.file-dialog').waitFor();
  await p.locator('[data-action="win:min"][data-win="notepad"]').click();
  await p.waitForFunction(() => document.querySelector('.modal-float').hidden);
  ok(!(await p.locator('.file-dialog').isVisible()), 'A dialog minimises with its window');
  await p.locator('[data-action="shell:task"][data-id="notepad"]').click();
  await p.locator('.file-dialog').waitFor();
  ok(true, 'It comes back when the window is restored');
  await p.locator('[data-action="shell:task"][data-id="browser"]').click();
  ok(await p.evaluate(() => window.__app.ui.active === 'browser'), 'Another app can be used while a dialog is open');
  await p.locator('[data-action="shell:task"][data-id="notepad"]').click();
  await p.locator('.file-dialog .btn:has-text("Cancel")').click();
  // Snap: drag a title bar to the left edge, then to the top.
  const bar = await p.locator('.win-notepad .win-title').boundingBox();
  await p.mouse.move(bar.x + 200, bar.y + 12);
  await p.mouse.down();
  await p.mouse.move(0, 200, {steps: 6});
  await p.mouse.up();
  await p.waitForTimeout(150);
  const half = await p.locator('.win-notepad').boundingBox();
  ok(half.x === 0 && Math.abs(half.width - 683) < 2, 'Dragging to the side fills half the screen');
  const top = await p.locator('.win-notepad .win-title').boundingBox();
  await p.mouse.move(top.x + 200, top.y + 12);
  await p.mouse.down();
  await p.mouse.move(500, 0, {steps: 6});
  await p.mouse.up();
  await p.waitForTimeout(150);
  ok(await p.evaluate(() => window.__app.ui.windows.find(w => w.id === 'notepad').max), 'Dragging to the top maximises');
  await p.locator('.show-desktop').click();
  await p.waitForTimeout(200);
  ok(await p.evaluate(() => window.__app.ui.windows.every(w => w.min)), 'Show desktop minimises everything');
  await p.locator('.show-desktop').click();
  await p.waitForTimeout(200);
  ok(await p.evaluate(() => window.__app.ui.windows.some(w => !w.min)), 'Pressing it again brings them back');
  await p.locator('.win-notepad .win-title').click({button: 'right', position: {x: 200, y: 10}});
  await p.locator('.ctx button:has-text("Minimise")').click();
  await p.waitForTimeout(150);
  ok(await p.evaluate(() => window.__app.ui.windows.find(w => w.id === 'notepad').min), 'Right-click menus work');
  await p.context().close();
}

section('gimp reload');
// GIMP comes back with its file after a reload.
{
  const p = await open();
  await toStage(p, 'image');
  await p.locator('.tb-start').click();
  await p.locator('.start-grid [data-id="gimp"]').click();
  await p.locator('.gimp').waitFor();
  await p.locator('.gimp [data-action="menu:toggle"][data-name="File"]').click();
  await p.locator('.dropdown [data-action="gi:open"]').click();
  await p.locator('.file-dialog .row', {hasText: 'cctv_working.jpg'}).click();
  await p.locator('.file-dialog [data-m="confirm"]').click();
  await p.locator('.gi-layer').waitFor();
  await p.reload();
  await p.locator('.gi-layer').waitFor({timeout: 8000});
  ok(true, 'GIMP reopens its image after a reload');
  if (SHOTS) await p.screenshot({path: `${SHOTS}/gimp-full.png`});
  await p.context().close();
}

section('watch how');
// A learner who is really stuck, here refused twice, is offered a short vector demo of the step.
{
  const p = await open();
  await toStage(p, 'image');
  ok(!(await p.locator('.tip-watch').count()), 'No demo is offered before the learner is stuck');
  for (let i = 0; i < 2; i++) {
    await p.evaluate(() => window.__app.guide('Open the working photograph in GIMP first.'));
    await p.locator('.modal.cd .btn').first().click();
  }
  await p.locator('.tip-watch').waitFor({timeout: 5000});
  ok(true, 'Two refused attempts offer Watch how it’s done');
  await p.locator('.tip-watch').click();
  await p.locator('.modal.demo .dm-stage').waitFor();
  await p.waitForFunction(() => [...document.querySelectorAll('.dm-stage text')].some(t => t.textContent === 'GIMP'), null, {timeout: 8000});
  ok(true, 'The demo opens and draws the step in GIMP');
  await p.locator('.modal.demo [data-m="close"]').click();
  ok(!(await p.locator('.modal.demo').count()), 'Got it closes the demo');
  await p.context().close();
}

clearTimeout(watchdog);
await browser.close();
if (errors.length) { console.error(errors); process.exit(1); }
console.log('Extra checks passed.');
