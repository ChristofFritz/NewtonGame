# Newton Game

A small orbital-mechanics shooter on an HTML canvas. Static planets bend
your projectiles' paths with inverse-square gravity; thread shots through
the gravity field to hit targets, which explode into shards.

Inspired by [NewtonWars](https://github.com/Draradech/NewtonWars).

## Play

Open `index.html` in a browser. No build, no dependencies.

- **Angle / Speed** — set via the bottom panel; ± buttons step from 0.001 to 10
- **Sweep** — hold a ± button: every 200 ms it steps again and fires
- **Space / FIRE** — shoot
- **Click a target** — the auto-aim solver searches for an angle/speed that
  hits it (prefers slow, curvy slingshot solutions)
- **G** — toggle the ghost trajectory preview
- **R** — new map

## Notes

- Physics runs on a fixed timestep; the ghost preview and the solver use the
  exact same integrator, so predicted paths match real shots.
- Trails fade linearly over 30 seconds; player trail colour is configurable
  (colour picker, persisted in localStorage).

MIT licensed.
