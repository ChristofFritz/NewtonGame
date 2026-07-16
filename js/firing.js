'use strict';

// ---------- Trail colour ----------
const trailColorInput = document.getElementById('trailColor');
let playerRGB = '127, 180, 232';
function setTrailColor(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return;
  playerRGB = [1, 3, 5].map(i => parseInt(hex.substr(i, 2), 16)).join(', ');
  trailColorInput.value = hex;
  localStorage.setItem('trailColor', hex);
}
setTrailColor(localStorage.getItem('trailColor') || '#7fb4e8');
trailColorInput.addEventListener('input', () => setTrailColor(trailColorInput.value));

// ---------- Firing ----------
function spawnProjectile(x, y, vx, vy, small) {
  const hue = rand(0, 360).toFixed(0);
  const trail = {
    points: [{ x, y, t: simTime }],
    done: false,
    // player trails read the live picker colour; shard trails are faint
    stroke: small
      ? (a => `hsla(${hue}, 25%, 68%, ${a * 0.3})`)
      : (a => `rgba(${playerRGB}, ${a})`),
  };
  trails.push(trail);
  projectiles.push({
    x, y, vx, vy,
    age: 0,
    lifetime: small ? 10 : PROJ_LIFETIME,
    small: !!small,
    trail,
  });
}

function fire() {
  const rad = angle * Math.PI / 180;
  const dx = Math.cos(rad), dy = Math.sin(rad); // + = clockwise, 0° = right
  spawnProjectile(
    player.x + dx * (player.r + 2),
    player.y + dy * (player.r + 2),
    dx * speed,
    dy * speed
  );
}

function explodeTarget(t) {
  const n = Math.floor(rand(3, 7)); // 3-6 shards
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2);
    const v = rand(60, 180);
    spawnProjectile(
      t.x + Math.cos(a) * (t.r + 2),
      t.y + Math.sin(a) * (t.r + 2),
      Math.cos(a) * v,
      Math.sin(a) * v,
      true
    );
  }
}
