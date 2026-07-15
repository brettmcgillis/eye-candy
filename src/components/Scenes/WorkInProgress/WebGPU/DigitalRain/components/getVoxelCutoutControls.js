import { folder } from 'leva';

// Leva schema for VoxelCutout — the voxelized section carved out of
// CloudVolume's shared density field (see utils/density.js). gridX/Y/Z are
// structural (rebuild the instanced mesh); everything else just re-samples.
export default function getVoxelCutoutControls(p = {}) {
  return folder(
    {
      // Off by default — see cloudVisible in getCloudControls.js.
      voxelVisible: { label: 'Visible', value: p.voxelVisible ?? false },
      voxelGridX: {
        label: 'Grid X',
        value: p.voxelGridX ?? 10,
        min: 2,
        max: 24,
        step: 1,
      },
      voxelGridY: {
        label: 'Grid Y',
        value: p.voxelGridY ?? 10,
        min: 2,
        max: 24,
        step: 1,
      },
      voxelGridZ: {
        label: 'Grid Z',
        value: p.voxelGridZ ?? 10,
        min: 2,
        max: 24,
        step: 1,
      },
      voxelCutoutCenter: {
        label: 'Cutout Center',
        value: p.voxelCutoutCenter ?? { x: 5, y: 8, z: 0 },
      },
      voxelCellSpacing: {
        label: 'Cell Spacing',
        value: p.voxelCellSpacing ?? 0.9,
        min: 0.2,
        max: 3,
        step: 0.05,
      },
      voxelCellScale: {
        label: 'Cell Scale',
        value: p.voxelCellScale ?? 0.85,
        min: 0.1,
        max: 1,
        step: 0.01,
      },
      voxelThreshold: {
        label: 'Density Threshold',
        value: p.voxelThreshold ?? 0.35,
        min: 0,
        max: 1,
        step: 0.01,
      },
      voxelDenseColor: {
        label: 'Dense Color',
        value: p.voxelDenseColor ?? '#dfe8ff',
      },
      voxelSparseColor: {
        label: 'Sparse Color',
        value: p.voxelSparseColor ?? '#4a5480',
      },
    },
    { collapsed: true }
  );
}
