/* eslint-disable no-bitwise */
const smoothstep = (a, b, x) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};

function hash2(ix, iz, seed) {
  let h =
    Math.imul(ix, 374761393) +
    Math.imul(iz, 668265263) +
    Math.imul(seed, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function valueNoise(x, z, seed) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz, seed);
  const b = hash2(ix + 1, iz, seed);
  const c = hash2(ix, iz + 1, seed);
  const d = hash2(ix + 1, iz + 1, seed);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}

function fbm(x, z, seed, octaves = 4) {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i += 1) {
    sum += amp * (valueNoise(x * freq, z * freq, seed + i * 17) * 2 - 1);
    amp *= 0.5;
    freq *= 2.03;
  }
  return sum;
}

// The structure's footprint radius on the ground.
export function footRadius(structure) {
  const { max, min } = structure.bounds;
  return Math.hypot(Math.max(max[0], -min[0]), Math.max(max[2], -min[2]));
}

// The hillside a buried structure is swallowed by: it rises across the
// footprint toward `burialAngle` and falls away far beyond. Analytic, with
// the same constants as brutalistRender's splash band, which mirrors it.
export function burialAt(x, z, config) {
  if (config.burial <= 0) return 0;
  const angle = (config.burialAngle * Math.PI) / 180;
  const t = x * Math.cos(angle) + z * Math.sin(angle);
  const span = config.footprint * 0.8;
  return (
    config.burial *
    config.structureHeight *
    smoothstep(-span, span, t) *
    smoothstep(span * 10, span * 4, t)
  );
}

// Ground height in metres. Flat where the structure stands, rough a little
// way out, rolling hills beyond the clearing that hide the horizon.
export function groundAt(x, z, config, foot) {
  const seed = Math.round(config.siteSeed) + 11;
  const r = Math.hypot(x, z);
  const detail =
    fbm(x / 45, z / 45, seed) * 1.2 * smoothstep(foot, foot + 25, r);
  const clear = foot + config.clearing;
  const hills =
    config.hills *
    32 *
    fbm(x / 340, z / 340, seed + 101, 3) *
    smoothstep(clear, clear + 220, r);
  return burialAt(x, z, config) + detail + Math.max(hills, -8);
}
