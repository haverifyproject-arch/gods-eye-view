import puppeteer from 'puppeteer';
import { mkdir, writeFile } from 'node:fs/promises';
const out = 'artifacts/native-internet-targeted';
await mkdir(out, { recursive: true });
const report = { checks: [], errors: [] };
const check = (name, passed, detail) => {
  report.checks.push({ name, passed, detail });
  console.log(passed ? 'PASS' : 'FAIL', name);
};
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({
  headless: true,
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
  ],
});
const page = await browser.newPage();
page.on('pageerror', (e) => report.errors.push(e.message));
try {
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:4180/?welcome=0', {
    waitUntil: 'domcontentloaded',
    timeout: 90000,
  });
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
  await page.click('[data-debug-action="another"]');
  await page.waitForFunction(
    () => !!window.__godsEyeView.viewer.selectedEntity,
    { timeout: 90000 },
  );
  await pause(2000);
  await page.click('[data-debug-action="debug"]');
  await page.waitForFunction(
    () => window.__godsEyeView.worldDebug.getState().status === 'ready',
    { timeout: 90000 },
  );
  await page.click('[data-debug-action="follow"]');
  await pause(2500);
  const motion = await page.evaluate(() => ({
    height: window.__godsEyeView.viewer.camera.positionCartographic.height,
    holds: window.__godsEyeView.getRenderGovernorDiagnostics().holds,
  }));
  check(
    'Cable follow uses infrastructure altitude above80km',
    motion.height >= 80000,
    motion,
  );
  check(
    'Follow owns native camera motion',
    motion.holds.includes('camera-verb'),
    motion,
  );
  await page.mouse.move(700, 400);
  await page.mouse.down();
  await page.mouse.move(810, 410, { steps: 12 });
  await page.mouse.up();
  await pause(500);
  check(
    'Manual pointer input releases native follow ownership',
    await page.evaluate(
      () =>
        !window.__godsEyeView
          .getRenderGovernorDiagnostics()
          .holds.includes('camera-verb'),
    ),
  );
  await page.click('[data-debug-action="follow"]');
  await pause(400);
  await page.click('[data-debug-action="clear"]');
  check(
    'Clear releases owned native follow',
    await page.evaluate(
      () =>
        !window.__godsEyeView
          .getRenderGovernorDiagnostics()
          .holds.includes('camera-verb'),
    ),
  );
  await page.click('[data-debug-action="debug"]');
  await page.waitForFunction(
    () => window.__godsEyeView.worldDebug.getState().status === 'ready',
    { timeout: 90000 },
  );
  await page.click('[data-debug-action="sources"]');
  await page.screenshot({ path: out + '/desktop-source.png' });
  await page.setViewport({ width: 390, height: 844 });
  await page.screenshot({ path: out + '/mobile-source.png' });
  check(
    'Compact source link visible without scrolling',
    await page.evaluate(() => {
      const p = document
        .querySelector('#world-debug-popover')
        .getBoundingClientRect();
      const a = document
        .querySelector('#world-debug-evidence a')
        ?.getBoundingClientRect();
      return a && a.top >= p.top && a.bottom <= p.bottom;
    }),
  );
  await page.click('[data-debug-action="clear"]');
  await page.evaluate(() => {
    const v = window.__godsEyeView.viewer;
    v.selectedEntity = undefined;
    window.__gevContextStore.selectedEntityId = null;
    window.dispatchEvent(new CustomEvent('gev:entity-selection-cleared'));
  });
  await page.click('[data-debug-action="debug"]');
  await page.waitForFunction(
    () => window.__godsEyeView.worldDebug.getState().status === 'ready',
    { timeout: 90000 },
  );
  check(
    'Unselected region debug uses current camera rather than fixed country',
    await page.evaluate(
      () =>
        window.__godsEyeView.worldDebug.getState().subject.id ===
        'current-view',
    ),
  );
  await page.setViewport({ width: 1440, height: 900 });
  await page.click('[data-debug-action="clear"]');
  await page.evaluate(async () => {
    const app = window.__godsEyeView;
    await app.dataManager.setEnabled('earthquakes', true, { origin: 'user' });
    const v = app.viewer;
    const e = Array.from({ length: v.dataSources.length }, (_, i) =>
      v.dataSources.get(i),
    )
      .flatMap((d) => d.entities.values)
      .find((e) => e.__earthquakeContext);
    if (!e) throw Error('No real quake available');
    window.__qaQuake = e;
    await v.flyTo(e, { duration: 0.3 });
  });
  await pause(1200);
  const quakePoint = await page.evaluate(() => {
    const v = window.__godsEyeView.viewer;
    const e = window.__qaQuake;
    const p = v.scene.cartesianToCanvasCoordinates(
      e.position.getValue(v.clock.currentTime),
    );
    return { x: p.x, y: p.y, id: e.__gevContextId };
  });
  await page.mouse.click(quakePoint.x, quakePoint.y);
  await pause(300);
  check(
    'Actual native quake pointer selection publishes shared context',
    await page.evaluate(
      () =>
        window.__godsEyeView.worldDebug.getState().selected?.layerId ===
        'earthquakes',
    ),
    quakePoint,
  );
  await page.click('[data-debug-action="debug"]');
  await page.waitForFunction(
    () => window.__godsEyeView.worldDebug.getState().status !== 'loading',
    { timeout: 90000 },
  );
  check(
    'Debug accepts selected native earthquake context',
    await page.evaluate(
      () =>
        window.__godsEyeView.worldDebug.getState().subject?.layerId ===
        'earthquakes',
    ),
  );
  await page.screenshot({ path: out + '/earthquake-debug.png' });
  await page.click('[data-debug-action="another"]');
  await pause(2000);
  check(
    'Return from physical selection to a live outage',
    await page.evaluate(
      () =>
        window.__godsEyeView.worldDebug.getState().selected?.layerId ===
        'internet-health',
    ),
  );
  check('No unhandled exceptions', report.errors.length === 0, report.errors);
} catch (e) {
  report.failure = e.stack;
  console.log(e.stack);
  await page.screenshot({ path: out + '/failure.png' }).catch(() => {});
} finally {
  await writeFile(out + '/report.json', JSON.stringify(report, null, 2));
  await browser.close();
}
if (report.failure || report.checks.some((c) => !c.passed))
  process.exitCode = 1;
