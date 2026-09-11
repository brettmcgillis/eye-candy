import { fbm2, mulberry32, valueNoise2 } from '@utils/noise2d';

import { WORLD_SIZE } from './constants';

function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}

function smoothstep(edge0, edge1, x) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function ridged(x, z, seed, octaves) {
  return 1 - Math.abs(fbm2(x, z, { seed, octaves }) * 2 - 1);
}

// Metres landward of the waterline: positive over rock, negative over water.
// The coastline is a straight sheared line pushed around by two octaves of
// domain warp, which is what turns a beach into the ragged fingers and inlets
// the reference footage has. Evaluating the warp at the sample point rather
// than solving for a true distance makes this an estimate, which is all the
// height profile below needs.
function coastDistance(worldX, worldZ, config) {
  const { coastLine, coastRagged, coastTilt, shoreSeed } = config;

  const warpBroad =
    fbm2(worldX * 0.035, worldZ * 0.035, { seed: shoreSeed, octaves: 4 }) - 0.5;
  const warpFine =
    fbm2(worldX * 0.11 + 37.1, worldZ * 0.11 - 13.7, {
      octaves: 3,
      seed: shoreSeed + 3,
    }) - 0.5;

  const edge =
    coastLine +
    coastTilt * (worldX / WORLD_SIZE) +
    warpBroad * coastRagged +
    warpFine * coastRagged * 0.3;

  return (0.5 - edge) * WORLD_SIZE - worldZ;
}

// Sea stacks: the isolated outcrops standing in open water that the foam wraps
// around. Placed by rejection rather than by solving the warped coastline for
// a given offset, because the warp makes that unsolvable in closed form.
//
// Every stack used to be the same object at a different scale: a circular cone
// whose height was drawn independently of its footprint, so half of them came
// out as needles and none of them had a silhouette worth looking at. Each one
// now gets a footprint, an elongation and heading, a lobed outline, and a
// profile that runs from flat-topped table to cone -- and height follows
// footprint, so a small stack is a low knuckle rather than a spike.
const STACK_REFERENCE_RADIUS = WORLD_SIZE * 0.022;

function makeStack({ config, index, random, scale = 1, x, z }) {
  const radius = STACK_REFERENCE_RADIUS * (0.5 + random() ** 1.5 * 1.3) * scale;
  // Uniform, not squared: squaring left half the field perfectly circular,
  // which was the reported lack of variation.
  const stretch = 1 + random() * 1.1;
  const rough = 0.2 + random() * 0.35;
  const bulk = 0.45 + (radius / STACK_REFERENCE_RADIUS) * 0.55;

  return {
    heading: random() * Math.PI,
    // Capped against the footprint as well as scaled by it. Scaling alone
    // still let a small satellite come out twice as tall as it was wide, which
    // is the needle the whole field used to be made of.
    height: Math.min(
      config.stackSize * (0.4 + random() * 0.55) * bulk,
      radius * 2.1
    ),
    radius,
    // Where the profile has fallen below a centimetre, with room for the
    // outline warp to push the edge outward. Capped because the tail past this
    // is not worth the cells it costs.
    reach: Math.min(radius * stretch * 4, WORLD_SIZE * 0.18),
    rough,
    seed: config.shoreSeed + 400 + index,
    // Under 1 rounds the top off into a dome, over it squares the profile up
    // into a steep-sided table.
    sharpness: 0.75 + random() * 1.5,
    stretch,
    x,
    z,
  };
}

