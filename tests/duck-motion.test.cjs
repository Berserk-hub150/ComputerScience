const { test } = require('node:test');
const assert = require('node:assert/strict');
const { bounds, clamp, step, walkFrame, advanceWalk, platformLane, platformOrder, jumpPoint } = require('../assets/js/duck-motion.js');
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
test('the six walk frames follow travelled distance, including after resize', () => {
  const stride = 90 * .45;
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map(n => walkFrame(stride * n / 6 + .00001, 90)), [0, 1, 2, 3, 4, 5, 0]);
  assert.equal(walkFrame(15, 90), walkFrame(10, 60));
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
test('the route visits both rows of cards in a short serpentine order', () => {
  const cards = [
    { id: 'ml', top: 220, left: 200 }, { id: 'csd', top: 220, left: 650 },
    { id: 'aam', top: 470, left: 200 }, { id: 'masl', top: 470, left: 650 }
  ];
  assert.deepEqual(platformOrder(cards).map(c => c.id), ['ml', 'csd', 'masl', 'aam']);
  assert.deepEqual(cards.map(c => c.id), ['ml', 'csd', 'aam', 'masl']);
});
test('platform lanes put the feet on the top border, including narrow resource buttons', () => {
  for (const width of [72, 125, 440]) {
    const rect = { left: 200, right: 200 + width, top: 300, width };
    const lane = platformLane(rect, { width: 90, height: 57 }, { left: 0, width: 1363 });
    assert.equal(lane.y + 57, 301);
    assert.ok(lane.left + 45 > rect.left && lane.right + 45 < rect.right);
    assert.ok(lane.right > lane.left);
  }
});
test('wrapped or additional resource buttons are discovered in geometry order without a count limit', () => {
  const links = Array.from({ length: 7 }, (_, i) => ({ id: i, top: 300 + Math.floor(i / 3) * 58, left: 120 + i % 3 * 110 }));
  assert.deepEqual(platformOrder(links).map(c => c.id), [0, 1, 2, 5, 4, 3, 6]);
});
test('a jump lands exactly on its target and clears a higher platform', () => {
  const from = { x: 210, y: 440 }, to = { x: 210, y: 200 };
  assert.deepEqual(jumpPoint(from, to, 0), from);
  assert.deepEqual(jumpPoint(from, to, 1), to);
  assert.deepEqual(jumpPoint(from, to, 1.5), to);
  assert.ok(Math.min(...Array.from({ length: 21 }, (_, i) => jumpPoint(from, to, i / 20).y)) < to.y - 20);
});
test('scrolling document coordinates does not change the physical platform attachment', () => {
  const lane = platformLane({ left: 18, right: 302, top: 900, width: 284 }, { width: 90, height: 57 }, { left: 0, width: 320 });
  assert.ok(lane.left >= 8 && lane.right + 90 <= 312);
  assert.equal(lane.y - 700 + 57, 201);
});
