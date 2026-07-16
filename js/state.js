'use strict';

let planets = [];
let player = { x: 0, y: 0, r: 6 };
let projectiles = [];
let trails = [];   // survive their projectile; points fade out over TRAIL_LIFETIME
let targets = [];
let simTime = 0;
let angle = 45;    // degrees, 0 = right, + = clockwise
let speed = 300;

let ghostPts = null;   // cached ghost trajectory
function invalidateGhost() { ghostPts = null; }

function rand(a, b) { return a + Math.random() * (b - a); }
function clampSpeed(v) { return Math.max(SPEED_MIN, Math.min(SPEED_MAX, v)); }
function wrapAngle(v) { return ((v % 360) + 360) % 360; }
