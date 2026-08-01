import { folder } from 'leva';

// Lighting controls, keys 1:1 with presets/presets.js (docs/scene-
// conventions.md §9). Defaults match ~/dev/examples/260708_AutomataChunks's
// own DEFAULT_SETTINGS (types.ts) exactly — see components/LightRig.jsx for
// how these drive the actual key/rim/bounce/ambient rig.
export default function getLightingControls(p = {}) {
  return folder(
    {
      lightAzimuth: {
        label: 'Key Azimuth',
        value: p.lightAzimuth ?? 25.65,
        min: 0,
        max: 360,
        step: 0.01,
      },
      lightElevation: {
        label: 'Key Elevation',
        value: p.lightElevation ?? 68.7,
        min: 0,
        max: 90,
        step: 0.01,
      },
      keyLightIntensity: {
        label: 'Key Intensity',
        value: p.keyLightIntensity ?? 2.41,
        min: 0,
        max: 10,
        step: 0.01,
      },
      ambientIntensity: {
        label: 'Ambient (Sky) Intensity',
        value: p.ambientIntensity ?? 0.3,
        min: 0,
        max: 2,
        step: 0.01,
      },
      rimLightIntensity: {
        label: 'Rim Intensity',
        value: p.rimLightIntensity ?? 0.49,
        min: 0,
        max: 5,
        step: 0.01,
      },
      bounceLightIntensity: {
        label: 'Bounce Intensity',
        value: p.bounceLightIntensity ?? 0.07,
        min: 0,
        max: 5,
        step: 0.01,
      },
      shadowIntensity: {
        label: 'Shadow Intensity',
        value: p.shadowIntensity ?? 1.08,
        min: 0,
        max: 2,
        step: 0.01,
      },
      shadowSoftness: {
        label: 'Shadow Softness',
        value: p.shadowSoftness ?? 2.6,
        min: 0,
        max: 10,
        step: 0.01,
      },
      exposure: {
        label: 'Exposure',
        value: p.exposure ?? 0.7,
        min: 0,
        max: 3,
        step: 0.01,
      },
      backgroundColor: {
        label: 'Background Color',
        value: p.backgroundColor ?? '#03040a',
      },
      // Without an environment map, metalness/clearcoat have nothing to
      // reflect except the three directional lights above — reads as flat,
      // dark surfaces punctuated by blown-out hotspots. A neutral studio IBL
      // (background hidden — the scene keeps its own backgroundColor) gives
      // metal/clearcoat a plausible soft reflection instead. Kept low by
      // default — this scene wants weathered/matte, not showroom-glossy;
      // roughness is what should be doing most of the work.
      envIntensity: {
        label: 'Environment Intensity',
        value: p.envIntensity ?? 0.3,
        min: 0,
        max: 3,
        step: 0.01,
      },
    },
    { collapsed: true }
  );
}
