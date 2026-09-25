import test from 'node:test';
import assert from 'node:assert/strict';
import { createSituationRuntime } from './runtime.js';
import { tongaSituation } from './tonga.js';
import { resolveAnnotation } from './annotation.js';

test('pins measured summary to declared context without claiming sensor coordinates', () => {
  const runtime = createSituationRuntime(tongaSituation);
  runtime.setTime('2022-01-15T05:30:00Z');
  const pin = resolveAnnotation(runtime, 'traffic-collapse');
  assert.deepEqual(pin.coordinates, [-175.2, -21.13]);
  assert.match(pin.basis, /not a network sensor/);
  assert.equal(pin.status, 'OBSERVED');
  assert.ok(
    pin.publishers.some((publisher) => publisher.includes('Cloudflare')),
  );
});
test('pins never invent geography or bypass time and evidence filtering', () => {
  const runtime = createSituationRuntime(tongaSituation);
  assert.throws(() => resolveAnnotation(runtime, 'traffic-return'), /visible/);
  assert.throws(
    () => resolveAnnotation(runtime, 'international-cable'),
    /geographic anchor/,
  );
  runtime.setTime('2022-01-15T05:30:00Z');
  runtime.setLens('OBSERVED');
  assert.throws(() => resolveAnnotation(runtime, 'fault-unknown'), /visible/);
});
test('distance annotation preserves illustrative rather than exact geography', () => {
  const runtime = createSituationRuntime(tongaSituation);
  runtime.setTime('2022-01-15T05:30:00Z');
  const pin = resolveAnnotation(runtime, 'fault-unknown');
  assert.match(pin.basis, /not a fault boundary/);
  assert.equal(pin.status, 'UNKNOWN');
});