function placeStacks(config) {
  const { shoreSeed, stackCount } = config;
  const random = mulberry32(shoreSeed + 91);
  const stacks = [];

  let attempts = 0;
  while (stacks.length < stackCount && attempts < 4000) {
    attempts += 1;
    const x = (random() - 0.5) * WORLD_SIZE * 0.92;
    const z = (random() - 0.5) * WORLD_SIZE * 0.92;

    // Standing in open water within a dozen metres of the rock, which is the
    // band where the surf is already breaking.
    const distance = coastDistance(x, z, config);
    if (distance <= -1 && distance >= -13) {
      const parent = makeStack({ config, index: stacks.length, random, x, z });
      stacks.push(parent);

      // Stacks come in clusters on a real coast: one mass with a few knuckles
      // around it, rather than evenly scattered lumps.
      if (random() < 0.55) {
        const satellites = 1 + Math.floor(random() * 2);
        for (let k = 0; k < satellites && stacks.length < stackCount; k += 1) {
          const angle = random() * Math.PI * 2;
          const spread = parent.radius * (1.5 + random() * 1.6);
          const sx = parent.x + Math.cos(angle) * spread;
          const sz = parent.z + Math.sin(angle) * spread;
          if (coastDistance(sx, sz, config) < -0.5) {
            stacks.push(
              makeStack({
                config,
                index: stacks.length,
                random,
                scale: 0.35 + random() * 0.45,
                x: sx,
                z: sz,
              })
            );
          }
        }
      }
    }
  }

  return stacks;
}

// The terrain half of the bake: the shelf, the coastline and the rock, with no
// sea stacks on it. Split out because it is the expensive half -- twenty
// octaves of noise on every cell in the grid, measured at 180ms at 384 -- and
// because stacks are the part that actually gets tuned by eye. Caching this
// lets a stack change re-evaluate only the handful of cells near a stack.
//
// Channels: .x bed, .y rock facet detail. .z is left for the caller to park the
// previous bake's bed in, which is how a rebake preserves the water surface
// rather than the water column; .w is spare.
export function buildCoastTerrain(config) {
  const {
    deepDepth,
    reefRelief,
    resolution,
    rockHeight,
    rockRelief,
    rockRise,
    shelfWidth,
    shoreSeed,
    slopeCurve,
  } = config;

  const n = resolution;
  const base = new Float32Array(n * n * 4);

  for (let j = 0; j < n; j += 1) {
    const worldZ = (0.5 - j / (n - 1)) * WORLD_SIZE;
    for (let i = 0; i < n; i += 1) {
      const worldX = (i / (n - 1) - 0.5) * WORLD_SIZE;
      const distance = coastDistance(worldX, worldZ, config);

      // Only one of these is ever non-zero: seaward of the waterline the shelf
      // falls away, landward the rock climbs.
      const shelf = -deepDepth * clamp01(-distance / shelfWidth) ** slopeCurve;
      // A slow-rising exponent rather than a fast one: ^0.6 puts half a metre
      // of rock in the first metre past the waterline, which leaves a bore
      // nothing to run up. The apron is where the swash lives.
      const plateau = rockHeight * clamp01(distance / rockRise) ** 1.5;
      let height = shelf + plateau;

      // Both relief terms are masked to a band, so outside it their octaves
      // are skipped rather than multiplied by zero.
      const landMask = smoothstep(-1.5, 3.5, distance);
      if (landMask > 0) {
        height +=
          (ridged(worldX * 0.09, worldZ * 0.09, shoreSeed, 5) ** 2 - 0.32) *
          rockRelief *
          landMask;
        height +=
          (valueNoise2(worldX * 0.6, worldZ * 0.6, shoreSeed + 7) - 0.5) *
          rockRelief *
          0.25 *
          landMask;
      }

      // Submerged reef reaching out from the coast. This is what the water
      // trips over, so the break happens offshore in patches rather than in
      // one clean line along the rock.
      const reefMask = (1 - landMask) * smoothstep(-18, -1.5, distance);
      if (reefMask > 0) {
        height +=
          (ridged(worldX * 0.14, worldZ * 0.14, shoreSeed + 9, 4) - 0.42) *
          reefRelief *
          reefMask;
      }

      const slot = (j * n + i) * 4;
      base[slot] = height;
      base[slot + 1] = clamp01(
        ridged(worldX * 0.75, worldZ * 0.75, shoreSeed + 21, 3)
      );
    }
  }

  return base;
}

