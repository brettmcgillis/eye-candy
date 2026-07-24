// One box-blur pass (6-neighbor averaging) — softens the sphere-splat
// inflation's hard edges into the puffy, rounded look before meshing.
// Extracted from marchingCubes.js so VoxelCloudBlocks can apply the exact
// same blur to its own copy of the field before thresholding — without it,
// VoxelCloud (blurred field) and VoxelCloudBlocks (previously an
// unblurred field) enclosed different volumes, so the blocks always sat
// well inside the smooth mesh's silhouette no matter their cube scale.
// Mutates `field` in place; returns it for chaining.
export default function blurVoxelField(field, size, intensity) {
  const size2 = size * size;
  const snapshot = field.slice();

  for (let x = 0; x < size; x += 1) {
    for (let y = 0; y < size; y += 1) {
      for (let z = 0; z < size; z += 1) {
        const index = size2 * z + size * y + x;
        let value = snapshot[index];
        let contributors = 1;

        for (let dx = -1; dx <= 1; dx += 2) {
          const nx = dx + x;
          if (nx < 0 || nx >= size) {
            // eslint-disable-next-line no-continue
            continue;
          }
          for (let dy = -1; dy <= 1; dy += 2) {
            const ny = dy + y;
            if (ny < 0 || ny >= size) {
              // eslint-disable-next-line no-continue
              continue;
            }
            for (let dz = -1; dz <= 1; dz += 2) {
              const nz = dz + z;
              if (nz < 0 || nz >= size) {
                // eslint-disable-next-line no-continue
                continue;
              }
              const neighborValue = snapshot[size2 * nz + size * ny + nx];
              contributors += 1;
              value += (intensity * (neighborValue - value)) / contributors;
            }
          }
        }

        // eslint-disable-next-line no-param-reassign
        field[index] = value;
      }
    }
  }

  return field;
}
