/* eslint-disable no-param-reassign */
import { mulberry32 } from '@utils/noise2d';

function fract(v) {
  return v - Math.floor(v);
}

function random3(cx, cy, cz) {
  let j = 4096 * Math.sin(cx * 17 + cy * 59.4 + cz * 15);
  const z = fract(512 * j);
  j *= 0.125;
  const x = fract(512 * j);
  j *= 0.125;
  const y = fract(512 * j);
  return [x - 0.5, y - 0.5, z - 0.5];
}

function surflet(sx, sy, sz, dx, dy, dz) {
  const w = Math.max(0.6 - (dx * dx + dy * dy + dz * dz), 0);
  const r = random3(sx, sy, sz);
  return (r[0] * dx + r[1] * dy + r[2] * dz) * w * w * w * w;
}

export function simplex3dCpu(px, py, pz) {
  const skew = (px + py + pz) * 0.3333333;
  const sx = Math.floor(px + skew);
  const sy = Math.floor(py + skew);
  const sz = Math.floor(pz + skew);
  const unskew = (sx + sy + sz) * 0.1666667;
  const x = [px - sx + unskew, py - sy + unskew, pz - sz + unskew];

  const e = [
    x[0] - x[1] >= 0 ? 1 : 0,
    x[1] - x[2] >= 0 ? 1 : 0,
    x[2] - x[0] >= 0 ? 1 : 0,
  ];
  const i1 = [e[0] * (1 - e[2]), e[1] * (1 - e[0]), e[2] * (1 - e[1])];
  const i2 = [
    1 - e[2] * (1 - e[0]),
    1 - e[0] * (1 - e[1]),
    1 - e[1] * (1 - e[2]),
  ];
  const g = 0.1666667;

  return (
    52 *
    (surflet(sx, sy, sz, x[0], x[1], x[2]) +
      surflet(
        sx + i1[0],
        sy + i1[1],
        sz + i1[2],
        x[0] - i1[0] + g,
        x[1] - i1[1] + g,
        x[2] - i1[2] + g
      ) +
      surflet(
        sx + i2[0],
        sy + i2[1],
        sz + i2[2],
        x[0] - i2[0] + 2 * g,
        x[1] - i2[1] + 2 * g,
        x[2] - i2[2] + 2 * g
      ) +
      surflet(
        sx + 1,
        sy + 1,
        sz + 1,
        x[0] - 1 + 3 * g,
        x[1] - 1 + 3 * g,
        x[2] - 1 + 3 * g
      ))
  );
}

const SHADER_THREADS = 70;
const SHADER_NOISE_SPAN = 7;

// One entry per thread. The colour parameter is a smooth walk across the
// field, so neighbouring threads land close together on the ramp and the field
// reads as drifting bands of dyed thread rather than per-thread confetti.
//
// strandA.w carries the sine-thread shader's accumulated noise offset,
// rescaled so a field of any thread count travels the same distance through
// noise space as the shader's 70 steps.
export default function fillThreadStrands({
  colorDrift,
  count,
  seed,
  strandA,
  strandB,
}) {
  const rand = mulberry32(seed);
  const stepWeight = (2.5 * SHADER_THREADS) / Math.max(count, 1);
  let offset = 0;

  for (let k = 0; k < count; k += 1) {
    const zt = (k + 0.5) / count;
    offset += stepWeight * simplex3dCpu((zt - 0.5) * SHADER_NOISE_SPAN, 10, 10);

    const drift =
      simplex3dCpu(zt * colorDrift, 3.3, 1.7) * 0.5 +
      simplex3dCpu(zt * colorDrift * 2.7, 8.1, 4.4) * 0.25;
    const depth = rand();
    const o = k * 4;

    strandA[o] = Math.min(Math.max(drift + 0.5, 0), 1);
    strandA[o + 1] = 0.6 + rand() * 0.8;
    strandA[o + 2] = 0.05 + depth * 0.9;
    strandA[o + 3] = offset;
    strandB[o] = k % 2;
    strandB[o + 1] = rand();
    strandB[o + 2] = zt + (rand() - 0.5) / count;
    strandB[o + 3] = depth;
  }
}
