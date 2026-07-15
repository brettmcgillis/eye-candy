import { folder } from 'leva';

// Leva schema for the shared cloud density field (useCloudField, a port of
// ~/dev/examples/three-volumetric-clouds's getCloudDensity) plus
// CloudVolume's own raymarch/lighting-only knobs (rayMarch.ts's Beer's
// law + dual-lobe Henyey-Greenstein constants). VoxelCutout consumes the
// cloud* density-field keys too so its cutout samples the same field
// CloudVolume raymarches.
export default function getCloudControls(p = {}) {
  return folder(
    {
      // Off by default while the raymarch approach is being reconsidered in
      // favor of ~/dev/examples/clouds's voxel-cloud approach — kept wired
      // in (not deleted) so it's easy to flip back on to compare.
      cloudVisible: { label: 'Visible', value: p.cloudVisible ?? false },
      cloudPosition: {
        label: 'Position',
        value: p.cloudPosition ?? { x: 0, y: 8, z: 0 },
      },
      cloudWidth: {
        label: 'Width',
        value: p.cloudWidth ?? 16,
        min: 2,
        max: 40,
        step: 0.5,
      },
      cloudHeight: {
        label: 'Height',
        value: p.cloudHeight ?? 9,
        min: 2,
        max: 30,
        step: 0.5,
      },
      cloudDepth: {
        label: 'Depth',
        value: p.cloudDepth ?? 16,
        min: 2,
        max: 40,
        step: 0.5,
      },
      cloudTileScale: {
        label: 'Tile Scale',
        value: p.cloudTileScale ?? 2,
        min: 0.25,
        max: 8,
        step: 0.05,
      },
      cloudNoiseFreq: {
        label: 'Noise Frequency',
        value: p.cloudNoiseFreq ?? 4,
        min: 1,
        max: 16,
        step: 0.5,
      },
      cloudPerlinOctaves: {
        label: 'Perlin Octaves',
        value: p.cloudPerlinOctaves ?? 7,
        min: 1,
        max: 8,
        step: 1,
      },
      cloudScrollSpeed: {
        label: 'Scroll Speed',
        value: p.cloudScrollSpeed ?? 0.1,
        min: 0,
        max: 1,
        step: 0.01,
      },
      cloudSeed: {
        label: 'Seed',
        value: p.cloudSeed ?? 1,
        min: 0,
        max: 999,
        step: 1,
      },
      cloudSteps: {
        label: 'Raymarch Steps',
        value: p.cloudSteps ?? 48,
        min: 8,
        max: 300,
        step: 1,
      },
      cloudLightSteps: {
        label: 'Light Steps',
        value: p.cloudLightSteps ?? 3,
        min: 1,
        max: 8,
        step: 1,
      },
      cloudLightStepSize: {
        label: 'Light Step Size',
        value: p.cloudLightStepSize ?? 1.2,
        min: 0.05,
        max: 6,
        step: 0.05,
      },
      cloudDensityScale: {
        label: 'Density Scale',
        value: p.cloudDensityScale ?? 1,
        min: 0.1,
        max: 3,
        step: 0.05,
      },
      cloudLightAbsorption: {
        label: 'Light Absorption',
        value: p.cloudLightAbsorption ?? 1,
        min: 0.1,
        max: 4,
        step: 0.05,
      },
      cloudAnisotropy: {
        label: 'Anisotropy (g)',
        value: p.cloudAnisotropy ?? 0.4,
        min: -0.99,
        max: 0.99,
        step: 0.01,
      },
      cloudPhaseMix: {
        label: 'Phase Mix',
        value: p.cloudPhaseMix ?? 0.4,
        min: 0,
        max: 1,
        step: 0.01,
      },
      cloudLightPosition: {
        label: 'Light Position',
        value: p.cloudLightPosition ?? { x: -10, y: 14, z: 14 },
      },
      cloudLightColor: {
        label: 'Light Color',
        value: p.cloudLightColor ?? '#ffffff',
      },
      cloudAmbientColor: {
        label: 'Ambient Color',
        value: p.cloudAmbientColor ?? '#ffffff',
      },
    },
    { collapsed: true }
  );
}
