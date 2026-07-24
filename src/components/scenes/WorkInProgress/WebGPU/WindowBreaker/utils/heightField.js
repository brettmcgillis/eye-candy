import { COLLIDER_SEGMENTS, GROUND_HALF, TAPER_MARGIN } from './sceneLayout';

// CPU port of the soil studio's shared terrain height field (grass.js /
// main.js HEIGHT_FUNCTIONS). It is the single source of truth: the terrain
// mesh displaces its vertices by it, the grass snaps its blade roots to it,
// and the Rapier heightfield collider is sampled from it — so visual and
// physics always agree.

function fract(x) {
  return x - Math.floor(x);
}

function mod289(x) {
  return x - Math.floor(x * (1 / 289)) * 289;
}

function permute(x) {
  return mod289((x * 34 + 1) * x);
}

function smoothstep(edge0, edge1, x) {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

// Ashima 2D simplex noise (scalar port of the snoise used in-shader).
function snoise(x, y) {
  const F2 = 0.366025403784439;
  const G2 = 0.211324865405187;
  const s = (x + y) * F2;
  let i = Math.floor(x + s);
  let j = Math.floor(y + s);
  const t = (i + j) * G2;
  const x0 = x - (i - t);
  const y0 = y - (j - t);
  const i1 = x0 > y0 ? 1 : 0;
  const j1 = x0 > y0 ? 0 : 1;
  const x1 = x0 - i1 + G2;
  const y1 = y0 - j1 + G2;
  const x2 = x0 - 1 + 2 * G2;
  const y2 = y0 - 1 + 2 * G2;

  i = mod289(i);
  j = mod289(j);
  const p0 = permute(permute(j) + i);
  const p1 = permute(permute(j + j1) + i + i1);
  const p2 = permute(permute(j + 1) + i + 1);

  const grad = (p, gx, gy) => {
    const gxr = 2 * fract(p * 0.024390243902439) - 1;
    const h = Math.abs(gxr) - 0.5;
    const a0 = gxr - Math.floor(gxr + 0.5);
    const norm = 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    return norm * (a0 * gx + h * gy);
  };

  let m0 = Math.max(0.5 - (x0 * x0 + y0 * y0), 0);
  let m1 = Math.max(0.5 - (x1 * x1 + y1 * y1), 0);
  let m2 = Math.max(0.5 - (x2 * x2 + y2 * y2), 0);
  m0 *= m0;
  m0 *= m0;
  m1 *= m1;
  m1 *= m1;
  m2 *= m2;
  m2 *= m2;

  return (
    130 *
    (m0 * grad(p0, x0, y0) + m1 * grad(p1, x1, y1) + m2 * grad(p2, x2, y2))
  );
}

function fbm(x, y) {
  let value = 0;
  let amp = 0.5;
  let px = x;
  let py = y;
  for (let i = 0; i < 5; i += 1) {
    value += amp * snoise(px, py);
    px *= 2;
    py *= 2;
    amp *= 0.5;
  }
  return value;
}

function edgeTaper(x, z) {
  const inner = GROUND_HALF - TAPER_MARGIN;
  const ex = smoothstep(GROUND_HALF, inner, Math.abs(x));
  const ez = smoothstep(GROUND_HALF, inner, Math.abs(z));
  return ex * ez;
}

export function mossMaskAt(x, z, cfg) {
  if (!cfg.mossEnabled) {
    return 0;
  }
  const n =
    fbm(x * cfg.mossScale + cfg.mossSeedX, z * cfg.mossScale + cfg.mossSeedY) *
      0.5 +
    0.5;
  const threshold = mix(1 + cfg.mossEdge, -cfg.mossEdge, cfg.mossCoverage);
  return smoothstep(threshold - cfg.mossEdge, threshold + cfg.mossEdge, n);
}

function mossHeightAt(x, z, cfg) {
  const mask = mossMaskAt(x, z, cfg);
  if (mask <= 0) {
    return 0;
  }
  const drift =
    fbm(x * cfg.mossBumpScale + 31.7, z * cfg.mossBumpScale + 31.7) * 0.5 + 0.5;
  const h =
    mask *
    (1 - 0.4 * cfg.mossBumpStrength + 0.4 * cfg.mossBumpStrength * drift);
  return cfg.mossDepth * h * edgeTaper(x, z);
}

export function toHeightConfig(terrain) {
  return {
    moundScale: terrain.moundScale,
    moundDepth: terrain.moundDepth,
    moundCoverage: terrain.moundCoverage,
    moundEdge: terrain.moundEdge,
    bumpScale: terrain.bumpScale,
    bumpStrength: terrain.bumpStrength,
    seedX: 8.3 + terrain.terrainSeed,
    seedY: 2.1 + terrain.terrainSeed,
    mossEnabled: terrain.mossEnabled,
    mossScale: terrain.mossScale,
    mossCoverage: terrain.mossCoverage,
    mossEdge: terrain.mossEdge,
    mossDepth: terrain.mossDepth,
    mossBumpScale: terrain.mossBumpScale,
    mossBumpStrength: terrain.mossBumpStrength,
    mossSeedX: 4.2 + terrain.terrainSeed,
    mossSeedY: 6.6 + terrain.terrainSeed,
  };
}

// Where grass grows: the soil studio's grass coverage mask (grass.js
// grassMaskAt). 0 = bare, 1 = fully grassed, soft randomizable patches.
export function grassCoverageAt(x, z, cfg) {
  const n =
    fbm(x * cfg.maskScale + cfg.maskSeedX, z * cfg.maskScale + cfg.maskSeedY) *
      0.5 +
    0.5;
  const threshold = mix(1 + cfg.maskEdge, -cfg.maskEdge, cfg.coverage);
  return smoothstep(threshold - cfg.maskEdge, threshold + cfg.maskEdge, n);
}

export function groundHeightAt(x, z, cfg) {
  const base =
    fbm(x * cfg.moundScale + cfg.seedX, z * cfg.moundScale + cfg.seedY) * 0.5 +
    0.5;
  const drift =
    fbm(
      x * cfg.bumpScale + cfg.seedX * 0.5,
      z * cfg.bumpScale + cfg.seedY * 0.5
    ) *
      0.5 +
    0.5;
  let h = base * (1 - 0.4 * cfg.bumpStrength + 0.4 * cfg.bumpStrength * drift);
  const threshold = mix(1 + cfg.moundEdge, -cfg.moundEdge, cfg.moundCoverage);
  h *= smoothstep(threshold - cfg.moundEdge, threshold + cfg.moundEdge, base);
  return cfg.moundDepth * h * edgeTaper(x, z) + mossHeightAt(x, z, cfg);
}

// Regular-grid sample of the height field for the Rapier heightfield collider.
// Rows run along +x, columns along +z; row-major, (segments+1)^2 samples.
export function buildColliderHeights(cfg, segments = COLLIDER_SEGMENTS) {
  const rows = segments + 1;
  const heights = new Float32Array(rows * rows);
  const step = (GROUND_HALF * 2) / segments;
  for (let r = 0; r < rows; r += 1) {
    const x = -GROUND_HALF + r * step;
    for (let c = 0; c < rows; c += 1) {
      const z = -GROUND_HALF + c * step;
      heights[r * rows + c] = groundHeightAt(x, z, cfg);
    }
  }
  return heights;
}
