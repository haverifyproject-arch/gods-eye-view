import puppeteer from 'puppeteer';
import { mkdir, writeFile } from 'node:fs/promises';
const out = process.env.QA_OUTPUT_DIR || 'artifacts/native-internet';
await mkdir(out, { recursive: true });
const report = { checks: [], errors: [], responses: [] };
const check = (name, passed, detail) => {
  report.checks.push({ name, passed, detail });
  console.log(passed ? 'PASS' : 'FAIL', name);
};
const browser = await puppeteer.launch({
  headless: true,
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
  ],
});
const page = await browser.newPage();
let recording;
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
page.on('pageerror', (e) => report.errors.push(e.message));
page.on('response', (r) => {
  if (r.url().includes('ioda'))
    report.responses.push({ url: r.url(), status: r.status() });
});
try {
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(
    'http://127.0.0.1:4180/?welcome=0#lat=10&lon=10&alt=18000000&pitch=-90&style=normal',
    { waitUntil: 'domcontentloaded', timeout: 90000 },
  );
  await page.waitForFunction(() => window.__godsEyeView?.worldDebug, {
    timeout: 90000,
  });
  await page.waitForFunction(
    () =>
      getComputedStyle(document.querySelector('#loading-screen')).opacity ===
        '0' ||
      document.querySelector('#loading-screen').style.display === 'none',
    { timeout: 60000 },
  );
  await page.click('#data-panel .panel-collapse-btn');
  await page.click('[data-layer-id="internet-health"] .data-toggle-btn');
  await page.waitForFunction(
    () =>
      window.__godsEyeView.dataManager.layers
        .get('internet-health')
        .module.getDebugRecords().length > 0,
    { timeout: 90000 },
  );
  await page.click('#data-panel .panel-collapse-btn');
  if (process.env.QA_RECORD === '1')
    recording = await page.screencast({
      path: out + '/native-investigation.webm',
      fps: 5,
      scale: 0.75,
      quality: 35,
      ffmpegPath: process.env.QA_FFMPEG_PATH,
    });
  report.layer = await page.evaluate(() => {
    const m =
      window.__godsEyeView.dataManager.layers.get('internet-health').module;
    return {
      stats: m.getStats(),
      records: m.getDebugRecords().map(({ geometry, ...r }) => r),
    };
  });
  check(
    'Live IODA returned mapped country records',
    report.layer.records.length > 0,
    report.layer.stats,
  );
  await page.screenshot({ path: out + '/01-world.png' });
  if (recording) await pause(6000);
  await page.click('[data-debug-action="another"]');
  await page.waitForFunction(
    () => !!window.__godsEyeView.viewer.selectedEntity,
    { timeout: 30000 },
  );
  await new Promise((r) => setTimeout(r, 3000));
  report.selected = await page.evaluate(() =>
    window.__godsEyeView.worldDebug.getState(),
  );
  await page.click('#world-debug-details');
  await page.click('[data-debug-action="sources"]');
  report.source = await page.evaluate(
    () => window.__godsEyeView.worldDebug.getState().inspected,
  );
  check(
    'Selected current source available before debug',
    report.source.provenance.length > 0,
    report.source,
  );
  await page.screenshot({ path: out + '/02-source.png' });
  if (recording) await pause(8000);
  await page.click('#world-debug-close');
  const pick = await page.evaluate(() => {
    const v = window.__godsEyeView.viewer;
    const c = v.scene.canvas;
    const target = v.selectedEntity;
    let found = null;
    for (let y = 150; y < c.clientHeight - 180 && !found; y += 20)
      for (let x = 350; x < c.clientWidth - 350; x += 20) {
        const p = v.scene.pick({ x, y });
        if (p?.id?.__internetHealthId) {
          found = { x, y, id: p.id.__internetHealthId };
          break;
        }
      }
    v.selectedEntity = undefined;
    return found;
  });
  if (pick) {
    await page.mouse.click(pick.x, pick.y);
    await new Promise((r) => setTimeout(r, 300));
  }
  check(
    'Actual scene polygon pointer click selects native record',
    await page.evaluate(
      () => !!window.__godsEyeView.viewer.selectedEntity?.__internetHealthId,
    ),
    pick,
  );
  await page.click('[data-debug-action="debug"]');
  await page.waitForFunction(
    () => window.__godsEyeView.worldDebug.getState().status !== 'loading',
    { timeout: 90000 },
  );
  report.debug = await page.evaluate(() =>
    window.__godsEyeView.worldDebug.getState(),
  );
  check(
    'Investigation reaches ready with native relationships',
    report.debug.status === 'ready' && report.debug.relationships.length > 0,
    {
      status: report.debug.status,
      count: report.debug.relationships.length,
      errors: report.debug.errors,
    },
  );
  await page.screenshot({ path: out + '/03-debug.png' });
  if (recording) await pause(6000);
  await page.click('#world-debug-close');
  const label = await page.$('.gev-anno[role="button"]');
  if (label) await label.click();
  check(
    'World annotation opens its exact relationship source',
    await page.evaluate(
      () => !!window.__godsEyeView.worldDebug.getState().inspected?.kind,
    ),
  );
  await page.screenshot({ path: out + '/05-world-source.png' });
  if (recording) await pause(6000);
  await page.select('#world-debug-filter', 'observed');
  check(
    'Observations filter hides reference marks',
    await page.evaluate(() =>
      window.__godsEyeView.worldDebug
        .getState()
        .relationships.filter((r) => r.state === 'CURRENT_REFERENCE')
        .every((r) => !r.visible),
    ),
  );
  await page.screenshot({ path: out + '/04-observed.png' });
  check(
    'Hidden reference labels removed from pickable DOM',
    await page.evaluate(
      () =>
        ![...document.querySelectorAll('.gev-anno[role="button"]')].some((e) =>
          e.textContent.includes('REF'),
        ),
    ),
  );
  if (recording) await pause(5000);
  await page.select('#world-debug-filter', 'all');
  await page.click('[data-debug-action="follow"]');
  if (recording) await pause(5000);
  else await pause(700);
  await page.mouse.move(700, 400);
  await page.mouse.down();
  await page.mouse.move(850, 420, { steps: 12 });
  await page.mouse.up();
  const afterDrag = await page.evaluate(() => {
    const p = window.__godsEyeView.viewer.camera.positionCartographic;
    return [p.longitude, p.latitude, p.height];
  });
  await pause(1200);
  report.followInterrupted = {
    afterDrag,
    afterWait: await page.evaluate(() => {
      const p = window.__godsEyeView.viewer.camera.positionCartographic;
      return [p.longitude, p.latitude, p.height];
    }),
  };
  await page.screenshot({ path: out + '/06-follow-interrupted.png' });
  await page.evaluate(() =>
    window.__gevAnnotations.annotate(
      [
        {
          type: 'pin',
          manual: true,
          longitude: -23.5,
          latitude: 15,
          label: 'Operator note',
        },
      ],
      { persist: true, flyTo: false, autoFrame: false },
    ),
  );
  await page.evaluate(() =>
    window.__godsEyeView.dataManager.setEnabled('earthquakes', true, {
      origin: 'user',
    }),
  );
  await page.click('[data-debug-action="clear"]');
  check(
    'Clear preserves unrelated whiteboard and user enabled native layer',
    await page.evaluate(
      () =>
        window.__gevAnnotations
          .list()
          .some((a) => a.label === 'Operator note') &&
        window.__godsEyeView.dataManager.isEnabled('earthquakes') &&
        !window.__gevAnnotations
          .list()
          .some((a) => a.owner === 'reality-debug'),
    ),
  );
  if (recording) await pause(4000);
  const previous = report.selected.selected.id;
  await page.click('[data-debug-action="another"]');
  await pause(2500);
  await page.click('[data-debug-action="debug"]');
  await page.waitForFunction(
    () => window.__godsEyeView.worldDebug.getState().status !== 'loading',
    { timeout: 90000 },
  );
  check(
    'Restart uses another real source country without reload',
    await page.evaluate(
      (id) => window.__godsEyeView.worldDebug.getState().subject?.id !== id,
      previous,
    ),
  );
  await page.screenshot({ path: out + '/07-another.png' });
  if (recording) await pause(6000);
  await page.click('[data-debug-action="clear"]');
  if (recording) {
    await pause(3000);
    await recording.stop();
    recording = null;
  }
  await page.setViewport({ width: 390, height: 844 });
  await page.click('[data-debug-action="debug"]');
  await page.waitForFunction(
    () => window.__godsEyeView.worldDebug.getState().status !== 'loading',
    { timeout: 90000 },
  );
  await page.screenshot({ path: out + '/08-mobile.png' });
  check(
    'Mobile debug controls stay within viewport',
    await page.evaluate(() => {
      const r = document
        .querySelector('#world-debug-popover')
        .getBoundingClientRect();
      return r.x >= 0 && r.right <= innerWidth && r.bottom <= innerHeight;
    }),
  );
  await page.click('[data-debug-action="clear"]');
  await page.evaluate(() =>
    window.__godsEyeView.dataManager.setEnabled('internet-health', false),
  );
  check(
    'Layer off clears health selection',
    await page.evaluate(
      () => !window.__godsEyeView.viewer.selectedEntity?.__internetHealthId,
    ),
  );
  check('No unhandled exceptions', report.errors.length === 0, report.errors);
} catch (e) {
  report.failure = e.stack;
  console.log(e.stack);
  await page.screenshot({ path: out + '/failure.png' }).catch(() => {});
} finally {
  await writeFile(out + '/report.json', JSON.stringify(report, null, 2));
  if (recording) await recording.stop().catch(() => {});
  await browser.close();
}

if (report.failure || report.checks.some((c) => !c.passed))
  process.exitCode = 1;
