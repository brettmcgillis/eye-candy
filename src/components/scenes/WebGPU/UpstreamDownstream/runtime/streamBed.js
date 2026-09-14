import { stampMounds } from '@modules/shallowWater';
import { fbm2, mulberry32, valueNoise2 } from '@utils/noise2d';

import { WORLD_SIZE } from './constants';

function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}

function ridged(x, z, seed, octaves) {
  return 1 - Math.abs(fbm2(x, z, { seed, octaves }) * 2 - 1);
}

// How far the centreline may wander before the channel and its banks run out
// of domain. A meander of 8 on a 15m channel puts the far bank 22m from the
// middle of a domain that is only 18m to its edge, so the reach leaves the
// frame on every bend and there is no ground on the outside of the turn.
function meanderRoom(config) {
  // The bank run, plus a margin the wetted edge is allowed to overrun into.
  // The channel does not stop at its nominal half-width: bed relief and a low
  // bank let water sit a metre or two beyond it, so reserving only the bank
  // run left a tight bend with two metres of shore against the default's four.
  const bank = Math.min(config.bankSlope, 4) + WORLD_SIZE * 0.06;
  return Math.max(1, WORLD_SIZE * 0.5 - config.channelWidth * 0.5 - bank);
}

// The thalweg: where the deepest line of the channel lies at a given point
// down the reach. A sine plus a wander octave, because a stream meandering on
// one clean period reads as a pipe someone bent.
//
// Soft-limited rather than clamped. A hard clamp flattens the top of every
// bend into a straight, which is the one shape a meander never makes; tanh
// compresses the whole swing into the room available and leaves it curved.
function centreOf(worldZ, config) {
  const { meander, meanderRate, streamSeed } = config;
  const swing = Math.sin((worldZ / WORLD_SIZE) * Math.PI * 2 * meanderRate);
  const wander =
    fbm2(worldZ * 0.06, 11.3, { octaves: 3, seed: streamSeed }) - 0.5;
  const raw = swing * meander + wander * meander * 0.7;
  const room = meanderRoom(config);
  return room * Math.tanh(raw / room);
}

// The pool-riffle couplet, which is the whole reason a stream looks like
// anything from above. The bed rises into a gravel bar and drops into a pool
// several times down the reach; water shoals and goes supercritical over the
// bar, which is where the solver's Froude term finds its hydraulic jump and
// throws the whitewater. The surface, by contrast, runs smoothly downhill --
// so pools come out deep and glassy and riffles come out thin and white
// without either being painted on.
function riffleOf(worldZ, config) {
  const { riffleRate, riffleRelief, streamSeed } = config;
  const phase = (worldZ / WORLD_SIZE) * Math.PI * 2 * riffleRate;
  const drift =
    fbm2(worldZ * 0.09, 47.7, { octaves: 2, seed: streamSeed + 13 }) - 0.5;
  return Math.sin(phase + drift * 2.4) * riffleRelief;
}

// The expensive half of the bake: gradient, channel, banks and gravel. Split
// out from the rocks for the same reason the coast is -- this is the part that
// costs octaves on every cell, and the rocks are the part that gets tuned by
// eye.
//
// Channels: .x bed, .y facet detail for the rock shading, .z left for the
// caller to park the previous bake's bed in, and .w the still surface the
// reach rests at. That last one is what lets a sloping stream answer the same
// "is this grain ground or water, and how deep is the bed under it" questions
// a flat sea does.
export function buildStreamTerrain(config) {
  const {
    bankHeight,
    bankRelief,
    bankSlope,
    bedRelief,
    channelWidth,
    gradient,
    resolution,
    restDepth,
    streamSeed,
    thalweg,
  } = config;

  const n = resolution;
  const base = new Float32Array(n * n * 4);
  const half = channelWidth * 0.5;

  for (let j = 0; j < n; j += 1) {
    const worldZ = (0.5 - j / (n - 1)) * WORLD_SIZE;
    const datum = worldZ * gradient;
    const centre = centreOf(worldZ, config);
    const riffle = riffleOf(worldZ, config);
    // Which way the channel is turning here. A stream scours the outside of a
    // bend and drops a bar on the inside, so the cross-section leans.
    const bend =
      centreOf(worldZ + 0.5, config) - centreOf(worldZ - 0.5, config);
    const lean = Math.max(-1, Math.min(1, -bend * 1.6));

    for (let i = 0; i < n; i += 1) {
      const worldX = (i / (n - 1) - 0.5) * WORLD_SIZE;
      const offset = worldX - centre;
      const over = Math.abs(offset) - half;

      let height = datum + riffle;
      if (over > 0) {
        const rise = clamp01(over / bankSlope) ** 1.4;
        height += bankHeight * rise;
        height +=
          (ridged(worldX * 0.17, worldZ * 0.17, streamSeed + 3, 4) - 0.4) *
          bankRelief *
          rise;
      } else {
        // Parabolic, so the channel has a deep line down the middle rather
        // than a flat floor with a wall each side.
        const across = offset / half;
        height -= thalweg * (1 - across * across) * (1 + lean * across * 0.6);
      }

      height +=
        (valueNoise2(worldX * 0.9, worldZ * 0.9, streamSeed + 5) - 0.5) *
        bedRelief;

      const slot = (j * n + i) * 4;
      base[slot] = height;
      base[slot + 1] = clamp01(
        ridged(worldX * 0.85, worldZ * 0.85, streamSeed + 21, 3)
      );
      base[slot + 3] = datum + restDepth;
    }
  }

  return base;
}

