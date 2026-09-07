import { FBM3_MAX_SLOPE, fbm1 } from './noise';

const TAU = Math.PI * 2;

// Feet, because the source describes the shaft in feet and the numbers are the
// point: it opens from over 200 feet across to well over 500 during a single
// descent. Metres here would obscure where these came from.
export const FEET = 0.3048;

export const SHAFT_DEFAULTS = {
  voidRadius: 100 * FEET,
  grownRadius: 260 * FEET,
  growthRun: 2400,
  radiusDriftAmount: 0,
  radiusDriftWavelength: 450,
  axisDriftAmount: 0,
  axisDriftWavelength: 600,
  overlapAmount: 0,
  overlapWavelength: 800,
  risePerTurn: 90,
  clockwise: true,
  landingSpacing: 90,
  landingDriftAmount: 0,
  landingDriftPeriod: 6,
  landingArc: 0.09,
};

// Everything is parameterised by `u`, the path the stair walks in metres.
// Height is *not* the same quantity: a landing consumes path without gaining
// any rise, so the two diverge by the plateaus passed so far. Keeping the two
// apart is what stops a flight resuming a plateau's worth of rise below the
// landing it just left.

function growth(u, p) {
  const run = Math.max(1, p.growthRun);
  const t = Math.min(1, Math.max(0, u / run));
  return p.voidRadius + (p.grownRadius - p.voidRadius) * t;
}

// The shaft opens as the descent goes on. That ramp is the best-supported
// dimensional change in the source, and it is deliberately separate from the
// drift below: noise alone is symmetric and can only make the shaft breathe,
// never grow.
export function voidRadiusAt(u, p) {
  const base = growth(u, p);
  const drift = fbm1(u / p.radiusDriftWavelength + 3.7, 3);
  return Math.max(2, base * (1 + p.radiusDriftAmount * drift));
}

// The axis wanders, so a lower turn is not concentric with the one above it —
// the building approximating a spiral rather than constructing one. `origin`
// re-centres the drift on the viewer; without it the shaft slowly walks away
// from wherever the camera is standing.
export function axisAt(u, p, origin) {
  const t = u / p.axisDriftWavelength;
  return {
    x: p.axisDriftAmount * fbm1(t + 11.3, 3) - (origin ? origin.x : 0),
    z: p.axisDriftAmount * fbm1(t + 71.7, 3) - (origin ? origin.z : 0),
  };
}

// Displacing `u` before it becomes an angle varies the pitch, which is what
// lets one turn drift over another until down, across and more-staircase stop
// being distinguishable. Capped by the measured fbm slope so the warp can
// never run backwards and fold the helix through itself.
const WARP_SLOPE_LIMIT = 0.9;

function pitchWarpAt(u, p) {
  if (p.overlapAmount <= 0) return 0;
  const ceiling =
    (WARP_SLOPE_LIMIT * p.overlapWavelength) / FBM3_MAX_SLOPE / p.risePerTurn;
  const turns = Math.min(p.overlapAmount, ceiling);
  return turns * p.risePerTurn * fbm1(u / p.overlapWavelength + 29.1, 3);
}

export function angleAt(u, p) {
  const warped = u + pitchWarpAt(u, p);
  return ((TAU * warped) / p.risePerTurn) * (p.clockwise ? 1 : -1);
}

export function angleRateAt(u, p) {
  const h = 0.25;
  return (angleAt(u + h, p) - angleAt(u - h, p)) / (2 * h);
}

export function rotateXZ(x, z, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: x * c - z * s, z: x * s + z * c };
}

// The one countable cue a viewer has, quietly lying.
export function landingPosition(index, p) {
  const drift = fbm1(index / p.landingDriftPeriod + 53.3, 3);
  return (
    index * p.landingSpacing + p.landingDriftAmount * p.landingSpacing * drift
  );
}

export function landingsInRange(fromU, toU, p) {
  const slack = (1 + p.landingDriftAmount) * p.landingSpacing;
  const first = Math.floor((fromU - slack) / p.landingSpacing);
  const last = Math.ceil((toU + slack) / p.landingSpacing);
  const landings = [];
  for (let n = first; n <= last; n += 1) {
    const u = landingPosition(n, p);
    if (u >= fromU - slack && u <= toU + slack) {
      const rate = Math.max(1e-4, Math.abs(angleRateAt(u, p)));
      landings.push({
        index: n,
        u,
        arc: p.landingArc * TAU,
        plateau: (p.landingArc * TAU) / rate,
      });
    }
  }
  return landings;
}

export function plateauBefore(u, landings) {
  let total = 0;
  for (let i = 0; i < landings.length; i += 1) {
    const past = u - landings[i].u;
    if (past > 0) total += Math.min(past, landings[i].plateau);
  }
  return total;
}

export function riseAt(u, landings) {
  return u - plateauBefore(u, landings);
}

// Walks `u` forward until `delta` metres of rise are consumed, crossing
// plateaus for free. Solving `riseAt(u) = target` directly stalls whenever the
// answer lands inside a landing, where rise is flat and the solve has no
// gradient to follow.
export function advanceRise(fromU, delta, landings) {
  let u = fromU;
  let remaining = delta;
  let guard = 0;
  while (remaining > 1e-9 && guard < 128) {
    let inside = null;
    let nextStart = Infinity;
    for (let i = 0; i < landings.length; i += 1) {
      const landing = landings[i];
      const end = landing.u + landing.plateau;
      if (u >= landing.u && u < end) {
        if (inside === null || end > inside) inside = end;
      } else if (landing.u > u && landing.u < nextStart) {
        nextStart = landing.u;
      }
    }
    if (inside !== null) {
      u = inside;
    } else {
      const step = Math.min(remaining, nextStart - u);
      u += step;
      remaining -= step;
    }
    guard += 1;
  }
  return u;
}

// Where a landing is, a walker is on flat ground; between them they are on
// treads. Returns null between landings.
export function landingAt(u, landings) {
  for (let i = 0; i < landings.length; i += 1) {
    const landing = landings[i];
    if (u >= landing.u && u <= landing.u + landing.plateau) return landing;
  }
  return null;
}
