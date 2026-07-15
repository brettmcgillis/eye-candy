import { createPerlin2, createSeededRandom } from './seededNoise2D';
import { getValue, setValue } from './voxelFieldIndex';

// Port of ~/dev/examples/clouds's src/cloudInflator.ts: lays down a 2D
// perlin-noise base disc on the voxel field's floor, then "inflates" it by
// repeatedly splatting random spheres around already-occupied cells (bigger
// near the center, biased upward) so the cloud grows a flat base and a
// puffy, irregular top — a cumulus silhouette rather than a uniform blob.
const BASE_INFLATION_SIZE = 4;
const BASE_ELEVATION = 0;
const PADDING = BASE_INFLATION_SIZE * 2;
const NOISE_DAMPENING = 0;
const NOISE_SIZE = 4;
const INFLATION_CHANCE = 0.5;

function generatePerlinBase(field, size, perlin) {
  const noiseScaling = NOISE_SIZE / size;
  const overlayCircleRadius = size / 2 - PADDING;
  const py = BASE_ELEVATION;

  for (let px = 0; px < size; px += 1) {
    for (let pz = 0; pz < size; pz += 1) {
      const mag = Math.sqrt((px - size / 2) ** 2 + (pz - size / 2) ** 2);
      const circleOverlap = Math.max(Math.min(overlayCircleRadius - mag, 1), 0);
      setValue(
        field,
        size,
        px,
        py,
        pz,
        Math.max(
          0,
          perlin(px * noiseScaling, pz * noiseScaling) - NOISE_DAMPENING
        ) * circleOverlap
      );
    }
  }
  return field;
}

function generateSphere(radius) {
  const diameter = radius * 2;
  const values = new Float32Array(diameter * diameter * diameter);
  if (radius === 0) {
    return values;
  }

  for (let absX = -radius; absX <= radius; absX += 1) {
    const realX = absX + radius;
    for (let absY = -radius; absY <= radius; absY += 1) {
      const realY = absY + radius;
      for (let absZ = -radius; absZ <= radius; absZ += 1) {
        const realZ = absZ + radius;
        const distance = Math.sqrt(absX * absX + absY * absY + absZ * absZ);
        setValue(
          values,
          diameter,
          realX,
          realY,
          realZ,
          Math.max(Math.min(radius - distance, 1), 0)
        );
      }
    }
  }
  return values;
}

function inflateIteration(field, size, random) {
  const fieldSnapshot = field.slice();

  for (let x = 0; x < size; x += 1) {
    for (let y = 0; y < size; y += 1) {
      for (let z = 0; z < size; z += 1) {
        // Floored to avoid a divide-by-zero blowup for the voxel(s) sitting
        // exactly at the field's center (distance 0) — the reference has
        // this same formula with no floor, which throws
        // "Invalid typed array length: Infinity" the moment that cell is
        // ever a candidate for inflation.
        const distanceFromCenter = Math.max(
          Math.sqrt(
            (x - size / 2) ** 2 + (y - size / 2) ** 2 + (z - size / 2) ** 2
          ),
          0.5
        );
        const overallInflationFactor = (size / 2 / distanceFromCenter) ** 2;

        const currentValue = getValue(fieldSnapshot, size, x, y, z);
        if (currentValue > 0 && random() > INFLATION_CHANCE) {
          // Hard-capped so a large overallInflationFactor near the center
          // can never request an absurd (or, pre-floor, infinite) sphere.
          const sphereRadius = Math.min(
            Math.floor(
              BASE_INFLATION_SIZE * overallInflationFactor * random() ** 2
            ),
            Math.floor(size / 2)
          );
          const verticalDisplacement = Math.floor(
            random() * sphereRadius * overallInflationFactor
          );

          const sphereDiameter = sphereRadius * 2;
          const sphere = generateSphere(sphereRadius);
          for (let sx = 0; sx < sphereDiameter; sx += 1) {
            const absSx = sx - sphereRadius + x;
            for (let sy = 0; sy < sphereDiameter; sy += 1) {
              const absSy = sy - sphereRadius + y + verticalDisplacement;
              for (let sz = 0; sz < sphereDiameter; sz += 1) {
                const absSz = sz - sphereRadius + z;
                const sphereValue = getValue(
                  sphere,
                  sphereDiameter,
                  sx,
                  sy,
                  sz
                );
                const previousValue = getValue(
                  fieldSnapshot,
                  size,
                  absSx,
                  absSy,
                  absSz
                );
                setValue(
                  field,
                  size,
                  absSx,
                  absSy,
                  absSz,
                  previousValue + sphereValue
                );
              }
            }
          }
        }
      }
    }
  }

  return field;
}

export default function buildCloudVoxelField({ size, seed, inflationPasses }) {
  const random = createSeededRandom(seed);
  const perlin = createPerlin2(seed);

  let field = new Float32Array(size * size * size);
  field = generatePerlinBase(field, size, perlin);
  for (let i = 0; i < inflationPasses; i += 1) {
    field = inflateIteration(field, size, random);
  }
  return field;
}
