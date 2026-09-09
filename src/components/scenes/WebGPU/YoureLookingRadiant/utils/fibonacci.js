/* eslint-disable no-continue */
// Phyllotaxis spiral, ported from the fib() in youssef_afella's HRC 2D GI
// (https://www.shadertoy.com/view/WfyyDm), itself after julianlumia's
// https://www.shadertoy.com/view/wllyzH.
//
// Three details from the reference that carry the whole look:
//
//   * the angle step is 2.3067 radians, NOT the golden angle. Close enough to
//     look like phyllotaxis, far enough off to drift into visible arms.
//   * `r = x/count - t*t` goes negative as the breath swells, and `sqrt` of
//     that is NaN in GLSL, which loses every comparison in the union — so
//     those balls silently vanish rather than collapsing to the centre. Skipped
//     here, which is the same thing without relying on NaN.
//   * value is `clamp(v^5)` falling off with radius, so the inner balls are
//     bright and the rim goes black. This scene's emit-or-occlude split comes
//     out of the reference for free rather than being imposed on it.

const ANGLE_STEP = 2.3067;
const BALL_RADIUS = 0.017;
const LIGHT_THRESHOLD = 0.02;

function hsvToRgb(h, s, v) {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0:
      return [v, t, p];
    case 1:
      return [q, v, p];
    case 2:
      return [p, v, t];
    case 3:
      return [p, q, v];
    case 4:
      return [t, p, v];
    default:
      return [v, p, q];
  }
}

export default function writeFibonacci(
  out,
  counts,
  params,
  { aspect, maxBodies, maxLights, scale, time }
) {
  if (!params.fibEnabled) return counts;

  const centerX = aspect * 0.5 * scale;
  const centerY = 0.5 * scale;
  const spiralRadius = params.fibRadius;
  const breath = Math.sin(time * params.fibBreath) * 0.5 + 0.5;
  const squeeze = breath * breath;

  let { bodyCount, lightCount } = counts;

  for (let x = 0; x < params.fibCount; x += 1) {
    if (bodyCount >= maxBodies) break;

    const angle = x * ANGLE_STEP + time * params.fibSpin;
    const span = x / params.fibCount - squeeze;

    if (span < 0) continue;

    const r = spiralRadius * Math.sqrt(span);
    const px = centerX + Math.cos(angle) * r * scale;
    const py = centerY + Math.sin(angle) * r * scale;

    const falloff = 1 - r / spiralRadius + 0.1;
    const emission = Math.min(1, Math.max(0, falloff ** 5));
    const radius = params.fibBallRadius * scale;

    const body = out.bodies[bodyCount];
    body.angle = angle;
    body.aperture = 0;
    body.bodyRadius = radius;
    body.centerX = centerX;
    body.centerY = centerY;
    body.color = hsvToRgb((((angle / (Math.PI * 2)) % 1) + 1) % 1, 1, 1);
    body.emission = emission;
    body.occluderRadius = radius * (1 - emission);
    // The arc encoding already carries a point at a radius and bearing, which
    // is exactly what a ball on a spiral is — no new shape needed.
    body.orbit = r * scale;
    body.owner = bodyCount;
    body.shape = 0;

    const bodyIndex = bodyCount;
    bodyCount += 1;

    // The value ramp is a fifth power, so most of the spiral sits at an
    // emission that costs a light and a shadow-map row to contribute nothing
    // visible. Only the balls that actually read as lit get one.
    if (emission <= LIGHT_THRESHOLD || lightCount >= maxLights) continue;

    const light = out.lights[lightCount];
    light.color = body.color;
    light.intensity = emission * params.lightStrength;
    light.owner = bodyIndex;
    light.radius = radius;
    light.x = px;
    light.y = py;

    lightCount += 1;
  }

  return { bodyCount, lightCount };
}

export { BALL_RADIUS };
