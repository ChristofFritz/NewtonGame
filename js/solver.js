'use strict';

// ---------- Auto-aim solver ----------
// Simulate a shot and return closest approach to tgt. Other targets and
// planets block the path, same as for a real projectile.
function simulateShot(angDeg, spd, h, maxT, tgt, rec) {
  const rad = angDeg * Math.PI / 180;
  const dx = Math.cos(rad), dy = Math.sin(rad);
  const b = {
    x: player.x + dx * (player.r + 2),
    y: player.y + dy * (player.r + 2),
    vx: dx * spd,
    vy: dy * spd,
  };
  let minDist = Math.hypot(tgt.x - b.x, tgt.y - b.y);
  let pathLen = 0;
  const steps = Math.floor(maxT / h);
  for (let i = 0; i < steps; i++) {
    const px = b.x, py = b.y;
    integrate(b, h);
    pathLen += Math.hypot(b.x - px, b.y - py);
    if (rec && i % 4 === 0) rec.push({ x: b.x, y: b.y });
    const d = Math.hypot(tgt.x - b.x, tgt.y - b.y);
    if (d < minDist) minDist = d;
    if (d < tgt.r + 1.5) return { hit: true, minDist: d, t: (i + 1) * h, len: pathLen };
    if (hitsPlanet(b.x, b.y)) break;
    const ot = hitTarget(b.x, b.y);
    if (ot && ot !== tgt) break;
    if (b.x < -5000 || b.x > W + 5000 || b.y < -5000 || b.y > H + 5000) break;
  }
  return { hit: false, minDist };
}

let solver = null;
let solvedMsg = null;

// how to choose among all candidate shots that hit the target
const solverModeSel = document.getElementById('solverMode');
solverModeSel.value = localStorage.getItem('solverMode') || 'scenic';
if (!solverModeSel.value) solverModeSel.value = 'scenic'; // stored value no longer exists
solverModeSel.addEventListener('change', () => localStorage.setItem('solverMode', solverModeSel.value));

const HIT_PICKERS = {
  scenic:   hits => hits.reduce((w, c) => (c.sp < w.sp || (c.sp === w.sp && c.t > w.t)) ? c : w),
  longest:  hits => hits.reduce((w, c) => c.len > w.len ? c : w),
  shortest: hits => hits.reduce((w, c) => c.len < w.len ? c : w),
  quickest: hits => hits.reduce((w, c) => c.t < w.t ? c : w),
  random:   hits => hits[Math.floor(rand(0, hits.length))],
};

function startSolver(tgt) {
  const candidates = [];
  for (let a = 0; a < 360; a += 1.5) {
    for (let s = 30; s <= SPEED_MAX; s += 30) candidates.push([a, s]);
  }
  solver = {
    tgt, candidates, i: 0, best: null, hit: false,
    mode: HIT_PICKERS[solverModeSel.value] ? solverModeSel.value : 'scenic',
    phase: 'coarse', da: 1.5, ds: 45, evals: 0,
    sims: 0, t0: performance.now(),
    hits: [],      // all coarse candidates that hit — mode picks the winner
    viz: [],       // recently simulated candidate paths, drawn faint
  };
  solvedMsg = null;
}

const NEIGHBORS = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

function pushViz(s, pts, hot) {
  s.viz.push({ pts, hot });
  if (s.viz.length > 80) s.viz.shift();
}

function finishSolver() {
  const s = solver;
  if (s.best) {
    angle = wrapAngle(s.best.a);
    speed = clampSpeed(s.best.sp);
    syncInputs();
    const secs = ((performance.now() - s.t0) / 1000).toFixed(2);
    solvedMsg = {
      until: simTime + 4,
      text: (s.hit
        ? `● SOLUTION LOCKED  Δ ${s.best.minDist.toFixed(2)}px\n`
        : `○ NO DIRECT HIT — closest approach Δ ${s.best.minDist.toFixed(2)}px\n`)
        + `θ ${s.best.a.toFixed(3)}°  v ${s.best.sp.toFixed(3)}\n`
        + `${s.sims} simulations in ${secs}s`,
    };
  }
  solver = null;
}

