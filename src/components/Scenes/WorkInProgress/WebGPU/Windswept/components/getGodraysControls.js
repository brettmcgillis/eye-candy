import { folder } from 'leva';

// Godrays controls (webgpu_postprocessing_godrays.html reference). Keys
// match presets/presets.js 1:1 (docs/scene-conventions.md §9). Ranges
// mirror the reference example's own GUI (raymarchSteps/density/
// maxDensity/distanceAttenuation/edgeRadius/edgeStrength/blur); light
// color/intensity and the composite blend color aren't in the reference's
// GUI (it hardcodes them) but are exposed here since they're the most
// obvious things to want to retune per scene. godraysVolumeSize is the
// point light's shadow-camera far plane (see CenterLight.jsx) — the
// raymarch/shadow-map box's world-unit size, independent of Swarm.worldScale
// (the swarm's own spatial spread). Shrinking it concentrates the shadow
// map's fixed texel budget onto a smaller volume, sharpening per-leaf
// shadow edges, without having to also shrink the whole scene.
export default function getGodraysControls(p = {}) {
  return folder(
    {
      godraysEnabled: { label: 'Enabled', value: p.godraysEnabled ?? true },
      godraysColor: {
        label: 'Light Color',
        value: p.godraysColor ?? '#ffd27a',
      },
      godraysPosition: {
        label: 'Light Position',
        step: 0.1,
        value: p.godraysPosition ?? { x: 0, y: 1, z: 0 },
      },
      godraysIntensity: {
        label: 'Light Intensity',
        value: p.godraysIntensity ?? 15,
        min: 0,
        max: 30,
        step: 0.1,
      },
      godraysBlendColor: {
        label: 'Blend Color',
        value: p.godraysBlendColor ?? '#ffd27a',
      },
      godraysVolumeSize: {
        label: 'Volume Size',
        value: p.godraysVolumeSize ?? 16,
        min: 2,
        max: 60,
        step: 0.5,
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
