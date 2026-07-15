import { folder } from 'leva';

// Godrays controls (webgpu_postprocessing_godrays.html reference), adapted
// from Windswept/components/getGodraysControls.js — not shared via import
// per docs/scene-conventions.md §6 (no cross-scene imports even for
// identical schemas). godraysVolumeSize here defaults to this scene's own
// grid extent (see CenterLight.jsx) rather than Windswept's compact-swarm
// scale.
export default function getGodraysControls(p = {}) {
  return folder({
    godraysEnabled: { label: 'Enabled', value: p.godraysEnabled ?? true },
    godraysColor: { label: 'Light Color', value: p.godraysColor ?? '#ffd27a' },
    godraysPosition: {
      label: 'Light Position',
      value: p.godraysPosition ?? { x: 0, y: 0, z: 0 },
    },
    godraysIntensity: {
      label: 'Light Intensity',
      value: p.godraysIntensity ?? 20,
      min: 0,
      max: 40,
      step: 0.1,
    },
    godraysBlendColor: {
      label: 'Blend Color',
      value: p.godraysBlendColor ?? '#ffd27a',
    },
    godraysVolumeSize: {
      label: 'Volume Size',
      value: p.godraysVolumeSize ?? 24,
      min: 2,
      max: 80,
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
  });
}
