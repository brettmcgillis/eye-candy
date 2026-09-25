import { fbm2 } from '@utils/noise2d';

export const MAX_BLADES = 150000;
export const GRASS_EDGE_OVERDRAW = 0.5;
const CARVE_THRESHOLD = 0.3;

// Skips carved letters and shrinks blades toward cut edges so the grass
// thins out at the rim.
export function meadowSampler(heightField) {
  return (x, z) => {
    const carve = heightField.sampleCarve(x, z);
    if (carve >= CARVE_THRESHOLD) {
      return null;
    }
    return {
      height: heightField.sampleHeight(x, z),
      scale: 1 - (carve / CARVE_THRESHOLD) * 0.5,
    };
  };
}

export function outerMeadowSampler(
  { hillAmplitude, hillFrequency, pitDepth, seed, waterLevel },
  sampleOuterCarve
) {
  const pitFloor = waterLevel - pitDepth;
  return (worldX, worldZ) => {
    const hill =
      fbm2(worldX * hillFrequency, worldZ * hillFrequency, {
        octaves: 4,
        seed,
      }) * hillAmplitude;
    const carve = sampleOuterCarve ? sampleOuterCarve(worldX, worldZ) : 0;
    if (carve >= CARVE_THRESHOLD) {
      return null;
    }
    return { height: hill + (pitFloor - hill) * carve, scale: 1 };
  };
}

export function estimateHeroGrassCoverage(heightField, sampleGrid = 72) {
  const half = heightField.worldSize * 0.5;
  const step = heightField.worldSize / sampleGrid;
  let accepted = 0;
  let total = 0;

  for (let z = 0; z < sampleGrid; z += 1) {
    for (let x = 0; x < sampleGrid; x += 1) {
      const sx = -half + (x + 0.5) * step;
      const sz = -half + (z + 0.5) * step;
      if (heightField.sampleCarve(sx, sz) < CARVE_THRESHOLD) {
        accepted += 1;
      }
      total += 1;
    }
  }

  return total > 0 ? accepted / total : 1;
}