const BOULDER_RADIUS = WORLD_SIZE * 0.03;
const COBBLE_RADIUS = WORLD_SIZE * 0.008;

// River rock is water-worn: squat, rounded and lying in the direction the
// current works it. Sharpness under 1 domes the profile off, which is the one
// parameter separating these from the sea stacks the same stamper draws.
function makeRock({ config, index, isBoulder, random, x, z }) {
  // A boulder is capped against the channel it stands in. Uncapped, the top of
  // the size range is a rock four metres across in a fifteen metre channel,
  // and three of them abreast dam the reach instead of splitting it.
  const widest = config.channelWidth * 0.16;
  const radius = isBoulder
    ? Math.min(
        BOULDER_RADIUS * (0.55 + random() ** 1.4 * 1.2) * config.boulderSize,
        widest
      )
    : COBBLE_RADIUS * (0.5 + random()) * config.cobbleSize;
  const stretch = 1 + random() * (isBoulder ? 0.9 : 0.6);
  const sharpness = isBoulder ? 0.5 + random() * 0.4 : 0.7 + random() * 0.5;

  return {
    // Lying with the current, give or take: a rock that has been rolled sits
    // long-axis downstream more often than not.
    heading: (random() - 0.5) * (isBoulder ? 1.4 : Math.PI),
    height: radius * (0.5 + random() * 0.45),
    mottleScale: isBoulder ? 0.4 : 1.3,
    radius,
    reach: Math.min(radius * stretch * 3.2, WORLD_SIZE * 0.12),
    rough: isBoulder ? 0.15 + random() * 0.25 : 0.25 + random() * 0.4,
    seed: config.streamSeed + 400 + index,
    sharpness,
    stretch,
    x,
    z,
  };
}

// Boulders stand in the flow and split it; cobbles pave the bed and the bars.
// Both are placed against the meandering centreline rather than scattered over
// the domain, because a rock up on the bank is a rock the water never touches.
export function placeRocks(config) {
  const { boulderCount, cobbleCount, streamSeed } = config;
  const random = mulberry32(streamSeed + 91);
  const half = config.channelWidth * 0.5;
  const rocks = [];

  const scatter = (count, isBoulder, spread) => {
    let attempts = 0;
    const wanted = rocks.length + count;
    while (rocks.length < wanted && attempts < count * 40 + 200) {
      attempts += 1;
      const z = (random() - 0.5) * WORLD_SIZE * 0.94;
      const offset = (random() * 2 - 1) * half * spread;
      const x = centreOf(z, config) + offset;
      if (Math.abs(x) < WORLD_SIZE * 0.47) {
        rocks.push(
          makeRock({ config, index: rocks.length, isBoulder, random, x, z })
        );
      }
    }
  };

  scatter(boulderCount, true, 1.05);
  scatter(cobbleCount, false, 1.35);

  return rocks;
}

// Rocks on top of a cached terrain. Writes into `out` so the caller controls
// the allocation, and only the cells inside a rock's reach are touched.
export function applyRocks(base, config, out = null) {
  const field = out || new Float32Array(base.length);
  field.set(base);

  return stampMounds(field, placeRocks(config), {
    resolution: config.resolution,
    worldSize: WORLD_SIZE,
  });
}
