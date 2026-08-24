// Deterministic per-cell "reveal" value in [0, 1) — the classic
// fract(sin(dot(...)) * big-constant) hash (same trick as the crt materials,
// e.g. components/materials/webGL/crt/crtBlueScreenMaterial.jsx) applied to
// a cell's grid coordinates plus the cloud's own seed. Used to progressively
// swap smooth-cloud fragments for voxel cubes cell-by-cell as
// voxelCloudTransitionAmount increases, instead of a uniform fade.
//
// Coordinates are bucketed by `noiseScale` before hashing (a bucket of
// noiseScale³ cells) so neighboring cells share the same reveal value —
// contiguous patches of the cloud glitch together instead of a
// salt-and-pepper per-cell speckle. noiseScale 1 = one bucket per cell.
//
// Has a TSL twin in toonCloudMaterial.js (same formula, GPU-side) — keep
// both in sync so the cells the smooth mesh discards and the cubes
// VoxelCloudBlocks reveals in their place land on the same grid cells.
export default function cellRevealHash(x, y, z, seed, noiseScale = 1) {
  const scale = Math.max(noiseScale, 0.0001);
  const bx = Math.floor(x / scale);
  const by = Math.floor(y / scale);
  const bz = Math.floor(z / scale);
  const s =
    Math.sin(bx * 12.9898 + by * 78.233 + bz * 37.719 + seed * 45.164) *
    43758.5453;
  return s - Math.floor(s);
}
