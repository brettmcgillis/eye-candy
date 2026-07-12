// Soft push-back toward the center of a worldSize cube once an agent gets
// within `margin` of an edge, ramping quadratically (0 at the margin line,
// max strength right at the wall) rather than boids-js's 1/distance term —
// that version spikes toward infinity as distance shrinks, which is what
// makes a hard boundary feel like a slingshot. Shared by both the flock and
// hunter steppers so "stay inside the box" behaves identically for both.
const out = [0, 0, 0];

function axisPush(v, half, margin) {
  const distToMax = half - v;
  const distToMin = v + half;

  if (distToMax < margin) {
    const t = 1 - Math.max(distToMax, 0) / margin;
    return -(t * t);
  }
  if (distToMin < margin) {
    const t = 1 - Math.max(distToMin, 0) / margin;
    return t * t;
  }
  return 0;
}

export default function boundaryForce(x, y, z, worldSize, margin) {
  const half = worldSize / 2;
  out[0] = axisPush(x, half, margin);
  out[1] = axisPush(y, half, margin);
  out[2] = axisPush(z, half, margin);
  return out;
}
