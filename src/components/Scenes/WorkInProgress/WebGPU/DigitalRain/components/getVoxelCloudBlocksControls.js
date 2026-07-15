import { folder } from 'leva';

// Leva schema for VoxelCloudBlocks — a blocky, "obviously voxels" render of
// the same density field VoxelCloud surfaces smoothly (see
// components/VoxelCloudBlocks.jsx). Grid/seed/inflation-passes AND the
// occupancy threshold are all shared with VoxelCloud's own folder
// (voxelCloudResolution/Seed/InflationPasses/Isolation) so both variants
// enclose the exact same silhouette — scale/color here are blocks-only.
export default function getVoxelCloudBlocksControls(p = {}) {
  return folder(
    {
      // >1 lets cube corners jut past the smooth mesh's local surface —
      // that's what breaks up the cloud's silhouette in transition mode
      // instead of just cutting flush windows into it.
      voxelBlocksScale: {
        label: 'Cube Size',
        value: p.voxelBlocksScale ?? 1.15,
        min: 0.5,
        max: 2,
        step: 0.01,
      },
      voxelBlocksDenseColor: {
        label: 'Dense Color',
        value: p.voxelBlocksDenseColor ?? '#dfe8ff',
      },
      voxelBlocksSparseColor: {
        label: 'Sparse Color',
        value: p.voxelBlocksSparseColor ?? '#4a5480',
      },
    },
    { collapsed: true }
  );
}
