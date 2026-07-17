// Pure math for the Particles & Attractors preset: a pool of feather
// particles roaming one shared coordinate space, pulled toward point
// attractors — one per alive window (each window's own broadcast
// `attractorStrength` meta) plus whichever window the OS cursor currently
// sits over. There's no per-window confinement wall: every window is just a
// fixed-size porthole onto this same shared space (DesktopStage's own
// per-window camera already only renders whatever falls inside that
// window's rect — see bgstaal/multipleWindow3dScene, this scene's own
// reference model), so a particle drifting from one window's territory into
// another's simply appears there, the same continuous cross-window feel as
// Fluid Sim's water or Ståål's "Entangled". A per-window wall was tried
// first and was wrong: it physically forbade a particle from ever crossing
// into a non-overlapping window, so whichever window's attractor caught the
// most particles first kept them forever and the rest stayed starved.
//
// Attraction is gravity + spin, same model as Windswept's
// physicalAttractors.js (itself "the Gravity Attractors preset of
// ParticleLab" per that file's own comment) — just 2D screen-space CPU
// physics here instead of 3D TSL compute. Pure radial attraction alone
// collapses everything onto whichever attractor a particle happens to
// wander nearest to and never lets go (no repulsion, and too little
// momentum to swing back out) — the tangential/spin term is what turns that
// into actual orbiting, letting a particle slingshot past one attractor and
// get caught by another instead of sticking to the first one it touches.

const MIN_DISTANCE = 12;
// Not a Leva control — Fluid's analogous "how far does this reach" concept
// (its grid) is bounded by the windows themselves, not a separate tunable,
// so this is a fixed constant rather than another exposed slider.
const ATTRACTOR_INFLUENCE_RADIUS = 1200;

export const DEFAULT_ATTRACTOR_STRENGTH = 600;

// Linear falloff, not inverse-square: this world's distances run into the
// thousands of px (window rects, cursor position), so an inverse-square pull
// would need enormous strength constants to read as anything at that scale —
// unlike Windswept's attractor swarm, which lives in a tiny (~60-unit) space.
// `strength` is instead the acceleration (px/s²) felt right at the
// attractor's own center, fading to 0 at ATTRACTOR_INFLUENCE_RADIUS.
// `spinStrength` scales a tangential force (perpendicular to the radial
// pull) — the 2D equivalent of Windswept's `axis.cross(toAttractor)`, since
// a cross product with a fixed screen-facing Z axis just rotates the
// in-plane radial vector 90°. Same sign/magnitude convention as the radial
// term, so cranking attractorStrength scales the whole orbit, not just the
// fall-in.
export function attractorAccel(x, y, attractors, spinStrength) {
  let ax = 0;
  let ay = 0;

  for (let i = 0; i < attractors.length; i += 1) {
    const attractor = attractors[i];
    const dx = attractor.x - x;
    const dy = attractor.y - y;
    const dist = Math.max(Math.hypot(dx, dy), MIN_DISTANCE);
    const falloff = Math.max(0, 1 - dist / ATTRACTOR_INFLUENCE_RADIUS);
    if (falloff > 0) {
      const mag = attractor.strength * falloff;
      const rx = dx / dist;
      const ry = dy / dist;
      ax += rx * mag - ry * mag * spinStrength;
      ay += ry * mag + rx * mag * spinStrength;
    }
  }

  return { x: ax, y: ay };
}

export function stepFeather(particle, accel, dt, { damping, maxSpeed }) {
  let vx = particle.vx + accel.x * dt;
  let vy = particle.vy + accel.y * dt;

  const speed = Math.hypot(vx, vy);
  if (speed > maxSpeed) {
    vx = (vx / speed) * maxSpeed;
    vy = (vy / speed) * maxSpeed;
  }
  vx *= damping;
  vy *= damping;

  return { vx, vy, x: particle.x + vx * dt, y: particle.y + vy * dt };
}

// A particle that slingshots past every attractor's influence keeps coasting
// under whatever momentum it had (high damping decays slowly on purpose —
// see attractorAccel) — rather than let it drift forever into empty desktop
// space no window will ever reach, it's reseeded once it's this far from
// every attractor. Same reasoning as Windswept's attractor swarm reseeding
// anything past its own MAX_MAGNITUDE escape radius.
const ESCAPE_DISTANCE = 2600;

export function isLost(x, y, attractors) {
  for (let i = 0; i < attractors.length; i += 1) {
    const a = attractors[i];
    if (Math.hypot(a.x - x, a.y - y) <= ESCAPE_DISTANCE) return false;
  }
  return true;
}

// Seeds inside a randomly chosen alive window's rect — mirrors
// fluidWorld.js's seedParticles (which pours into the topmost window),
// just spread across whichever windows are alive rather than only the top
// one, since there's no "pour it in" moment here.
export function randomPositionInWindows(rects) {
  const rect = rects[Math.floor(Math.random() * rects.length)];
  return {
    x: rect.x + Math.random() * rect.w,
    y: rect.y + Math.random() * rect.h,
  };
}
