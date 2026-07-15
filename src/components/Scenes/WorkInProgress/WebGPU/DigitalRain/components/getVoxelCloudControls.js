import { folder } from 'leva';

// Leva schema for VoxelCloud — a port of ~/dev/examples/clouds's voxel-cloud
// approach (see components/VoxelCloud.jsx). resolution/seed/inflationPasses/
// isolation/blurIntensity are structural (they change the extracted mesh
// itself, so editing them rebuilds); everything else is a plain transform
// or material uniform.
export default function getVoxelCloudControls(p = {}) {
  return folder(
    {
      voxelCloudVisible: {
        label: 'Visible',
        value: p.voxelCloudVisible ?? true,
      },
      voxelCloudPosition: {
        label: 'Position',
        value: p.voxelCloudPosition ?? { x: 0, y: 8, z: 0 },
      },
      voxelCloudWidth: {
        label: 'Width',
        value: p.voxelCloudWidth ?? 16,
        min: 2,
        max: 40,
        step: 0.5,
      },
      voxelCloudHeight: {
        label: 'Height',
        value: p.voxelCloudHeight ?? 10,
        min: 2,
        max: 30,
        step: 0.5,
      },
      voxelCloudDepth: {
        label: 'Depth',
        value: p.voxelCloudDepth ?? 16,
        min: 2,
        max: 40,
        step: 0.5,
      },
      voxelCloudResolution: {
        label: 'Resolution',
        value: p.voxelCloudResolution ?? 28,
        min: 12,
        max: 56,
        step: 1,
      },
      voxelCloudSeed: {
        label: 'Seed',
        value: p.voxelCloudSeed ?? 1,
        min: 0,
        max: 999999,
        step: 1,
      },
      voxelCloudInflationPasses: {
        label: 'Inflation Passes',
        value: p.voxelCloudInflationPasses ?? 3,
        min: 1,
        max: 6,
        step: 1,
      },
      voxelCloudIsolation: {
        label: 'Isolation',
        value: p.voxelCloudIsolation ?? 0.03,
        min: 0.005,
        max: 0.2,
        step: 0.005,
      },
      voxelCloudBlurIntensity: {
        label: 'Blur Intensity',
        value: p.voxelCloudBlurIntensity ?? 1,
        min: 0,
        max: 2,
        step: 0.05,
      },
      voxelCloudBaseColor: {
        label: 'Base Color',
        value: p.voxelCloudBaseColor ?? '#ffffff',
      },
      voxelCloudShadeColor1: {
        label: 'Shade Color 1',
        value: p.voxelCloudShadeColor1 ?? '#a0a0a0',
      },
      voxelCloudShadeColor2: {
        label: 'Shade Color 2',
        value: p.voxelCloudShadeColor2 ?? '#0000a0',
      },
      voxelCloudLightDirection: {
        label: 'Light Direction',
        value: p.voxelCloudLightDirection ?? { x: 0.4, y: 0.85, z: 0.3 },
      },
    },
    { collapsed: true }
  );
}
