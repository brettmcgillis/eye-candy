/* eslint-disable no-bitwise */
import createSeededRandom from './seededRandom';

// Deterministic per-tree seed + scatter position, same shape as
// GhostStories/components/TreeChunk.jsx's chunkSeed derivation
// (seed + index * large prime salts) — a given forest seed always lays out
// the same placement and per-tree generation seed.
//
// `is3D` matters here, not just to treeGenerator.js: each tree's own
// generation is confined to its local plane (normal = local Z — see
// utils/treeGenerator.js), so a per-tree yaw rotation (applied around world
// Y in Forest.jsx) tilts that plane to face a different direction, and a
// grid layout offsets rows in Z (depth). Either alone makes the FOREST read
// as three-dimensional under orbit even though every individual tree's
// branch math is flat. In 2D mode every tree shares one plane (single row
// along X, z=0, yaw=0) so the whole forest is genuinely coplanar; 3D mode
// keeps the grid + random yaw for volumetric scatter variety.
export default function buildForestPlacements({
  seed,
  treeCount,
  spacing,
  is3D,
}) {
  const count = Math.max(1, Math.floor(treeCount));
  const columns = is3D ? Math.ceil(Math.sqrt(count)) : count;
  const placements = [];

  for (let i = 0; i < count; i += 1) {
    const treeSeed = (seed + i * 104729) >>> 0;
    const random = createSeededRandom(treeSeed ^ 0x9e3779b9);
    const col = i % columns;
    const row = Math.floor(i / columns);
    const jitter = spacing * 0.3;
    const x = (col - (columns - 1) / 2) * spacing + (random() - 0.5) * jitter;
    const z = is3D
      ? (row - (columns - 1) / 2) * spacing + (random() - 0.5) * jitter
      : 0;
    const yaw = is3D ? random() * 360 : 0;

    placements.push({
      treeIndex: i,
      treeSeed,
      position: new Float32Array([x, 0, z]),
      yaw,
    });
  }

  return placements;
}
