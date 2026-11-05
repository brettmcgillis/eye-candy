import { perlin3 } from '@modules/materialxNoise';

const SEGMENTS = 4;

const smoothstep = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

const transform = (m, x, y, z) => [
  m[0] * x + m[4] * y + m[8] * z + m[12],
  m[1] * x + m[5] * y + m[9] * z + m[13],
  m[2] * x + m[6] * y + m[10] * z + m[14],
];

// @elements/Grass capsulePress on the CPU: the summed away-direction and the
// strongest nearness of the blade's root to the pressing capsules.
function press(root, pressers, reach) {
  let px = 0;
  let pz = 0;
  let strength = 0;
  for (let i = 0; i < pressers.count; i += 1) {
    const a = pressers.points[i * 2];
    const b = pressers.points[i * 2 + 1];
    const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const abab = Math.max(ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2, 1e-5);
    const along = Math.min(
      1,
      Math.max(
        0,
        ((root[0] - a[0]) * ab[0] +
          (root[1] - a[1]) * ab[1] +
          (root[2] - a[2]) * ab[2]) /
          abab
      )
    );
    const d = [0, 1, 2].map((k) => root[k] - (a[k] + ab[k] * along));
    const k = 1 - smoothstep(0, reach, Math.hypot(...d) - a[3]);
    const flat = Math.max(Math.hypot(d[0], d[2]), 1e-4);
    px += (d[0] / flat) * k;
    pz += (d[2] / flat) * k;
    strength = Math.max(strength, k);
  }
  return { px, pz, strength };
}

// Each blade's spine, root to tip, in world space: the straight blade's
// vertex shader (@elements/Grass straightBlade) evaluated at the capture's
// TSL `time` with the same instance data, wind and nose press.
export default function grassBlades({
  count,
  data,
  matrix,
  offsets,
  pressers = null,
  time,
  uniforms,
}) {
  const { bladeHeight, pressReach, windScale, windSpeed, windStrength } =
    uniforms;
  const blades = [];
  for (let i = 0; i < count; i += 1) {
    const ox = offsets[i * 3];
    const oy = offsets[i * 3 + 1];
    const oz = offsets[i * 3 + 2];
    const yaw = data[i * 4];
    const height = bladeHeight * data[i * 4 + 1];
    if (height > 0) {
      const gust =
        perlin3(ox * windScale + time * windSpeed, oz * windScale, time * 0.1) *
          0.5 +
        0.5;
      const flutterBase = Math.sin(time * 3 + yaw * 7) * 0.04 * windStrength;
      const pushed = pressers?.count
        ? press([ox, oy + height * 0.4, oz], pressers, pressReach)
        : null;
      const bend = pushed ? pushed.strength * 1.35 : 0;
      const away = pushed
        ? Math.max(Math.hypot(pushed.px, pushed.pz), 1e-4)
        : 1;
      const spine = [];
      for (let s = 0; s <= SEGMENTS; s += 1) {
        const t = s / SEGMENTS;
        const lean = (gust * windStrength + 0.08) * t * t * height;
        const flutter = flutterBase * t;
        const drop = ((lean * lean) / Math.max(height, 0.01)) * 0.5;
        const rise = t * height;
        const bendX = pushed ? (pushed.px / away) * rise * Math.sin(bend) : 0;
        const bendZ = pushed ? (pushed.pz / away) * rise * Math.sin(bend) : 0;
        const lift = pushed ? rise * Math.cos(bend) : rise;
        spine.push(
          transform(
            matrix,
            ox + lean * 0.8 + flutter + bendX,
            oy + lift - drop,
            oz + lean * 0.6 + bendZ
          )
        );
      }
      blades.push(spine);
    }
  }
  return blades;
}
