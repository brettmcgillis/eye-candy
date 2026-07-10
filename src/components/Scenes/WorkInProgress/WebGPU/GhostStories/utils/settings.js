import { hash01 } from '../../../../../../utils/noise2d';
import { CHUNK_SIZE } from './worldgen';

// Chunk-seeded "abandoned settings": each chunk deterministically rolls
// either nothing (just nature) or one composed scene being reclaimed by it.
// The ghost spawns by the abandoned house; the path network threads the
// settings together. Layouts are data here; SettingChunk turns an entry
// into placed elements + colliders.
//
// Piece schema:
//   element   — key into SettingChunk's ELEMENTS registry
//   position  — [x, lift, z] local to the setting anchor (y is lift above
//               the terrain sampled under the piece)
//   rotationY — local yaw, composed with the setting's rolled yaw
//   scale     — uniform scale, applied at the wrapper (never inside the
//               element)
//   collider  — false to let the ghost pass through (default 'cuboid')
//   props     — extra props forwarded to the element (e.g. variant/index)

export const SPAWN_SETTING = 'house';

// Rough footprint half-size used to keep pieces inside the chunk.
export const SETTING_JITTER = CHUNK_SIZE * 0.28;

const SETTINGS = {
  house: {
    pieces: [
      { element: 'house', position: [0, 0.36, 0], rotationY: 0.4, scale: 2 },
    ],
    weight: 0, // spawn-only: never rolled in outlying chunks
  },
  container: {
    pieces: [
      // Base sits at y=-1.17 in model space (pivot mid-height): lift by
      // 1.17 x scale or it spawns half-buried.
      { element: 'container', position: [0, 2.34, 0], rotationY: 0, scale: 2 },
    ],
    weight: 1,
  },
  playground: {
    pieces: [
      {
        element: 'playground',
        position: [0, 0.62, 0],
        props: { animated: true },
        rotationY: 0,
        scale: 2.2,
      },
      { element: 'slide', position: [9, 0, 5], rotationY: 1.9, scale: 2 },
    ],
    weight: 1,
  },
  gathering: {
    // Ruin arches ringed like the bones of a meeting place, embers still
    // going in the middle. Arches are ghost-permeable on purpose.
    pieces: [
      {
        collider: false,
        element: 'arch',
        position: [0, 0, -6],
        rotationY: 0,
        scale: 0.18,
      },
      {
        collider: false,
        element: 'arch',
        position: [5.2, 0, -3],
        rotationY: 1.05,
        scale: 0.18,
      },
      {
        collider: false,
        element: 'archBroken',
        position: [5.2, 0, 3],
        rotationY: 2.1,
        scale: 0.18,
      },
      {
        collider: false,
        element: 'arch',
        position: [0, 0, 6],
        rotationY: 3.14,
        scale: 0.18,
      },
      {
        collider: false,
        element: 'archBroken',
        position: [-5.2, 0, 3],
        rotationY: 4.2,
        scale: 0.18,
      },
      {
        element: 'debrisPiece',
        position: [-5.2, 0, -3],
        props: { piece: 'corner2' },
        rotationY: 5.2,
        scale: 2,
      },
      { collider: false, element: 'campfire', position: [0, 0, 0] },
    ],
    weight: 0.7,
  },
  campfire: {
    // A lone fire in the grass, debris chunks dragged up as seats.
    pieces: [
      { collider: false, element: 'campfire', position: [0, 0, 0] },
      {
        element: 'debrisPiece',
        position: [1.8, 0, 0.6],
        props: { piece: 'pillar2' },
        rotationY: 0.8,
        scale: 2,
      },
      {
        element: 'debrisPiece',
        position: [-1.5, 0, 1.2],
        props: { piece: 'pillar4' },
        rotationY: 2.4,
        scale: 2,
      },
    ],
    weight: 0.6,
  },
  carwreck: {
    pieces: [
      { element: 'crashedCar', position: [0, 0, 0], rotationY: 0, scale: 1 },
    ],
    weight: 0.8,
  },
  crashSite: {
    // abandoned_car.glb is ONE wrecked car with its parts flung around the
    // site — placed whole, as authored. Measured from the GLB: ground plane
    // at y≈0, but the whole site spans 54×40 units, so it needs a hard
    // scale-down to read as a car-sized wreck (0.25 → ~13×10m site).
    pieces: [
      {
        element: 'carPack',
        position: [0, 0, 0],
        rotationY: 0,
        scale: 0.25,
      },
    ],
    weight: 0.8,
  },
  fence: {
    // Four panels plus the torn end, staggered with gaps and lean like a
    // property line losing to the meadow.
    pieces: [
      {
        element: 'fenceSegment',
        position: [0, 0, 0],
        props: { index: 0 },
        rotationY: 0,
        scale: 2,
      },
      {
        element: 'fenceSegment',
        position: [0, 0, -8.6],
        props: { index: 1 },
        rotationY: 0.12,
        scale: 2,
      },
      {
        element: 'fenceSegment',
        position: [0.9, 0, -17.4],
        props: { index: 2 },
        rotationY: -0.1,
        scale: 2,
      },
      {
        element: 'fenceSegment',
        position: [0.7, 0, -26.5],
        props: { index: 3 },
        rotationY: 0.28,
        scale: 2,
      },
      {
        collider: false,
        element: 'fenceSegment',
        position: [1.8, 0, -34.8],
        props: { index: 4 },
        rotationY: 0.55,
        scale: 2,
      },
    ],
    weight: 0.8,
  },
  debris: {
    // Individual chunks scattered and resting in the grass — not the whole
    // pack plopped down (its collection has floating geometry).
    pieces: [
      {
        element: 'debrisPiece',
        position: [0, 0, 0],
        props: { piece: 'wall1' },
        rotationY: 0.3,
        scale: 2,
      },
      {
        element: 'debrisPiece',
        position: [3.5, 0, 1.8],
        props: { piece: 'pillar1' },
        rotationY: 1.7,
        scale: 2,
      },
      {
        element: 'debrisPiece',
        position: [-2.8, 0, 2.6],
        props: { piece: 'corner1' },
        rotationY: 4.1,
        scale: 2,
      },
      {
        element: 'debrisPiece',
        position: [1.2, 0, -3.4],
        props: { piece: 'pillar3' },
        rotationY: 2.9,
        scale: 2,
      },
      {
        element: 'debrisPiece',
        position: [-4.6, 0, -1.9],
        props: { piece: 'wall3' },
        rotationY: 5.5,
        scale: 2,
      },
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
