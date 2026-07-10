import { hash01 } from '../../../../../../utils/noise2d';
import { CHUNK_SIZE } from './worldgen';

// Chunk-seeded "abandoned settings": each chunk deterministically rolls
// either nothing (just nature) or one composed scene being reclaimed by it —
// a shipping container, a playground, a ruin-arch gathering place... The
// ghost spawns by the abandoned house; the path network threads the
// settings together. Layouts are data here; SettingChunk turns an entry
// into placed elements + colliders.
//
// Each piece: { element, position: [x, y, z] (local, y = lift above
// terrain), rotationY, scale }.

export const SPAWN_SETTING = 'house';

// Rough footprint half-size used to keep pieces inside the chunk.
export const SETTING_JITTER = CHUNK_SIZE * 0.28;

const SETTINGS = {
  house: {
    pieces: [
      { element: 'house', position: [0, 0, 0], rotationY: 0.4, scale: 1 },
    ],
    weight: 0, // spawn-only: never rolled in outlying chunks
  },
  container: {
    pieces: [
      { element: 'container', position: [0, 0, 0], rotationY: 0, scale: 1 },
    ],
    weight: 1,
  },
  playground: {
    pieces: [
      { element: 'playground', position: [0, 0, 0], rotationY: 0, scale: 1 },
      { element: 'slide', position: [5, 0, 3], rotationY: 1.9, scale: 1 },
    ],
    weight: 1,
  },
  gathering: {
    // Ruin arches ringed like the bones of a meeting place.
    pieces: [
      { element: 'arch', position: [0, 0, -6], rotationY: 0, scale: 0.3 },
      { element: 'arch', position: [5.2, 0, -3], rotationY: 1.05, scale: 0.3 },
      {
        element: 'archBroken',
        position: [5.2, 0, 3],
        rotationY: 2.1,
        scale: 0.3,
      },
      { element: 'arch', position: [0, 0, 6], rotationY: 3.14, scale: 0.3 },
      {
        element: 'archBroken',
        position: [-5.2, 0, 3],
        rotationY: 4.2,
        scale: 0.3,
      },
      { element: 'debris', position: [-5.2, 0, -3], rotationY: 5.2, scale: 1 },
    ],
    weight: 0.7,
  },
  carwreck: {
    pieces: [
      { element: 'crashedCar', position: [0, 0, 0], rotationY: 0, scale: 1 },
    ],
    weight: 1,
  },
  fence: {
    pieces: [
      { element: 'fenceSegments', position: [0, 0, 0], rotationY: 0, scale: 1 },
    ],
    weight: 0.8,
  },
  debris: {
    pieces: [
      { element: 'debris', position: [0, 0, 0], rotationY: 0, scale: 1 },
    ],
    weight: 1,
  },
  bret: {
    pieces: [{ element: 'bret', position: [0, 0, 0], rotationY: 0, scale: 1 }],
    weight: 0.12,
  },
};

const ROLLABLE = Object.entries(SETTINGS).filter(([, s]) => s.weight > 0);
const TOTAL_WEIGHT = ROLLABLE.reduce((sum, [, s]) => sum + s.weight, 0);

export function getSetting(key) {
  return SETTINGS[key] ?? null;
}

// Deterministic per-chunk roll. `density` is the fraction of chunks that
// hold a setting at all (0..1); the spawn chunk always holds the house.
export function rollChunkSetting({ cx, cz, density, seed }) {
  if (cx === 0 && cz === 0) return SPAWN_SETTING;

  const roll = hash01(cx, cz, seed + 4001);
  if (roll > density) return null;

  let pick = hash01(cx, cz, seed + 4801) * TOTAL_WEIGHT;
  for (let i = 0; i < ROLLABLE.length; i += 1) {
    pick -= ROLLABLE[i][1].weight;
    if (pick <= 0) return ROLLABLE[i][0];
  }
  return ROLLABLE[ROLLABLE.length - 1][0];
}

// Picks where in the chunk the setting sits: candidates are scored toward
// the path network (settings feel "found" along the trails) and away from
// water. Returns a world-space anchor + yaw, or null when the whole chunk
// is unsuitable (underwater).
export function pickAnchor({ cx, cz, world }) {
  const centerX = cx * CHUNK_SIZE;
  const centerZ = cz * CHUNK_SIZE;
  const { seed, waterLevel } = world;

  let best = null;
  let bestScore = -Infinity;
  for (let i = 0; i < 10; i += 1) {
    const x =
      centerX + (hash01(i, cx * 31 + cz, seed + 6007) * 2 - 1) * SETTING_JITTER;
    const z =
      centerZ + (hash01(i, cx * 17 - cz, seed + 6203) * 2 - 1) * SETTING_JITTER;
    const height = world.sampleHeight(x, z);
    if (height < waterLevel + 0.4) continue; // eslint-disable-line no-continue

    // Beside the path, not in the middle of it.
    const path = world.samplePath(x, z);
    const score = 1 - Math.abs(path - 0.35);
    if (score > bestScore) {
      bestScore = score;
      best = { x, z };
    }
  }

  if (!best) return null;

  return {
    x: best.x,
    yaw: hash01(cx, cz, seed + 7001) * Math.PI * 2,
    z: best.z,
  };
}
