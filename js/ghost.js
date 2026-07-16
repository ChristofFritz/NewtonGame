'use strict';

// ghost trajectory: simulates the current shot with the exact same integrator
// and timestep as real projectiles; cached until angle/speed/world changes
function ghostTrajectory() {
  if (ghostPts) return ghostPts;
  const rad = angle * Math.PI / 180;
  const dx = Math.cos(rad), dy = Math.sin(rad);
  const b = {
    x: player.x + dx * (player.r + 2),
    y: player.y + dy * (player.r + 2),
    vx: dx * speed,
    vy: dy * speed,
  };
  const pts = [{ x: b.x, y: b.y }];
  const maxSteps = Math.floor(PROJ_LIFETIME / PHYS_H);
  for (let i = 0; i < maxSteps; i++) {
    integrate(b, PHYS_H);
    if (i % 3 === 0) pts.push({ x: b.x, y: b.y });
    if (hitsPlanet(b.x, b.y) || hitTarget(b.x, b.y)) break;
    if (b.x < -5000 || b.x > W + 5000 || b.y < -5000 || b.y > H + 5000) break;
  }
  pts.push({ x: b.x, y: b.y });
  ghostPts = pts;
  return pts;
}
