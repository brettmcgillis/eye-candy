import { folder } from 'leva';

// Godrays postprocess controls (webgpu_postprocessing_godrays.html reference).
// Keys match presets/presets.js 1:1 (docs/scene-conventions.md §9). Ranges
// mirror the reference example's own GUI (raymarchSteps/density/maxDensity/
// distanceAttenuation/edgeRadius/edgeStrength/blur).
//
// The source light itself lives in the Lighting folder under `lightGodray*`
// (utils/lighting.js) — its color/intensity/position, and the shadow `far`
// that used to be `godraysVolumeSize`. GodraysNode reads that volume off the
// light's own shadow camera rather than taking it as a prop, so there's no
// value duplicated across the two folders.
export default function getGodraysControls(p = {}) {
  return folder(
    {
      godraysEnabled: { label: 'Enabled', value: p.godraysEnabled ?? true },
      godraysBlendColor: {
        label: 'Blend Color',
        value: p.godraysBlendColor ?? '#ffd27a',
      },
      godraysLightSphereSize: {
        label: 'Orb Size',
        value: p.godraysLightSphereSize ?? 0.12,
        min: 0.02,
        max: 2,
        step: 0.01,
      },
      godraysDensity: {
        label: 'Density',
        value: p.godraysDensity ?? 0.7,
        min: 0,
        max: 1,
        step: 0.01,
      },
      godraysMaxDensity: {
        label: 'Max Density',
        value: p.godraysMaxDensity ?? 0.5,
        min: 0,
        max: 1,
        step: 0.01,
      },
      godraysDistanceAttenuation: {
        label: 'Distance Attenuation',
        value: p.godraysDistanceAttenuation ?? 2,
        min: 0,
        max: 5,
        step: 0.01,
      },
      godraysRaymarchSteps: {
        label: 'Raymarch Steps',
        value: p.godraysRaymarchSteps ?? 60,
        min: 24,
        max: 250,
        step: 1,
      },
      godraysBlur: { label: 'Blur', value: p.godraysBlur ?? true },
      godraysEdgeRadius: {
        label: 'Edge Radius',
        value: p.godraysEdgeRadius ?? 2,
        min: 0,
        max: 5,
        step: 1,
      },
      godraysEdgeStrength: {
        label: 'Edge Strength',
        value: p.godraysEdgeStrength ?? 2,
        min: 0,
        max: 5,
        step: 0.1,
      },
    },
    { collapsed: true }
  );
}
