import test from 'node:test';
import assert from 'node:assert/strict';
import * as Cesium from 'cesium';
import {
  createRouteFlight,
  advanceRouteFlight,
  densifyInfrastructureRoute,
} from './cameraVerbs.js';

const pts = [
  Cesium.Cartesian3.fromDegrees(178.4, -18.1),
  Cesium.Cartesian3.fromDegrees(-175.2, -21.1),
];
const cumM = [0, Cesium.Cartesian3.distance(...pts)];

test('infrastructure route crosses the dateline along densified globe geometry', () => {
  const route = densifyInfrastructureRoute(pts);
  assert.ok(route.pts.length > 30);
  assert.ok(route.pts.length < 100);
  for (let i = 0; i < route.pts.length; i++) {
    const point = Cesium.Cartographic.fromCartesian(route.pts[i]);
    assert.ok(Math.abs(point.height) < 0.01);
    assert.ok(Math.abs(Cesium.Math.toDegrees(point.longitude)) > 170);
    if (i)
      assert.ok(
        Cesium.Cartesian3.distance(route.pts[i - 1], route.pts[i]) <= 20001,
      );
  }
});

test('infrastructure flight remains overhead, level, bounded and finishes in the existing route advance loop', () => {
  const state = createRouteFlight({
    pts,
    cumM,
    profile: 'infrastructure',
    cameraHeightM: 2000000,
  });
  assert.equal(state.durationS, 30);
  let frame;
  for (let i = 0; i < 121; i++) {
    frame = advanceRouteFlight(state, 0.25);
    assert.ok(frame.heightM >= 80000 && frame.heightM <= 200000);
    assert.equal(frame.bankDeg, 0);
    assert.ok(
      Math.abs(Cesium.Cartographic.fromCartesian(frame.eye).height - 120000) <
        0.01,
    );
  }
  assert.equal(frame.finished, true);
  assert.equal(
    createRouteFlight({
      pts,
      cumM,
      profile: 'infrastructure',
      durationSec: 999,
      cruiseHeightM: 1,
    }).durationS,
    60,
  );
  assert.equal(
    createRouteFlight({
      pts,
      cumM,
      profile: 'infrastructure',
      durationSec: 1,
      cruiseHeightM: 999999,
    }).cruiseHeightM,
    200000,
  );
});

test('street routes retain their existing speed-based timing', () => {
  const state = createRouteFlight({ pts, cumM, speed: 'normal' });
  assert.equal(state.profile, 'street');
  assert.equal(state.durationS, cumM[1] / 40);
});
