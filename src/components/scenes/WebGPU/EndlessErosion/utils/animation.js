const { PI } = Math;

const clamp01 = (x) => Math.min(1, Math.max(0, x));

const smoothstep01 = (x) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};

const lerp = (a, b, t) => a + (b - a) * t;

// The reference's parameter tour: ease down to `lo`, up to `hi`, then back to
// where the control was left, on a two-second beat.
const animateLoHi = (value, lo, hi, time) => {
  let out = lerp(value, lo, smoothstep01(time));
  out = lerp(out, hi, smoothstep01(time - 2));
  return lerp(out, value, smoothstep01(time - 4));
};

const animateWaveTo = (value, target, time) =>
  lerp(value, target, 0.5 - 0.5 * Math.cos(3 * clamp01(time) * PI));

// A 30-second cycle over the erosion controls, which is what makes a stateless
// filter read as erosion happening rather than erosion having happened. Returns
// overrides only, so an untouched control keeps whatever the panel says.
export function animatedErosion(controls, time) {
  const cycle = (time * 0.5) % 30;

  let crease = controls.creaseRounding;
  let ridge = controls.ridgeRounding;

  crease = animateWaveTo(crease, 1, cycle - 19);
  ridge = animateWaveTo(ridge, 1, cycle - 21);
  crease = animateWaveTo(crease, 0, cycle - 23);
  ridge = animateWaveTo(ridge, controls.ridgeRounding, cycle - 25);

  return {
    creaseRounding: crease,
    detail: animateLoHi(controls.detail, 3, 0.7, cycle - 13),
    ridgeRounding: ridge,
    scale: animateLoHi(controls.scale, 0.08, 0.25, cycle - 7),
    strength: animateLoHi(controls.strength, 0.01, 0.1, cycle - 1),
  };
}

// The waterline creeps up and back down over two minutes, independently of the
// erosion cycle, so the shoreline never lands on the same gullies twice.
export function animatedWaterHeight(base, time) {
  const cycle = time % 120;
  return (
    base +
    0.1 * (smoothstep01((cycle - 54) / 6) - smoothstep01((cycle - 114) / 6))
  );
}

// An integer/fractional split of the scroll, exactly as the reference does it:
// the integer part shifts what gets baked, the fraction shifts where it is read
// from, so the terrain slides smoothly without the bake reseeding every frame.
export function scrollOffset(time, { period, radius, drift }, resolution) {
  const phase = (time / period) * 2 * PI;
  const x = Math.cos(phase) * radius;
  const y = -Math.sin(phase) * drift;

  const intX = Math.round(x * resolution) / resolution;
  const intY = Math.round(y * resolution) / resolution;

  return { fracX: x - intX, fracY: y - intY, intX, intY };
}
