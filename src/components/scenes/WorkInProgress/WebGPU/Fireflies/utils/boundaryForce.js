// Soft push-back toward the center of the habitat once an agent gets within
// `margin` of its edge, ramping quadratically (0 at the margin line, max
// strength right at the wall) rather than boids-js's 1/distance term — that
// version spikes toward infinity as distance shrinks, which is what makes a
// hard boundary feel like a slingshot. Shared by the flock, hunter, and
// obstacle steppers, and by clampToHabitat's hard backstop below, for both
// supported habitat shapes ('box' | 'sphere').
const out = [0, 0, 0];

function ramp(distToEdge, margin) {
  if (distToEdge >= margin) return 0;
  const t = 1 - Math.max(distToEdge, 0) / margin;
  return t * t;
}

function axisPush(v, half, margin) {
  const distToMax = half - v;
  const distToMin = v + half;
  if (distToMax < margin) return -ramp(distToMax, margin);
  if (distToMin < margin) return ramp(distToMin, margin);
  return 0;
}

function boxBoundaryForce(x, y, z, worldSize, margin) {
  const half = worldSize / 2;
  out[0] = axisPush(x, half, margin);
  out[1] = axisPush(y, half, margin);
  out[2] = axisPush(z, half, margin);
  return out;
}

function sphereBoundaryForce(x, y, z, worldSize, margin) {
  const radius = worldSize / 2;
  const dist = Math.hypot(x, y, z);
  const push = ramp(radius - dist, margin);
  if (push <= 0 || dist <= 0) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    return out;
  }
  const scale = -push / dist;
  out[0] = x * scale;
  out[1] = y * scale;
  out[2] = z * scale;
  return out;
}

export default function boundaryForce(shape, x, y, z, worldSize, margin) {
  return shape === 'sphere'
    ? sphereBoundaryForce(x, y, z, worldSize, margin)
    : boxBoundaryForce(x, y, z, worldSize, margin);
}

// Hard backstop: the soft force above is capped at a constant max magnitude
// (not unbounded as distance-to-wall shrinks), so a strong enough
// combination of other forces can still punch an agent through it — this is
// what makes "stays inside the habitat" an actual guarantee rather than just
// usually true. Also zeroes the outward velocity component on contact, so a
// clamped agent doesn't keep trying to push through the wall every
// subsequent frame — without this, an agent sitting at the edge reads as
// slamming/jittering in place instead of settling and turning away.
// Mutates posArr/velArr in place at [base, base+1, base+2].
export function clampToHabitat(shape, posArr, velArr, base, worldSize) {
  const pos = posArr;
  const vel = velArr;

  if (shape === 'sphere') {
    const radius = worldSize / 2;
    const x = pos[base];
    const y = pos[base + 1];
    const z = pos[base + 2];
    const dist = Math.hypot(x, y, z);
    if (dist > radius && dist > 0) {
      const scale = radius / dist;
      pos[base] = x * scale;
      pos[base + 1] = y * scale;
      pos[base + 2] = z * scale;

      const nx = x / dist;
      const ny = y / dist;
      const nz = z / dist;
      const outward = vel[base] * nx + vel[base + 1] * ny + vel[base + 2] * nz;
      if (outward > 0) {
        vel[base] -= outward * nx;
        vel[base + 1] -= outward * ny;
        vel[base + 2] -= outward * nz;
      }
    }
    return;
  }

  const half = worldSize / 2;
  for (let axis = 0; axis < 3; axis += 1) {
    const idx = base + axis;
    if (pos[idx] > half) {
      pos[idx] = half;
      if (vel[idx] > 0) vel[idx] = 0;
    } else if (pos[idx] < -half) {
      pos[idx] = -half;
      if (vel[idx] < 0) vel[idx] = 0;
    }
  }
}