function runSolver(deadline) {
  const s = solver;
  if (s.tgt.dead || !targets.includes(s.tgt)) { solver = null; return; }

  if (s.phase === 'coarse') {
    while (s.i < s.candidates.length && performance.now() < deadline) {
      const [a, sp] = s.candidates[s.i++];
      const rec = s.i % 3 === 0 ? [] : null;
      const r = simulateShot(a, sp, 1 / 90, 8, s.tgt, rec);
      s.sims++;
      if (rec && rec.length > 1) pushViz(s, rec, false);
      if (r.hit) s.hits.push({ a, sp, minDist: r.minDist, t: r.t, len: r.len });
      if (!s.best || r.minDist < s.best.minDist) s.best = { a, sp, minDist: r.minDist };
    }
    if (s.i >= s.candidates.length) {
      // among all hitting shots the selected mode picks the winner
      // (scenic = slowest launch = gravity-dominated and curvy)
      if (s.hits.length > 0) {
        const w = HIT_PICKERS[s.mode](s.hits);
        s.best = { a: w.a, sp: w.sp, minDist: w.minDist };
      }
      // re-evaluate the coarse winner with the exact integrator
      const r = simulateShot(s.best.a, s.best.sp, PHYS_H, 12, s.tgt);
      s.sims++;
      s.best.minDist = r.minDist;
      s.hit = r.hit;
      s.phase = 'refine';
    }
    return;
  }

  // refine: hill-climb on closest approach with the exact integrator
  while (performance.now() < deadline) {
    if (s.hit || s.da < 0.00005 || s.evals > 1500) { finishSolver(); return; }
    let improved = false;
    for (const [na, ns] of NEIGHBORS) {
      const a = wrapAngle(s.best.a + na * s.da);
      const sp = clampSpeed(s.best.sp + ns * s.ds);
      const rec = [];
      const r = simulateShot(a, sp, PHYS_H, 12, s.tgt, rec);
      s.sims++;
      s.evals++;
      if (rec.length > 1) pushViz(s, rec, true);
      if (r.minDist < s.best.minDist) {
        s.best = { a, sp, minDist: r.minDist };
        improved = true;
        if (r.hit) { s.hit = true; break; }
      }
    }
    if (!improved) { s.da /= 2; s.ds /= 2; }
  }
}

// ---------- Solver status readout ----------
const solverBox = document.getElementById('solver');
const SPINNER = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏';

function updateSolverBox() {
  if (solver) {
    const s = solver;
    const spin = SPINNER[Math.floor(simTime * 12) % SPINNER.length];
    const elapsed = (performance.now() - s.t0) / 1000;
    const rate = elapsed > 0.05 ? (s.sims / elapsed / 1000).toFixed(1) + 'k' : '…';
    const phase = s.phase === 'coarse'
      ? `COARSE SWEEP  ${s.i}/${s.candidates.length}  ${s.hits.length} hits`
      : `REFINING  ±${s.da.toFixed(4)}° ±${s.ds.toFixed(2)}v`;
    solverBox.style.display = 'block';
    solverBox.textContent =
      `${spin} ORBITAL SOLVER [${s.mode}]  ${phase}\n`
      + (s.best
        ? `best Δ ${s.best.minDist.toFixed(2)}px  θ ${s.best.a.toFixed(3)}°  v ${s.best.sp.toFixed(3)}\n`
        : `scanning…\n`)
      + `${s.sims} sims  ${rate} sims/s  ${elapsed.toFixed(1)}s`;
  } else if (solvedMsg && simTime < solvedMsg.until) {
    solverBox.style.display = 'block';
    solverBox.textContent = solvedMsg.text;
  } else {
    solverBox.style.display = 'none';
  }
}
