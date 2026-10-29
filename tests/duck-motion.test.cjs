const { test } = require('node:test');
const assert = require('node:assert/strict');
const { bounds, clamp, step } = require('../assets/js/duck-motion.js');
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
