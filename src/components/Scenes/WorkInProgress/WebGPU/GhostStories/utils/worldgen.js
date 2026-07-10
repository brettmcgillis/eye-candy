import { fbm2 } from '../../../../../../utils/noise2d';

// World generation for the endless night meadow. Everything that needs to
// agree on the ground — terrain meshes, physics colliders, grass scatter,
// flower/firefly placement, and (later) prop settings — samples the same
// world object built here. All samplers are pure functions of world-space
// coordinates, so chunks are seamless by construction.

export const CHUNK_SIZE = 48;

function smoothstep(edge0, edge1, x) {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

export function chunkCoord(worldCoord) {
  return Math.round(worldCoord / CHUNK_SIZE);
}

export function chunkKey(cx, cz) {
  return `${cx}:${cz}`;
}

// Builds the sampler set from worldgen controls. Memoize on these values —
// a new world object is the signal for chunks to regenerate.
export function createWorld({
  hillAmplitude,
  hillFrequency,
  pathDepth,
  pathEnabled,
  pathFrequency,
  pathWidth,
  seed,
  valleyAmplitude,
  valleyFrequency,
  waterLevel,
}) {
  // Rolling meadow detail on top of broad valleys. Valleys are signed so
  // their floors dip below the water table and pool into ponds.
  const sampleHills = (x, z) =>
    fbm2(x * hillFrequency, z * hillFrequency, { seed, octaves: 4 }) *
    hillAmplitude;

  const sampleValleys = (x, z) =>
    (fbm2(x * valleyFrequency, z * valleyFrequency, {
      seed: seed + 77,
      octaves: 3,
    }) -
      0.5) *
    2 *
    valleyAmplitude;

  // Pathways are the iso-lines of a slow noise field: wandering, branching,
  // closed loops that thread the whole endless world. 0 = meadow, 1 = center
  // of a worn path.
  const samplePath = (x, z) => {
    if (!pathEnabled) return 0;
    const field = fbm2(x * pathFrequency, z * pathFrequency, {
      seed: seed + 31,
      octaves: 2,
    });
    const distToIso = Math.abs(field - 0.5);
    return 1 - smoothstep(pathWidth * 0.35, pathWidth, distToIso);
  };

  // Paths press slightly into the ground so they read as worn earth even
  // before the grass mask makes them visible.
  const sampleHeight = (x, z) => {
    const base = sampleValleys(x, z) + sampleHills(x, z);
    const path = samplePath(x, z);
    return base - path * pathDepth;
  };

  // 0 on dry meadow -> 1 at/below the water table (used for shore tinting
  // and to keep grass out of ponds).
  const sampleShore = (x, z) => {
    const height = sampleHeight(x, z);
    return 1 - smoothstep(waterLevel, waterLevel + 0.6, height);
  };

  return {
    sampleHeight,
    samplePath,
    sampleShore,
    seed,
    waterLevel,
  };
}

// Returns the ring of chunk coordinates within `radius` chunks of the
// center, ordered center-out so nearby chunks mount first.
export function ringChunks(centerX, centerZ, radius) {
  const chunks = [];
  for (let dz = -radius; dz <= radius; dz += 1) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      chunks.push({
        cx: centerX + dx,
        cz: centerZ + dz,
        dist: Math.max(Math.abs(dx), Math.abs(dz)),
      });
    }
  }
  chunks.sort((a, b) => a.dist - b.dist);
  return chunks;
}