// Stacks on top of a cached terrain. Writes into `out` so the caller controls
// the allocation, and touches only the cells inside a stack's reach.
export function applyStacks(base, config, out = null) {
  const n = config.resolution;
  const field = out || new Float32Array(base.length);
  field.set(base);

  const stacks = placeStacks(config);
  const cell = WORLD_SIZE / (n - 1);

  for (let s = 0; s < stacks.length; s += 1) {
    const stack = stacks[s];
    const iLo = Math.max(
      0,
      Math.ceil((stack.x - stack.reach) / cell + (n - 1) / 2)
    );
    const iHi = Math.min(
      n - 1,
      Math.floor((stack.x + stack.reach) / cell + (n - 1) / 2)
    );
    const jLo = Math.max(
      0,
      Math.ceil((n - 1) / 2 - (stack.z + stack.reach) / cell)
    );
    const jHi = Math.min(
      n - 1,
      Math.floor((n - 1) / 2 - (stack.z - stack.reach) / cell)
    );

    const cos = Math.cos(stack.heading);
    const sin = Math.sin(stack.heading);

    for (let j = jLo; j <= jHi; j += 1) {
      const worldZ = (0.5 - j / (n - 1)) * WORLD_SIZE;
      for (let i = iLo; i <= iHi; i += 1) {
        const worldX = (i / (n - 1) - 0.5) * WORLD_SIZE;
        const ox = worldX - stack.x;
        const oz = worldZ - stack.z;
        // Into the stack's own frame, stretched along its heading.
        const along = (ox * cos + oz * sin) / (stack.radius * stack.stretch);
        const across = (oz * cos - ox * sin) / stack.radius;
        // Lobed rather than elliptical. Without this every outline is a
        // perfect oval and the cluster reads as scattered pebbles.
        const warp =
          1 +
          (valueNoise2(worldX * 0.55, worldZ * 0.55, stack.seed) - 0.5) *
            stack.rough;
        const r = Math.sqrt(along * along + across * across) * warp;
        const falloff = Math.exp(-(r ** (stack.sharpness * 2)) * 1.1);
        field[(j * n + i) * 4] +=
          stack.height *
          falloff *
          (0.65 + 0.7 * ridged(worldX * 0.35, worldZ * 0.35, stack.seed, 2));
      }
    }
  }

  return field;
}

// One CPU bake is the single source of truth for the shape of the place: the
// solver's bathymetry, which grains are rock and which are water, and the
// shading's sense of how deep the bed is under a given grain all read this
// array.
export default function buildCoastField(config) {
  return {
    field: applyStacks(buildCoastTerrain(config), config),
    resolution: config.resolution,
  };
}

// Bilinear read of the baked bed, in the same world-to-cell mapping the
// kernels use. The grain layout needs it on the CPU to decide which grains are
// rock, so it has to agree with the GPU's reading of the same array exactly.
export function sampleBed(field, resolution, worldX, worldZ) {
  const n = resolution;
  const fx = (worldX / WORLD_SIZE + 0.5) * (n - 1);
  const fz = (0.5 - worldZ / WORLD_SIZE) * (n - 1);
  const x0 = Math.min(n - 1, Math.max(0, Math.floor(fx)));
  const z0 = Math.min(n - 1, Math.max(0, Math.floor(fz)));
  const x1 = Math.min(n - 1, x0 + 1);
  const z1 = Math.min(n - 1, z0 + 1);
  const tx = clamp01(fx - x0);
  const tz = clamp01(fz - z0);

  const at = (ix, iz) => field[(iz * n + ix) * 4];
  const top = at(x0, z0) + (at(x1, z0) - at(x0, z0)) * tx;
  const bottom = at(x0, z1) + (at(x1, z1) - at(x0, z1)) * tx;
  return top + (bottom - top) * tz;
}
