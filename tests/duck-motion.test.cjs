const { test } = require('node:test');
const assert = require('node:assert/strict');
const { bounds, clamp, step, spritePose, walkFrame, advanceWalk } = require('../assets/js/duck-motion.js');
test('both dock positions fit a desktop and a phone viewport', () => {
  for (const [w, h, aw, ah] of [[1365, 937, 176, 184], [320, 568, 140, 162]]) {
    const box = bounds(w, h, aw, ah);
    assert.equal(box.minX, 12);
    assert.equal(box.maxX + aw, w - 12);
    assert.equal(box.maxY + ah, h - 12);
  }
});
test('resize clamps an old desktop position inside a phone', () => {
  const box = bounds(320, 568, 140, 162);
  assert.deepEqual(clamp({ x: 1177, y: 743 }, box), { x: 168, y: 394 });
  assert.deepEqual(clamp({ x: -400, y: -200 }, box), { x: 12, y: 12 });
});
test('walking speed is independent of diagonal direction', () => {
  const next = step({ x: 0, y: 0 }, { x: 300, y: 400 }, 25);
  assert.equal(Math.hypot(next.x, next.y), 25);
  assert.equal(next.arrived, false);
});
test('a large frame never overshoots a destination', () => {
  assert.deepEqual(step({ x: 90, y: 50 }, { x: 100, y: 50 }, 100), { x: 100, y: 50, arrived: true });
});
test('arriving at an existing destination does not divide by zero', () => {
  assert.deepEqual(step({ x: 5, y: 7 }, { x: 5, y: 7 }, 0), { x: 5, y: 7, arrived: true });
});
test('a zero movement budget keeps position unchanged', () => {
  assert.deepEqual(step({ x: 3, y: 4 }, { x: 20, y: 40 }, 0), { x: 3, y: 4, arrived: false });
});
test('walking and standing share the same face, head height and foot baseline', () => {
  // Independent measurements of the source PNG: face X, silhouette top and feet Y.
  for (const [index, face, top, feet] of [[0, .536, .07, .9459], [1, .5282, .07, .9414], [2, .5418, .07, .9434], [4, .455, .02, .9413], [6, .4718, .02, .9413]]) {
    const p = spritePose(index);
    assert.ok(Math.abs(.5 + (face - .5) * p.scale + p.x - .536) < .00001);
    assert.ok(Math.abs(.944 + (top - .944) * p.scale + p.y - .07) < .00001);
    assert.ok(Math.abs(.944 + (feet - .944) * p.scale + p.y - .944) < .00001);
  }
});
test('gait advances with travelled distance and excludes the exaggerated kick', () => {
  const stride = 164 * .32;
  assert.deepEqual([0, .25, .5, .75, 1].map(p => walkFrame(stride * p + .00001, 164)), [0, 1, 2, 1, 0]);
  assert.equal(walkFrame(13, 164), walkFrame(6.5, 82));
});
test('a patrol accelerates, brakes and arrives on the same horizontal ground line', () => {
  let p = { x: 0, y: 700 }, speed = 0, distance = 0, arrived = false;
  const speeds = [];
  for (let i = 0; i < 600 && !arrived; i++) {
    const next = advanceWalk(p, 200, speed, 1 / 60, 50);
    assert.equal(next.y, 700);
    assert.ok(next.x >= p.x && next.x <= 200);
    assert.ok(next.moved <= 50 / 60 + .15);
    distance += next.moved;
    p = next; speed = next.speed; arrived = next.arrived; speeds.push(speed);
  }
  assert.ok(arrived);
  assert.ok(speeds[0] < speeds[10]);
  assert.ok(speeds.at(-3) < Math.max(...speeds));
  assert.equal(p.x, 200);
  assert.ok(Math.abs(distance - 200) < .00001);
});
test('20, 60 and 144 FPS produce the same patrol speed', () => {
  const ends = [20, 60, 144].map(fps => {
    let p = { x: 0, y: 400 }, speed = 0;
    for (let i = 0; i < fps * 4; i++) { const next = advanceWalk(p, 1000, speed, 1 / fps, 50); p = next; speed = next.speed; }
    return p.x;
  });
  assert.ok(Math.max(...ends) - Math.min(...ends) < .3);
});
test('pause does not move the feet; resuming cannot jump after a long hidden interval', () => {
  const p = { x: 250, y: 700 };
  assert.equal(advanceWalk(p, 12, 0, 0, 50).moved, 0);
  const resumed = advanceWalk(p, 12, 0, 30, 50);
  assert.ok(resumed.moved < 1);
  assert.equal(resumed.y, p.y);
});
