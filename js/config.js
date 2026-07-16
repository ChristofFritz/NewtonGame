'use strict';

const G = 6600;
const PROJ_LIFETIME = 20;      // seconds until timeout
const TRAIL_LIFETIME = 30;     // seconds over which a trail point fades to 0
const TRAIL_SPACING = 4;       // min px between recorded trail points
const SPEED_MIN = 15;
const SPEED_MAX = 500;
const PHYS_H = 1 / 360;        // fixed physics timestep, shared with ghost/solver sims
const INCREMENTS = [0.000001, 0.00001, 0.0001, 0.001, 0.01, 0.1, 1, 10];
