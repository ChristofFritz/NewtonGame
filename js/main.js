'use strict';

generateWorld();

let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  step(dt);
  if (solver) runSolver(performance.now() + 8); // ~8ms/frame budget
  updateSolverBox();
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
