'use strict';

function accelAt(x, y) {
  let ax = 0, ay = 0;
  for (const p of planets) {
    const dx = p.x - x, dy = p.y - y;
    const d2 = dx * dx + dy * dy;
    const d = Math.sqrt(d2);
    const f = G * p.mass / (d2 * d + 8000); // softened
    ax += dx * f;
    ay += dy * f;
  }
  return [ax, ay];
}

// one fixed-size integration step for a single body; identical math is used
// by the ghost and solver sims so predicted and actual trajectories match
function integrate(b, h) {
  const [ax, ay] = accelAt(b.x, b.y);
  b.vx += ax * h;
  b.vy += ay * h;
  b.x += b.vx * h;
  b.y += b.vy * h;
}

function hitsPlanet(x, y) {
  for (const p of planets) {
    if (Math.hypot(p.x - x, p.y - y) < p.r + 1) return true;
  }
  return false;
}

function hitTarget(x, y) {
  for (const t of targets) {
    if (!t.dead && Math.hypot(t.x - x, t.y - y) < t.r + 1.5) return t;
  }
  return null;
}

let physAcc = 0;
function step(dt) {
  simTime += dt;
  physAcc += dt;
  while (physAcc >= PHYS_H) {
    physAcc -= PHYS_H;
    for (const pr of projectiles) {
      if (pr.dead) continue;
      pr.age += PHYS_H;
      if (pr.age > pr.lifetime) { pr.dead = true; continue; }

      integrate(pr, PHYS_H);

      // record trail point if far enough from the last one
      const pts = pr.trail.points;
      const lastPt = pts[pts.length - 1];
      if (Math.hypot(pr.x - lastPt.x, pr.y - lastPt.y) >= TRAIL_SPACING) {
        pts.push({ x: pr.x, y: pr.y, t: simTime });
      }

      if (hitsPlanet(pr.x, pr.y)) { pr.dead = true; continue; }
      const t = hitTarget(pr.x, pr.y);
      if (t) {
        t.dead = true;
        explodeTarget(t);
        invalidateGhost();
        pr.dead = true;
        continue;
      }
      if (pr.x < -5000 || pr.x > W + 5000 || pr.y < -5000 || pr.y > H + 5000) pr.dead = true;
    }
  }

  for (const pr of projectiles) {
    if (pr.dead) {
      pr.trail.points.push({ x: pr.x, y: pr.y, t: simTime });
      pr.trail.done = true;
    }
  }
  projectiles = projectiles.filter(pr => !pr.dead);
  targets = targets.filter(t => !t.dead);

  // drop trail points older than TRAIL_LIFETIME (fully faded)
  for (const tr of trails) {
    const pts = tr.points;
    let drop = 0;
    while (drop < pts.length && simTime - pts[drop].t > TRAIL_LIFETIME) drop++;
    if (drop > 0) pts.splice(0, drop);
  }
  trails = trails.filter(tr => tr.points.length > 1 || !tr.done);
}
