import { getValue } from './voxelFieldIndex';

// Thresholds the same packed density field VoxelCloud surfaces via marching
// cubes (see marchingCubes.js) into a flat [x, y, z, density, ...] list of
// "occupied" grid cells — what VoxelCloudBlocks needs to place one cube per
// cell instead of a smooth surface. A flat number array (rather than an
// array of objects) avoids per-cell allocation at the resolutions this scene
// uses (up to 56³ cells).
export default function extractVoxelCells({ field, size, threshold }) {
  const cells = [];
  for (let z = 0; z < size; z += 1) {
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const density = getValue(field, size, x, y, z);
        if (density > threshold) {
          cells.push(x, y, z, density);
        }
      }
    }
  }
  return cells;
}
