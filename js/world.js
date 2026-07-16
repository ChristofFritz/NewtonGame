'use strict';

function generateWorld() {
  planets = [];
  projectiles = [];
  trails = [];
  targets = [];
  const count = Math.floor(rand(PLANETS_MIN, PLANETS_MAX + 1));
  let attempts = 0;
  while (planets.length < count && attempts < 500) {
    attempts++;
    const r = rand(PLANET_R_MIN, PLANET_R_MAX);
    const p = {
      x: rand(r + 25, W - r - 25),
      y: rand(r + 25, H - r - 25),
      r,
      mass: r * r,
      hue: rand(0, 360),
    };
    if (planets.some(q => Math.hypot(q.x - p.x, q.y - p.y) < q.r + p.r + 45)) continue;
    planets.push(p);
  }

  player.x = W / 2; player.y = H / 2;
  for (let i = 0; i < 500; i++) {
    const x = rand(45, W - 45);
    const y = rand(45, H - 45);
    if (planets.every(q => Math.hypot(q.x - x, q.y - y) > q.r + 75)) {
      player.x = x; player.y = y;
      break;
    }
  }

  // targets: away from planets, player and each other
  for (let i = 0; i < 2000 && targets.length < TARGET_COUNT; i++) {
    const x = rand(30, W - 30);
    const y = rand(30, H - 30);
    if (planets.some(q => Math.hypot(q.x - x, q.y - y) < q.r + 30)) continue;
    if (Math.hypot(player.x - x, player.y - y) < 120) continue;
    if (targets.some(t => Math.hypot(t.x - x, t.y - y) < 80)) continue;
    targets.push({ x, y, r: 7 });
  }

  solver = null;
  invalidateGhost();
}
