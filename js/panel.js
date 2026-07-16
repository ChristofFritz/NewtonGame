'use strict';

const angleInput = document.getElementById('angle');
const speedInput = document.getElementById('speed');

function syncInputs() {
  angleInput.value = angle.toFixed(6);
  speedInput.value = speed.toFixed(6);
  invalidateGhost();
}
syncInputs();

// click = single adjust; holding = "sweep": every 200ms adjust again AND fire
function pressable(b, apply) {
  let timer = null;
  const stop = () => { clearInterval(timer); timer = null; };
  b.addEventListener('pointerdown', () => {
    apply();
    timer = setInterval(() => { apply(); fire(); }, 200);
  });
  b.addEventListener('pointerup', stop);
  b.addEventListener('pointerleave', stop);
  b.addEventListener('pointercancel', stop);
}

function makeButtons(row, apply) {
  const input = row.querySelector('input');
  for (const inc of [...INCREMENTS].reverse()) {
    const b = document.createElement('button');
    b.textContent = '-' + inc;
    pressable(b, () => apply(-inc));
    row.insertBefore(b, input);
  }
  const anchor = input.nextSibling;
  for (const inc of INCREMENTS) {
    const b = document.createElement('button');
    b.textContent = '+' + inc;
    pressable(b, () => apply(inc));
    row.insertBefore(b, anchor);
  }
}

makeButtons(document.getElementById('angleRow'), d => {
  angle = wrapAngle(angle + d);
  syncInputs();
});
makeButtons(document.getElementById('speedRow'), d => {
  speed = clampSpeed(speed + d);
  syncInputs();
});

angleInput.addEventListener('change', () => {
  const v = parseFloat(angleInput.value);
  if (!isNaN(v)) angle = wrapAngle(v);
  syncInputs();
});
speedInput.addEventListener('change', () => {
  const v = parseFloat(speedInput.value);
  if (!isNaN(v)) speed = clampSpeed(v);
  syncInputs();
});

document.getElementById('fire').addEventListener('click', fire);

// ghost trajectory toggle, persisted
const ghostCheckbox = document.getElementById('showGhost');
let showGhost = localStorage.getItem('showGhost') !== '0';
ghostCheckbox.checked = showGhost;
ghostCheckbox.addEventListener('change', () => {
  showGhost = ghostCheckbox.checked;
  localStorage.setItem('showGhost', showGhost ? '1' : '0');
});

canvas.addEventListener('mousedown', e => {
  // click on (or near) a target starts the auto-aim solver
  let nearest = null, nd = 15;
  for (const t of targets) {
    const d = Math.hypot(t.x - e.clientX, t.y - e.clientY);
    if (d < nd) { nd = d; nearest = t; }
  }
  if (nearest) startSolver(nearest);
});

window.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === 'r' || e.key === 'R') generateWorld();
  if (e.key === 'g' || e.key === 'G') {
    ghostCheckbox.checked = !ghostCheckbox.checked;
    ghostCheckbox.dispatchEvent(new Event('change'));
  }
  if (e.key === ' ') { e.preventDefault(); fire(); }
});
