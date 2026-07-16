'use strict';

const settingsDiv = document.getElementById('settings');
const settingsToggle = document.getElementById('settingsToggle');
settingsToggle.addEventListener('click', () => {
  settingsDiv.hidden = !settingsDiv.hidden;
});

function afterConfigChange(def) {
  speed = clampSpeed(speed); // in case SPEED_MIN/MAX moved
  syncInputs();
  invalidateGhost();
  if (def && def.world) generateWorld();
}

const cfgInputs = {};
for (const def of CONFIG_DEFS) {
  const field = document.createElement('label');
  field.className = 'cfg';
  const name = document.createElement('span');
  name.textContent = def.label;
  const inp = document.createElement('input');
  inp.type = 'number';
  inp.step = 'any';
  inp.value = window[def.key];
  inp.title = `default: ${def.def}`;
  inp.addEventListener('change', () => {
    const v = parseFloat(inp.value);
    if (!Number.isFinite(v)) { inp.value = window[def.key]; return; }
    window[def.key] = v;
    saveConfig();
    afterConfigChange(def);
  });
  cfgInputs[def.key] = inp;
  field.append(name, inp);
  settingsDiv.appendChild(field);
}

const resetBtn = document.createElement('button');
resetBtn.id = 'resetConfig';
resetBtn.textContent = '↺ reset defaults';
resetBtn.addEventListener('click', () => {
  for (const def of CONFIG_DEFS) {
    window[def.key] = def.def;
    cfgInputs[def.key].value = def.def;
  }
  localStorage.removeItem('newtonConfig');
  // also reset the other persisted preferences
  localStorage.removeItem('trailColor');
  setTrailColor('#7fb4e8');
  if (!ghostCheckbox.checked) {
    ghostCheckbox.checked = true;
    ghostCheckbox.dispatchEvent(new Event('change'));
  }
  afterConfigChange({ world: true });
});
settingsDiv.appendChild(resetBtn);
