(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.RetroDuckMotion = api; api.init(document); }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const platformSelector = '[data-buddy-platform]';
  function bounds(width, height, actorWidth, actorHeight, margin) {
    const pad = margin === undefined ? 12 : margin;
    return { minX: pad, minY: pad, maxX: Math.max(pad, width - actorWidth - pad), maxY: Math.max(pad, height - actorHeight - pad) };
  }
  function clamp(point, box) {
    return { x: Math.max(box.minX, Math.min(point.x, box.maxX)), y: Math.max(box.minY, Math.min(point.y, box.maxY)) };
  }
  function step(point, goal, distance) {
    const dx = goal.x - point.x, dy = goal.y - point.y, length = Math.hypot(dx, dy);
    if (length <= Math.max(0, distance)) return { x: goal.x, y: goal.y, arrived: true };
    const ratio = Math.max(0, distance) / length;
    return { x: point.x + dx * ratio, y: point.y + dy * ratio, arrived: false };
  }
  function walkFrame(distance, spriteWidth) {
    return Math.floor(Math.max(0, distance) / Math.max(1, spriteWidth * .45) * 6) % 6;
  }
  function advanceWalk(point, goalX, velocity, seconds, maxSpeed) {
    const dt = Math.max(0, Math.min(seconds, .05)), remaining = Math.abs(goalX - point.x);
    if (remaining < .15) return { x: goalX, y: point.y, speed: 0, moved: remaining, arrived: true };
    const acceleration = maxSpeed * 2.6, desired = Math.min(maxSpeed, Math.sqrt(2 * acceleration * remaining));
    const speed = velocity < desired ? Math.min(desired, velocity + acceleration * dt) : Math.max(desired, velocity - acceleration * dt);
    const next = step(point, { x: goalX, y: point.y }, (velocity + speed) * .5 * dt);
    return { ...next, speed: next.arrived ? 0 : speed, moved: Math.abs(next.x - point.x) };
  }
  function advancePath(point, goal, velocity, seconds, maxSpeed) {
    const remaining = Math.hypot(goal.x - point.x, goal.y - point.y);
    const travel = advanceWalk({ x: 0, y: 0 }, remaining, velocity, seconds, maxSpeed);
    return { ...step(point, goal, travel.x), speed: travel.speed, moved: travel.moved };
  }
  function perimeterPath(rect, actor) {
    // Each point is the sprite's unrotated origin. Its feet touch the actual border.
    const x = actor.width / 2, y = actor.height - 1;
    return [
      { x: rect.left - x, y: rect.top - y },
      { x: rect.right - x, y: rect.top - y },
      { x: rect.right - x, y: rect.top + rect.height - y },
      { x: rect.left - x, y: rect.top + rect.height - y },
      { x: rect.left - x, y: rect.top - y }
    ];
  }
  function facingForMode(mode, current) { return mode === 'left' ? 1 : mode === 'right' ? -1 : current; }
  function turnAngle(from, to, progress) {
    const t = Math.max(0, Math.min(1, progress));
    return from + (to - from) * t * t * (3 - 2 * t);
  }
  function spriteBounds(position, actor, angle) {
    const radians = angle * Math.PI / 180, cos = Math.cos(radians), sin = Math.sin(radians);
    const corners = [[-actor.width / 2, -actor.height], [actor.width / 2, -actor.height], [-actor.width / 2, 0], [actor.width / 2, 0]];
    const points = corners.map(([x, y]) => ({ x: position.x + actor.width / 2 + x * cos - y * sin, y: position.y + actor.height + x * sin + y * cos }));
    return { left: Math.min(...points.map(p => p.x)), top: Math.min(...points.map(p => p.y)), right: Math.max(...points.map(p => p.x)), bottom: Math.max(...points.map(p => p.y)) };
  }
  function platformLane(rect, actor, viewport) {
    const inset = Math.min(24, rect.width * .24);
    const min = viewport.left + 8, max = Math.max(min, viewport.left + viewport.width - actor.width - 8);
    const fit = x => Math.max(min, Math.min(x, max));
    return { left: fit(rect.left + inset - actor.width / 2), right: fit(rect.right - inset - actor.width / 2), y: rect.top - actor.height + 1 };
  }
  function platformOrder(items) {
    const sorted = items.slice().sort((a, b) => a.top - b.top || a.left - b.left), rows = [];
    sorted.forEach(item => {
      let row = rows.at(-1);
      if (!row || Math.abs(row.top - item.top) > 12) { row = { top: item.top, items: [] }; rows.push(row); }
      row.items.push(item);
    });
    return rows.flatMap((row, index) => row.items.sort((a, b) => index % 2 ? b.left - a.left : a.left - b.left));
  }
  function jumpPoint(from, to, progress) {
    const t = Math.max(0, Math.min(1, progress));
    const lift = Math.max(38, Math.abs(to.y - from.y) * .35 + 38, Math.min(120, Math.abs(to.x - from.x) * .14));
    return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t - 4 * lift * t * (1 - t) };
  }
  function init(doc) {
    const root = doc.getElementById('duck-guide'), walker = doc.getElementById('duck-walker');
    if (!root || !walker) return;
    const panel = doc.getElementById('duck-panel'), menu = doc.getElementById('duck-position-menu');
    const toggles = Array.from(root.querySelectorAll('[data-duck-position-toggle]'));
    const choices = Array.from(menu.querySelectorAll('[data-duck-mode]'));
    const reduced = matchMedia('(prefers-reduced-motion: reduce)'), sprite = walker.querySelector('.duck-sprite');
    let mode = 'roam';
    try { const saved = localStorage.getItem('retro-duck-position'); if (['left', 'right', 'roam'].includes(saved)) mode = saved; } catch (_) {}
    let position = { x: 0, y: 0 }, goal = null, frame = 0, timer = 0, idleTimer = 0, lastTime = 0;
    let hovered = false, keyboardFocused = false, menuAnchor = null, speed = 0, walkDistance = 0, restUntil = 0, direction = 1;
    let size = { width: 90, height: 57 }, pose = { row: 5, column: 0 }, standingUp = false;
    let surfaces = [], active = null, completed = false, jump = null, geometryFrame = 0;
    let edge = 0, angle = 0, turn = null, laps = 0;
    function measure() {
      if (!walker.hidden) { const launcher = doc.getElementById('duck-launcher'); size = { width: launcher.offsetWidth, height: launcher.offsetHeight }; }
    }
    function viewportBounds() { return bounds(innerWidth, innerHeight, size.width, size.height); }
    function corner(side) { const box = viewportBounds(); return { x: side === 'left' ? box.minX : box.maxX, y: box.maxY }; }
    function paint() {
      const anchored = mode === 'roam' && active;
      const view = anchored ? { x: position.x - scrollX, y: position.y - scrollY } : clamp(position, viewportBounds());
      const box = spriteBounds(view, size, angle);
      // Keep the whole dog visible on narrow screens, including when he turns sideways.
      const dx = Math.max(8 - box.left, Math.min(0, innerWidth - 8 - box.right));
      const dy = Math.max(8 - box.top, Math.min(0, innerHeight - 8 - box.bottom));
      view.x += dx; view.y += dy;
      walker.style.transform = 'translate3d(' + view.x.toFixed(2) + 'px,' + view.y.toFixed(2) + 'px,0)';
      walker.style.setProperty('--buddy-angle', angle + 'deg');
      walker.dataset.bubble = view.x < innerWidth / 2 ? 'right' : 'left';
      walker.dataset.controlsSide = view.x + size.width + 155 < innerWidth ? 'right' : view.x > 155 ? 'left' : 'above';
      walker.dataset.surface = active && mode === 'roam' ? String(active.index) : 'corner';
      walker.dataset.edge = anchored ? ['top', 'right', 'bottom', 'left'][Math.min(edge, 3)] : '';
      walker.dataset.laps = String(laps);
      const control = walker.querySelector('.buddy-dock-toggle');
      const left = box.left + dx, right = box.right + dx, top = box.top + dy, bottom = box.bottom + dy;
      const cx = right + 151 < innerWidth ? right + 5 : Math.max(8, left - 146);
      const cy = Math.max(8, Math.min(innerHeight - 36, (top + bottom) / 2 - 13));
      control.style.left = (cx - view.x) + 'px'; control.style.top = (cy - view.y) + 'px';
      root.dataset.surfaceCount = String(surfaces.length);
    }
    function path(surface) { return perimeterPath(surface, size); }
    function renderPose(row, column, activity) {
      pose = { row, column };
      sprite.style.backgroundPosition = (column * 20) + '% ' + (row * 20) + '%';
      sprite.dataset.animation = activity || (row === 1 ? 'walk' : row === 4 ? 'sit' : row === 3 ? 'settle' : 'idle');
      sprite.dataset.frame = String(column);
    }
    function idle() {
      clearTimeout(idleTimer);
      standingUp = false;
      renderPose(5, 0);
      if (reduced.matches || doc.hidden || walker.hidden) return;
      const since = performance.now();
      function animateIdle() {
        if (walker.classList.contains('is-walking') || jump || turn || doc.hidden || walker.hidden) return;
        const elapsed = performance.now() - since;
        if (elapsed < 2200) renderPose(5, Math.floor(elapsed / 180) % 4);
        else if (elapsed < 2620) renderPose(3, Math.min(2, Math.floor((elapsed - 2200) / 140)));
        else renderPose(4, Math.floor((elapsed - 2620) / 220) % 4);
        idleTimer = setTimeout(animateIdle, 80);
      }
      idleTimer = setTimeout(animateIdle, 80);
    }
    function stop() {
      cancelAnimationFrame(frame); clearTimeout(timer); clearTimeout(idleTimer);
      frame = timer = lastTime = 0; speed = 0; standingUp = false;
      walker.classList.remove('is-walking');
      if (jump) {
        if (jump.started !== null) { jump.elapsed = performance.now() - jump.started; jump.started = null; }
        renderPose(2, 2, 'jump');
      } else if (turn) {
        if (turn.started !== null) { turn.elapsed = performance.now() - turn.started; turn.started = null; }
        renderPose(5, 0, 'turn');
      } else idle();
    }
    function allowed() { return mode === 'roam' && !!active && panel.hidden && menu.hidden && !hovered && !keyboardFocused && !reduced.matches && !doc.hidden; }
    function refreshSurfaces(reset) {
      measure();
      const previous = active, previousPath = previous ? path(previous) : null;
      const items = Array.from(doc.querySelectorAll(platformSelector)).map((node, index) => {
        const r = node.getBoundingClientRect();
        return { node, index, left: r.left + scrollX, right: r.right + scrollX, top: r.top + scrollY, width: r.width, height: r.height };
      }).filter(r => r.width > 32 && r.height > 12 && r.top - scrollY >= size.height + 8 && r.top - scrollY < innerHeight - 10 && r.right > scrollX && r.left < scrollX + innerWidth);
      surfaces = platformOrder(items);
      if (mode !== 'roam') { active = null; angle = 0; setDirection(facingForMode(mode, direction)); position = corner(mode); paint(); return; }
      if (jump) {
        const destination = surfaces.find(s => s.node === jump.target.node);
        if (!destination || Math.abs(destination.top - jump.target.top) > 1 || Math.abs(destination.left - jump.target.left) > 1) {
          stop(); jump = null; turn = null; goal = null; completed = false; reset = true;
        }
      }
      const current = previous && surfaces.find(s => s.node === previous.node);
      if (!reset && current) {
        active = current;
        if (!jump) {
          const next = path(active), n = Math.min(edge, 3);
          const oldLength = Math.hypot(previousPath[n + 1].x - previousPath[n].x, previousPath[n + 1].y - previousPath[n].y);
          const fraction = completed || turn ? 1 : Math.min(1, Math.hypot(position.x - previousPath[n].x, position.y - previousPath[n].y) / Math.max(1, oldLength));
          position = { x: next[n].x + (next[n + 1].x - next[n].x) * fraction, y: next[n].y + (next[n + 1].y - next[n].y) * fraction };
          if (goal) goal = next[n + 1];
        }
      } else {
        stop(); jump = turn = null; goal = null; completed = false; edge = 0; angle = 0;
        active = surfaces[0] || null;
        if (active) { position = { ...path(active)[0] }; setDirection(1); }
        else { position = corner('right'); setDirection(-1); }
        idle();
      }
      paint();
    }
    function setDirection(next) {
      const changed = direction !== next;
      direction = next; walker.style.setProperty('--duck-direction', String(next));
      if (changed) walkDistance = 0;
      return changed;
    }
    function face(target) {
      const next = Math.abs(target - position.x) > 2 ? (target < position.x ? -1 : 1) : direction;
      return setDirection(next);
    }
    function beginJump() {
      const currentIndex = surfaces.findIndex(s => s.node === active.node), target = surfaces[(currentIndex + 1) % surfaces.length];
      const to = path(target)[0];
      angle = 0;
      face(to.x);
      clearTimeout(idleTimer); speed = 0;
      jump = { from: { ...position }, to, target, elapsed: 0, started: performance.now(), duration: Math.max(620, Math.min(1250, Math.hypot(to.x - position.x, to.y - position.y) / 480 * 1000 + 350)) };
      renderPose(2, 2, 'jump');
      frame = requestAnimationFrame(tick);
    }
    function tick(time) {
      frame = 0;
      if (!allowed()) { stop(); return; }
      if (jump) {
        const progress = (time - jump.started) / jump.duration;
        position = jumpPoint(jump.from, jump.to, progress); paint();
        if (progress >= 1) {
          active = jump.target; position = jump.to; jump = null; completed = false; goal = null; edge = 0; angle = 0; setDirection(1);
          renderPose(3, 1, 'land'); paint();
          timer = setTimeout(() => { idle(); start(); }, 180);
        } else frame = requestAnimationFrame(tick);
        return;
      }
      if (turn) {
        const progress = (time - turn.started) / 260;
        angle = turnAngle(turn.from, turn.to, progress); paint();
        renderPose(5, 0, 'turn');
        if (progress < 1) { frame = requestAnimationFrame(tick); return; }
        turn = null; edge++; goal = null;
        if (edge === 4) {
          angle = 0; completed = true; laps++; restUntil = time + 650;
          idle(); paint(); timer = setTimeout(start, 650);
        } else start();
        return;
      }
      if (!goal) { stop(); return; }
      const delta = lastTime ? (time - lastTime) / 1000 : 0; lastTime = time;
      const moved = advancePath(position, goal, speed, delta, size.width * .78);
      speed = moved.speed; walkDistance += moved.moved; position = moved; paint();
      walker.classList.toggle('is-walking', !moved.arrived);
      if (moved.arrived) {
        goal = null; lastTime = 0;
        turn = { from: edge * 90, to: (edge + 1) * 90, elapsed: 0, started: time };
        frame = requestAnimationFrame(tick);
      } else { renderPose(1, walkFrame(walkDistance, size.width)); frame = requestAnimationFrame(tick); }
    }
    function start() {
      if (!allowed() || frame || standingUp) return;
      clearTimeout(timer);
      const now = performance.now();
      if (now < restUntil) { timer = setTimeout(start, restUntil - now); return; }
      if (jump) { jump.started = now - jump.elapsed; frame = requestAnimationFrame(tick); return; }
      if (turn) { turn.started = now - turn.elapsed; frame = requestAnimationFrame(tick); return; }
      if (!goal && completed && surfaces.length > 1) { beginJump(); return; }
      if (!goal) {
        if (completed) { edge = 0; angle = 0; }
        goal = path(active)[edge + 1]; setDirection(1);
        completed = false;
      }
      clearTimeout(idleTimer);
      if (pose.row === 4 || pose.row === 3) {
        standingUp = true; let column = 2;
        function rise() {
          if (!allowed()) { idle(); return; }
          renderPose(3, column--);
          if (column >= 0) timer = setTimeout(rise, 90);
          else timer = setTimeout(() => { standingUp = false; renderPose(5, 0); start(); }, 90);
        }
        rise(); return;
      }
      lastTime = 0; frame = requestAnimationFrame(tick);
    }
    function syncMode() {
      root.dataset.mode = mode;
      if (mode !== 'roam') root.dataset.side = mode;
      else if (!root.dataset.side) root.dataset.side = 'right';
      choices.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.duckMode === mode)));
    }
    function placeMenu() {
      if (!menuAnchor || menu.hidden) return;
      const anchor = menuAnchor.getBoundingClientRect(), width = menu.offsetWidth, height = menu.offsetHeight;
      const x = Math.max(12, Math.min(anchor.left + anchor.width / 2 - width / 2, innerWidth - width - 12));
      const y = anchor.top >= height + 20 ? anchor.top - height - 10 : anchor.bottom + 10;
      menu.style.left = x + 'px'; menu.style.top = Math.max(12, Math.min(y, innerHeight - height - 12)) + 'px';
    }
    function closeMenu(returnFocus) {
      menu.hidden = true;
      toggles.forEach(button => button.setAttribute('aria-expanded', 'false'));
      if (returnFocus && menuAnchor && !menuAnchor.closest('[hidden]')) menuAnchor.focus({ preventScroll: true });
    }
    toggles.forEach(button => button.addEventListener('click', () => {
      if (!menu.hidden && menuAnchor === button) { closeMenu(false); start(); return; }
      menuAnchor = button; menu.hidden = false;
      toggles.forEach(toggle => toggle.setAttribute('aria-expanded', String(toggle === button)));
      root.dispatchEvent(new CustomEvent('buddy-menu-open'));
      stop(); placeMenu();
    }));
    choices.forEach(button => button.addEventListener('click', () => {
      stop(); jump = turn = null; mode = button.dataset.duckMode; goal = null; restUntil = 0; completed = false; edge = 0; angle = 0;
      closeMenu(false); syncMode();
      try { localStorage.setItem('retro-duck-position', mode); } catch (_) {}
      root.dispatchEvent(new CustomEvent('duck-position-change', { detail: { mode } }));
      refreshSurfaces(true);
      doc.getElementById('duck-launcher').focus({ preventScroll: true }); start();
    }));
    walker.addEventListener('pointerenter', () => { hovered = true; stop(); });
    walker.addEventListener('pointerleave', () => { hovered = false; start(); });
    walker.addEventListener('focusin', event => { keyboardFocused = event.target.matches(':focus-visible'); if (keyboardFocused) stop(); });
    walker.addEventListener('focusout', () => queueMicrotask(() => { keyboardFocused = walker.contains(doc.activeElement) && doc.activeElement.matches(':focus-visible'); start(); }));
    root.addEventListener('duck-panel-toggle', () => { closeMenu(false); stop(); if (panel.hidden) { refreshSurfaces(false); start(); } });
    doc.addEventListener('pointerdown', event => {
      if (!menu.hidden && !menu.contains(event.target) && !toggles.some(button => button.contains(event.target))) { closeMenu(false); start(); }
    });
    doc.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !menu.hidden) { event.stopImmediatePropagation(); closeMenu(true); start(); }
    });
    function geometryChanged() {
      if (geometryFrame) return;
      geometryFrame = requestAnimationFrame(() => { geometryFrame = 0; refreshSurfaces(false); placeMenu(); start(); });
    }
    addEventListener('resize', geometryChanged); addEventListener('scroll', geometryChanged, { passive: true });
    doc.addEventListener('transitionend', event => { if (event.target.matches(platformSelector)) geometryChanged(); });
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(geometryChanged).observe(doc.body);
    doc.addEventListener('visibilitychange', () => { stop(); if (!doc.hidden) { refreshSurfaces(false); start(); } });
    reduced.addEventListener('change', () => { stop(); start(); });
    measure(); syncMode(); refreshSurfaces(true); idle(); start();
  }
  return { bounds, clamp, step, walkFrame, advanceWalk, advancePath, perimeterPath, facingForMode, turnAngle, spriteBounds, platformLane, platformOrder, jumpPoint, init };
}));
