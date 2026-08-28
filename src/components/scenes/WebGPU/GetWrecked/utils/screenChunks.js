/* eslint-disable camelcase, no-param-reassign */
// Screen-space chunk masks shared by the pixel sort and slit scan passes:
// which parts of the frame a capture artifact is allowed to eat. Mode is a
// build-time branch rather than a uniform so an unused generator never lands
// in the graph.
import {
  float,
  floor,
  fract,
  hash,
  mix,
  mx_noise_float,
  screenUV,
  select,
  smoothstep,
  time,
  uniform,
  vec2,
  vec3,
} from 'three/tsl';

export const CHUNK_MODES = {
  Full: 'full',
  Bands: 'bands',
  Noise: 'noise',
  Cells: 'cells',
};

export function createChunkUniforms() {
  return {
    axis: uniform(0),
    count: uniform(12),
    cross: uniform(8),
    coverage: uniform(0.5),
    speed: uniform(0),
    seed: uniform(0),
  };
}

export function syncChunkUniforms(
  u,
  axis,
  count,
  cross,
  coverage,
  speed,
  seed
) {
  u.axis.value = axis === 'vertical' ? 1 : 0;
  u.count.value = count;
  u.cross.value = cross;
  u.coverage.value = coverage;
  u.speed.value = speed;
  u.seed.value = seed;
}

function alongAxis(u) {
  return mix(screenUV.y, screenUV.x, u.axis);
}

function acrossAxis(u) {
  return mix(screenUV.x, screenUV.y, u.axis);
}

function bandMask(u) {
  const index = floor(alongAxis(u).mul(u.count).add(time.mul(u.speed)));
  // hash() truncates to uint, so the seed has to clear zero even when the
  // scroll has run the band index negative.
  const seed = index.add(u.seed).add(4096);
  return {
    mask: select(hash(seed).lessThan(u.coverage), float(1), float(0)),
    chunkHash: hash(seed.add(17)),
  };
}

function noiseMask(u) {
  const n = mx_noise_float(
    vec3(
      alongAxis(u).mul(u.count),
      acrossAxis(u).mul(u.cross),
      time.mul(u.speed).add(u.seed)
    )
  )
    .mul(0.5)
    .add(0.5);
  const cut = float(1).sub(u.coverage);

  return {
    mask: smoothstep(cut.sub(0.06), cut.add(0.06), n),
    chunkHash: fract(n.mul(97.13)),
  };
}

function cellMask(u) {
  const cells = vec2(
    mix(u.cross, u.count, u.axis),
    mix(u.count, u.cross, u.axis)
  );
  const cell = floor(screenUV.mul(cells).add(vec2(time.mul(u.speed), 0)));
  const seed = cell.x.add(4096).add(cell.y.add(4096).mul(9973)).add(u.seed);

  return {
    mask: select(hash(seed).lessThan(u.coverage), float(1), float(0)),
    chunkHash: hash(seed.add(17)),
  };
}

export function buildChunkMask(mode, u) {
  if (mode === CHUNK_MODES.Bands) return bandMask(u);
  if (mode === CHUNK_MODES.Noise) return noiseMask(u);
  if (mode === CHUNK_MODES.Cells) return cellMask(u);

  return { mask: float(1), chunkHash: float(0.5) };
}
