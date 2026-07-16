import { folder } from 'leva';

// Subtle forest skybox controls. Keys match presets/presets.js 1:1
// (docs/scene-conventions.md §9). elements/SubtleForestSkybox.jsx bakes its
// own local position/rotation/scale onto the sphere mesh, so these are an
// outer-group multiplier/offset on top of that baked transform, not a
// replacement for it.
export default function getSkyboxControls(p = {}) {
  return folder({
    skyboxVisible: { label: 'Visible', value: p.skyboxVisible ?? true },
    skyboxScale: {
      label: 'Scale',
      value: p.skyboxScale ?? 1,
      min: 0.5,
      max: 4,
      step: 0.05,
    },
    skyboxRotationY: {
      label: 'Rotation Y',
      value: p.skyboxRotationY ?? 0,
      min: 0,
      max: 360,
      step: 1,
    },
  });
}
