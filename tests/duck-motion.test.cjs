const { test } = require('node:test');
const assert = require('node:assert/strict');
const { bounds, clamp, step, gait, advanceWalk } = require('../assets/js/duck-motion.js');
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
test('the planted foot stays at the same screen position through its contact phase', () => {
  const width = 96, stride = width * .20;
  const plantedX = 2.4 * width / 48;
  for (const fraction of [0, .1, .2, .3, .4, .49]) {
    const distance = stride * fraction;
    const pose = gait(distance, width);
    assert.equal(pose.front.y, 0);
    assert.ok(Math.abs(distance + pose.front.x * width / 48 - plantedX) < .00001);
  }
});
test('feet alternate contact and lift without stretching when the character is resized', () => {
  for (let i = 0; i < 100; i++) {
    const pose = gait(i * .1, 96);
    const small = gait(i * .1 * 80 / 96, 80);
    for (const foot of ['front', 'back']) {
      assert.ok(Math.abs(pose[foot].x) <= 2.400001);
      assert.ok(pose[foot].y <= .00001 && pose[foot].y >= -1.700001);
      assert.ok(Math.abs(pose[foot].x - small[foot].x) < .00001);
    }
    assert.ok(Math.abs(pose.front.y) < .00001 || Math.abs(pose.back.y) < .00001);
  }
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
