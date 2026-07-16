'use strict';

// every gameplay parameter: configurable in the ⚙ settings panel,
// persisted in localStorage, resettable to `def`.
// `world: true` = changing it regenerates the map immediately.
const CONFIG_DEFS = [
  { key: 'G',              label: 'gravity',          def: 6600 },
  { key: 'PROJ_LIFETIME',  label: 'projectile life s', def: 20 },
  { key: 'SHARD_LIFETIME', label: 'shard life s',     def: 10 },
  { key: 'TRAIL_LIFETIME', label: 'trail fade s',     def: 30 },
  { key: 'SPEED_MIN',      label: 'speed min',        def: 15 },
  { key: 'SPEED_MAX',      label: 'speed max',        def: 500 },
  { key: 'SWEEP_MS',       label: 'sweep delay ms',   def: 200 },
  { key: 'PLANETS_MIN',    label: 'planets min',      def: 10, world: true },
  { key: 'PLANETS_MAX',    label: 'planets max',      def: 15, world: true },
  { key: 'PLANET_R_MIN',   label: 'planet radius min', def: 16, world: true },
  { key: 'PLANET_R_MAX',   label: 'planet radius max', def: 46, world: true },
  { key: 'TARGET_COUNT',   label: 'targets',          def: 6, world: true },
  { key: 'SHARDS_MIN',     label: 'shards min',       def: 3 },
  { key: 'SHARDS_MAX',     label: 'shards max',       def: 6 },
  { key: 'SHARD_V_MIN',    label: 'shard speed min',  def: 60 },
  { key: 'SHARD_V_MAX',    label: 'shard speed max',  def: 180 },
];

// values live on window so plain references (G, SPEED_MAX, …) work everywhere
function loadConfig() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem('newtonConfig')) || {}; } catch (e) { /* corrupt -> defaults */ }
  for (const d of CONFIG_DEFS) {
    const v = parseFloat(saved[d.key]);
    window[d.key] = Number.isFinite(v) ? v : d.def;
  }
}
function saveConfig() {
  const out = {};
  for (const d of CONFIG_DEFS) out[d.key] = window[d.key];
  localStorage.setItem('newtonConfig', JSON.stringify(out));
}
loadConfig();

// not user-tunable: rendering/integration internals
const TRAIL_SPACING = 4;       // min px between recorded trail points
const PHYS_H = 1 / 360;        // fixed physics timestep, shared with ghost/solver sims
const INCREMENTS = [0.000001, 0.00001, 0.0001, 0.001, 0.01, 0.1, 1, 10];
