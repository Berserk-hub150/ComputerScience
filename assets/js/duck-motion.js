(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.RetroDuckMotion = api; api.init(document); }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function bounds(width, height, actorWidth, actorHeight, margin) {
    const pad = margin === undefined ? 12 : margin;
    return { minX: pad, minY: pad, maxX: Math.max(pad, width - actorWidth - pad), maxY: Math.max(pad, height - actorHeight - pad) };
  }
  function clamp(point, box) {
    return { x: Math.max(box.minX, Math.min(point.x, box.maxX)), y: Math.max(box.minY, Math.min(point.y, box.maxY)) };
  }
  function step(point, goal, distance) {
    const dx = goal.x - point.x, dy = goal.y - point.y;
    const length = Math.hypot(dx, dy);
    if (length <= Math.max(0, distance)) return { x: goal.x, y: goal.y, arrived: true };
    const ratio = Math.max(0, distance) / length;
    return { x: point.x + dx * ratio, y: point.y + dy * ratio, arrived: false };
  }
  // Measured anchors in the existing image, expressed as fractions of one cell.
  // Normalize every pose to the same face position, head height and foot baseline.
  const anchors = [
    [0.5360, 0.0700, 0.9459], [0.5282, 0.0700, 0.9414],
    [0.5418, 0.0700, 0.9434], [0.5293, 0.0500, 0.9437],
    [0.4550, 0.0200, 0.9413], [0.4537, 0.0200, 0.9413],
    [0.4718, 0.0200, 0.9413], [0.4640, 0.0200, 0.9413]
  ];
  function spritePose(index) {
    const [face, top, baseline] = anchors[index];
    const scale = (0.944 - 0.070) / (baseline - top);
    return { index, column: index % 4, row: Math.floor(index / 4), scale,
      x: 0.536 - (0.5 + (face - 0.5) * scale),
      y: 0.944 - (0.944 + (baseline - 0.944) * scale) };
  }
  function walkFrame(distance, spriteWidth) {
    // The high-kick fourth image is unsuitable for a relaxed patrol.
    return [0, 1, 2, 1][Math.floor(Math.max(0, distance) / (Math.max(1, spriteWidth * 0.32) / 4)) % 4];
  }
  function advanceWalk(point, goalX, velocity, seconds, maxSpeed) {
    const dt = Math.max(0, Math.min(seconds, 0.05));
    const remaining = Math.abs(goalX - point.x);
    if (remaining < 0.15) return { x: goalX, y: point.y, speed: 0, moved: remaining, arrived: true };
    const acceleration = maxSpeed * 2.6;
    const desired = Math.min(maxSpeed, Math.sqrt(2 * acceleration * remaining));
    const speed = velocity < desired ? Math.min(desired, velocity + acceleration * dt) : Math.max(desired, velocity - acceleration * dt);
    const next = step(point, { x: goalX, y: point.y }, (velocity + speed) * 0.5 * dt);
    return { ...next, speed: next.arrived ? 0 : speed, moved: Math.abs(next.x - point.x) };
  }
  function init(doc) {
    const root = doc.getElementById('duck-guide');
    const walker = doc.getElementById('duck-walker');
    if (!root || !walker) return;
    const panel = doc.getElementById('duck-panel');
    const menu = doc.getElementById('duck-position-menu');
    const toggles = Array.from(root.querySelectorAll('[data-duck-position-toggle]'));
    const choices = Array.from(menu.querySelectorAll('[data-duck-mode]'));
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const sprite = walker.querySelector('.duck-sprite');
    const spriteImage = walker.querySelector('.duck-frame');
    let mode = 'roam';
    try { const saved = localStorage.getItem('retro-duck-position'); if (['left', 'right', 'roam'].includes(saved)) mode = saved; } catch (_) {}
    let position = { x: 0, y: 0 }, goal = null, lastTime = 0, frame = 0, timer = 0;
    let hovered = false, keyboardFocused = false, menuAnchor = null;
    let speed = 0, walkDistance = 0, restUntil = 0, direction = 1, blinkTimer = 0, renderedPose = -1;
    let spriteWidth = 164;
    let size = { width: 176, height: 178 };
    function measure() {
      if (walker.hidden) return;
      const rect = walker.getBoundingClientRect();
      size = { width: rect.width, height: rect.height };
      spriteWidth = sprite.getBoundingClientRect().width;
    }
    function limits() { return bounds(innerWidth, innerHeight, size.width, size.height); }
    function paint() {
      position = clamp(position, limits());
      position.y = limits().maxY;
      walker.style.transform = 'translate3d(' + position.x.toFixed(2) + 'px,' + position.y.toFixed(2) + 'px,0)';
      walker.dataset.bubble = position.x < innerWidth / 2 ? 'right' : 'left';
    }
    function corner(side) {
      const box = limits();
      return { x: side === 'left' ? box.minX : box.maxX, y: box.maxY };
    }
    function renderPose(index) {
      if (index === renderedPose) return;
      const pose = spritePose(index);
      spriteImage.style.backgroundPosition = (pose.column * 100 / 3) + '% ' + (pose.row * 100) + '%';
      spriteImage.style.transform = 'translate(' + (pose.x * 100) + '%,' + (pose.y * 100) + '%) scale(' + pose.scale + ')';
      spriteImage.dataset.pose = String(index);
      renderedPose = index;
    }
    function idle() {
      clearTimeout(blinkTimer);
      renderPose(4);
      if (reduced.matches || doc.hidden || walker.hidden) return;
      blinkTimer = setTimeout(() => {
        if (walker.classList.contains('is-walking') || doc.hidden || walker.hidden) return;
        renderPose(6);
        blinkTimer = setTimeout(idle, 110);
      }, 5800);
    }
    function stop() {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      frame = timer = lastTime = 0;
      speed = 0;
      walker.classList.remove('is-walking');
      idle();
    }
    function allowed() { return mode === 'roam' && panel.hidden && menu.hidden && !hovered && !keyboardFocused && !reduced.matches && !doc.hidden; }
    function nextGoal() {
      const box = limits();
      if (box.maxX - box.minX < 24) return null;
      return { x: position.x > (box.minX + box.maxX) / 2 ? box.minX : box.maxX, y: box.maxY };
    }
    function tick(time) {
      frame = 0;
      if (!allowed()) { stop(); return; }
      if (!goal) { stop(); return; }
      const delta = lastTime ? (time - lastTime) / 1000 : 0;
      lastTime = time;
      const moved = advanceWalk(position, goal.x, speed, delta, spriteWidth * 0.30);
      speed = moved.speed;
      walkDistance += moved.moved;
      position = moved;
      paint();
      walker.classList.toggle('is-walking', !moved.arrived);
      if (moved.arrived) {
        goal = null;
        lastTime = 0;
        restUntil = time + 1100;
        idle();
        timer = setTimeout(start, 1100);
      } else {
        renderPose(walkFrame(walkDistance, spriteWidth));
        frame = requestAnimationFrame(tick);
      }
    }
    function start() {
      if (!allowed() || frame) return;
      clearTimeout(timer);
      const now = performance.now();
      if (now < restUntil) { timer = setTimeout(start, restUntil - now); return; }
      if (!goal) goal = nextGoal();
      if (!goal) { idle(); return; }
      const facing = goal.x < position.x ? -1 : 1;
      if (facing !== direction) {
        direction = facing;
        walker.style.setProperty('--duck-direction', String(direction));
        restUntil = now + 180;
        walkDistance = 0;
        timer = setTimeout(start, 180);
        return;
      }
      clearTimeout(blinkTimer);
      lastTime = 0;
      frame = requestAnimationFrame(tick);
    }
    function syncMode() {
      root.dataset.mode = mode;
      if (mode !== 'roam') root.dataset.side = mode;
      else if (!root.dataset.side) root.dataset.side = 'right';
      choices.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.duckMode === mode)));
    }
    function placeMenu() {
      if (!menuAnchor || menu.hidden) return;
      const anchor = menuAnchor.getBoundingClientRect();
      const width = menu.offsetWidth, height = menu.offsetHeight;
      let x = anchor.left + anchor.width / 2 - width / 2;
      let y = anchor.top >= height + 20 ? anchor.top - height - 10 : anchor.bottom + 10;
      // Keep the character visible while choosing a corner whenever there is room.
      if (walker.contains(menuAnchor)) {
        const actor = walker.getBoundingClientRect();
        if (actor.right + width + 22 <= innerWidth) { x = actor.right + 10; y = actor.bottom - height; }
        else if (actor.left >= width + 22) { x = actor.left - width - 10; y = actor.bottom - height; }
      }
      x = Math.max(12, Math.min(x, innerWidth - width - 12));
      menu.style.left = x + 'px';
      menu.style.top = Math.max(12, Math.min(y, innerHeight - height - 12)) + 'px';
    }
    function closeMenu(returnFocus) {
      menu.hidden = true;
      toggles.forEach(button => button.setAttribute('aria-expanded', 'false'));
      if (returnFocus && menuAnchor && !menuAnchor.closest('[hidden]')) menuAnchor.focus({ preventScroll: true });
    }
    toggles.forEach(button => button.addEventListener('click', () => {
      if (!menu.hidden && menuAnchor === button) { closeMenu(false); start(); return; }
      menuAnchor = button;
      menu.hidden = false;
      toggles.forEach(toggle => toggle.setAttribute('aria-expanded', String(toggle === button)));
      stop();
      placeMenu();
    }));
    choices.forEach(button => button.addEventListener('click', () => {
      mode = button.dataset.duckMode;
      stop();
      goal = null;
      restUntil = 0;
      closeMenu(false);
      syncMode();
      try { localStorage.setItem('retro-duck-position', mode); } catch (_) {}
      if (mode !== 'roam') position = corner(mode);
      root.dispatchEvent(new CustomEvent('duck-position-change', { detail: { mode } }));
      measure();
      paint();
      doc.getElementById('duck-launcher').focus({ preventScroll: true });
      start();
    }));
    walker.addEventListener('pointerenter', () => { hovered = true; stop(); });
    walker.addEventListener('pointerleave', () => { hovered = false; start(); });
    walker.addEventListener('focusin', event => { keyboardFocused = event.target.matches(':focus-visible'); if (keyboardFocused) stop(); });
    walker.addEventListener('focusout', () => queueMicrotask(() => { keyboardFocused = walker.contains(doc.activeElement) && doc.activeElement.matches(':focus-visible'); start(); }));
    root.addEventListener('duck-panel-toggle', () => {
      closeMenu(false);
      stop();
      if (panel.hidden) { measure(); paint(); start(); }
    });
    doc.addEventListener('pointerdown', event => {
      if (!menu.hidden && !menu.contains(event.target) && !toggles.some(button => button.contains(event.target))) { closeMenu(false); start(); }
    });
    doc.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !menu.hidden) { event.stopImmediatePropagation(); closeMenu(true); start(); }
    });
    function resized() {
      measure();
      if (mode !== 'roam') position = corner(mode);
      if (goal) goal = clamp(goal, limits());
      paint();
      placeMenu();
    }
    addEventListener('resize', resized);
    doc.addEventListener('visibilitychange', () => { stop(); start(); });
    reduced.addEventListener('change', () => { stop(); start(); });
    measure();
    syncMode();
    position = corner(mode === 'left' ? 'left' : 'right');
    paint();
    idle();
    start();
  }
  return { bounds, clamp, step, spritePose, walkFrame, advanceWalk, init };
}));
