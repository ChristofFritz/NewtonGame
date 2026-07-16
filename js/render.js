'use strict';

const stars = Array.from({ length: 130 }, () => ({
  x: Math.random(), y: Math.random(), a: rand(0.1, 0.45),
}));

function draw() {
  ctx.fillStyle = '#07080c';
  ctx.fillRect(0, 0, W, H);

  // stars: single device pixels
  ctx.fillStyle = '#c8cdd8';
  for (const s of stars) {
    ctx.globalAlpha = s.a;
    ctx.fillRect(s.x * W, s.y * H, HAIRLINE, HAIRLINE);
  }
  ctx.globalAlpha = 1;

  // trails: fine polylines, each point fades linearly to 0 over TRAIL_LIFETIME.
  // segments are batched into 16 alpha buckets (age is monotonic along a
  // trail, so buckets form few consecutive runs — cheap to stroke)
  ctx.lineWidth = HAIRLINE;
  for (const tr of trails) {
    const pts = tr.points;
    if (pts.length < 2) continue;
    let bucket = -1;
    let open = false;
    for (let i = 1; i < pts.length; i++) {
      const life = 1 - (simTime - pts[i].t) / TRAIL_LIFETIME;
      const b = Math.max(0, Math.min(15, Math.floor(life * 16)));
      if (b !== bucket) {
        if (open) ctx.stroke();
        bucket = b;
        ctx.strokeStyle = tr.stroke(0.85 * (b + 0.5) / 16);
        ctx.beginPath();
        ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
        open = true;
      }
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    if (open) ctx.stroke();
  }

  // solver: faint fan of candidate trajectories being tested
  if (solver) {
    ctx.lineWidth = HAIRLINE;
    for (const v of solver.viz) {
      ctx.strokeStyle = v.hot ? 'hsla(38, 80%, 65%, 0.25)' : 'hsla(38, 60%, 60%, 0.07)';
      ctx.beginPath();
      ctx.moveTo(v.pts[0].x, v.pts[0].y);
      for (let i = 1; i < v.pts.length; i++) ctx.lineTo(v.pts[i].x, v.pts[i].y);
      ctx.stroke();
    }
  }

  // ghost trajectory of the current shot
  if (showGhost) {
    const ghost = ghostTrajectory();
    if (ghost.length > 1) {
      ctx.strokeStyle = 'rgba(200, 205, 216, 0.28)';
      ctx.beginPath();
      ctx.moveTo(ghost[0].x, ghost[0].y);
      for (let i = 1; i < ghost.length; i++) ctx.lineTo(ghost[i].x, ghost[i].y);
      ctx.stroke();
    }
  }

  // planets: dark muted fill, hairline rim
  for (const p of planets) {
    ctx.fillStyle = `hsl(${p.hue}, 10%, 16%)`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `hsl(${p.hue}, 14%, 42%)`;
    ctx.lineWidth = HAIRLINE;
    ctx.stroke();
  }

  // targets: thin double ring; pulsing highlight while being solved
  ctx.lineWidth = HAIRLINE;
  for (const t of targets) {
    ctx.strokeStyle = 'hsla(38, 55%, 62%, 0.9)';
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.r * 0.45, 0, Math.PI * 2);
    ctx.stroke();
    if (solver && solver.tgt === t) {
      ctx.strokeStyle = `hsla(38, 80%, 70%, ${0.5 + 0.4 * Math.sin(simTime * 8)})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.r + 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // projectiles: small bright points
  ctx.fillStyle = '#f0f2f5';
  for (const pr of projectiles) {
    ctx.beginPath();
    ctx.arc(pr.x, pr.y, pr.small ? 0.8 : 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // player: small dot with thin ring
  ctx.fillStyle = '#e5e7eb';
  ctx.beginPath();
  ctx.arc(player.x, player.y, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(229, 231, 235, 0.5)';
  ctx.lineWidth = HAIRLINE;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.stroke();
}
