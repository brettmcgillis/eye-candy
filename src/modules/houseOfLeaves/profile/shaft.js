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
  // The stair's pitch, in degrees. Constant whatever the radius does: a
  // helix that kept its rise per turn would flatten to a ramp as the shaft
  // opened.
  stairSlope: 32,
  clockwise: true,
  landingSpacing: 90,
  landingDriftAmount: 0,
  landingDriftPeriod: 6,
  landingArc: 0.09,
  stairWidth: 6,
  wallGap: 0,
  // Where the helix begins, in the shaft's frame: the top landing faces
  // whatever arrives at the rim.
  startAngle: 0,
  descentLength: Infinity,
  floorMargin: 0,
};

// Everything is parameterised by `u`, the path the stair walks in metres of
// rise. Height is *not* the same quantity: a landing consumes path without
// gaining any rise, so the two diverge by the plateaus passed so far.
//
// The shaft's shape is a function of depth, and the stair's angle is the
// running integral of 1 / (tan(slope) · radius(depth)) — so the profile is
// tabulated once per parameter bag, in order down the shaft, with each
// landing's plateau fixed from the rate at the moment the table reaches it.
// Radius, axis and angle can then never disagree about what depth they are
// at, and no quantity is measured against a sliding window.

const STEP = 0.25;
const MAX_U = 6000;
const PROFILES = new WeakMap();

function growth(depth, p) {
  const run = Math.max(1, p.growthRun);
  const t = Math.min(1, Math.max(0, depth / run));
  return p.voidRadius + (p.grownRadius - p.voidRadius) * t;
}

function radiusAtDepth(depth, p) {
  const base = growth(depth, p);
  const drift = fbm1(depth / p.radiusDriftWavelength + 3.7, 3);
  return Math.max(2, base * (1 + p.radiusDriftAmount * drift));
}

// The one countable cue a viewer has, quietly lying. The top landing is the
// rim itself and never drifts.
export function landingPosition(index, p) {
  if (index === 0) return 0;
  const drift = fbm1(index / p.landingDriftPeriod + 53.3, 3);
  return (
    index * p.landingSpacing + p.landingDriftAmount * p.landingSpacing * drift
  );
}

function profileOf(p) {
  let profile = PROFILES.get(p);
  if (!profile) {
    profile = {
      // angle[k] is the unwarped angle at u = k * STEP; rate[k] its derivative.
      angle: [p.startAngle ?? 0],
      rate: [],
      landings: [],
      nextLanding: 0,
      limit:
        (Number.isFinite(p.descentLength) ? p.descentLength : MAX_U) -
        (p.floorMargin ?? 0),
    };
    PROFILES.set(p, profile);
  }
  return profile;
}

function plateauBeforeIn(u, landings) {
  let total = 0;
  for (let i = 0; i < landings.length; i += 1) {
    const past = u - landings[i].u;
    if (past > 0) total += Math.min(past, landings[i].plateau);
  }
  return total;
}

function ensure(p, u) {
  const profile = profileOf(p);
  const need = Math.min(MAX_U / STEP, Math.ceil(u / STEP) + 2);
  const tan = Math.tan((p.stairSlope * Math.PI) / 180);
  const sign = p.clockwise ? 1 : -1;
  while (profile.angle.length <= need) {
    const k = profile.angle.length - 1;
    const uk = k * STEP;
    // A landing due here fixes its plateau from the rate at its own u.
    while (landingPosition(profile.nextLanding, p) <= uk) {
      const lu = landingPosition(profile.nextLanding, p);
      const depth = lu - plateauBeforeIn(lu, profile.landings);
      const rate = 1 / (tan * radiusAtDepth(depth, p));
      const plateau = (p.landingArc * TAU) / rate;
      if (lu >= 0 && lu + plateau <= profile.limit) {
        profile.landings.push({
          index: profile.nextLanding,
          u: lu,
          arc: p.landingArc * TAU,
          plateau,
        });
      }
      profile.nextLanding += 1;
    }
    const depth = uk - plateauBeforeIn(uk, profile.landings);
    const rate = (sign * 1) / (tan * radiusAtDepth(depth, p));
    profile.rate[k] = rate;
    profile.angle[k + 1] = profile.angle[k] + rate * STEP;
  }
  return profile;
}

export function allLandings(p) {
  const end = Number.isFinite(p.descentLength) ? p.descentLength : MAX_U;
  return ensure(p, end).landings;
}

export function landingsUpTo(u, p) {
  return ensure(p, u).landings.filter((landing) => landing.u <= u);
}

export function plateauBefore(u, landings) {
  return plateauBeforeIn(u, landings);
}

export function riseAt(u, landings) {
  return u - plateauBeforeIn(u, landings);
}

export function riseTo(u, p) {
  return u - plateauBeforeIn(u, ensure(p, u).landings);
}

export function voidRadiusAt(u, p) {
  return radiusAtDepth(riseTo(u, p), p);
}

// The axis wanders, so a lower turn is not concentric with the one above it —
// the building approximating a spiral rather than constructing one.
export function axisAt(u, p) {
  const t = riseTo(u, p) / p.axisDriftWavelength;
  return {
    x: p.axisDriftAmount * fbm1(t + 11.3, 3),
    z: p.axisDriftAmount * fbm1(t + 71.7, 3),
  };
}

// The wall stands just past the stair's outer edge. A negative gap lets the
// treads and landings sink into it, which hides their end faces instead of
// leaving them coplanar with the wall.
export function wallRadiusAt(u, p) {
  return voidRadiusAt(u, p) + p.stairWidth + p.wallGap;
}

// Displacing `u` before it becomes an angle varies the pitch, which is what
// lets one turn drift over another until down, across and more-staircase stop
// being distinguishable. Capped by the measured fbm slope so the warp can
// never run backwards and fold the helix through itself.
const WARP_SLOPE_LIMIT = 0.9;

function pitchWarpAt(u, p) {
  if (p.overlapAmount <= 0) return 0;
  const ceiling = (WARP_SLOPE_LIMIT * p.overlapWavelength) / FBM3_MAX_SLOPE;
  const metres = Math.min(p.overlapAmount, ceiling);
  return metres * fbm1(u / p.overlapWavelength + 29.1, 3);
}

function tableAngle(p, u) {
  const clamped = Math.max(0, u);
  const profile = ensure(p, clamped);
  const k = Math.floor(clamped / STEP);
  const f = clamped / STEP - k;
  return profile.angle[k] + (profile.angle[k + 1] - profile.angle[k]) * f;
}

export function angleAt(u, p) {
  return tableAngle(p, u + pitchWarpAt(u, p));
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

export function landingsInRange(fromU, toU, p) {
  return ensure(p, toU).landings.filter(
    (landing) => landing.u >= fromU && landing.u <= toU
  );
}

// The u at which the absolute rise reaches `rise`; rise never decreases with
// u, so a bisection is enough, and plateaus (where it is flat) resolve to
// their start.
export function uAtRise(rise, p, maxU = p.descentLength) {
  let lo = 0;
  let hi = Number.isFinite(maxU) ? maxU : rise * 2 + 10;
  for (let i = 0; i < 48; i += 1) {
    const mid = (lo + hi) * 0.5;
    if (riseTo(mid, p) < rise) lo = mid;
    else hi = mid;
  }
  return (lo + hi) * 0.5;
}

// Walks `u` forward until `delta` metres of rise are consumed, crossing
// plateaus for free.
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
