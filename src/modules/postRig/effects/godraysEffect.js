import { float, int, color as threeColor, uniform } from 'three/tsl';

import { bilateralBlur, depthAwareBlend, godrays } from '@modules/tsl';

export const defaults = {
  blendColor: '#ffffff',
  blur: true,
  density: 0.7,
  distanceAttenuation: 1.2,
  edgeRadius: 3,
  edgeStrength: 1.4,
  light: null,
  maxDensity: 0.4,
  raymarchSteps: 48,
};

export function controls(slot) {
  return {
    [`${slot.prefix}Density`]: {
      label: 'Density',
      max: 3,
      min: 0,
      step: 0.05,
      value: slot.density,
    },
    [`${slot.prefix}MaxDensity`]: {
      label: 'Max Density',
      max: 1,
      min: 0,
      step: 0.05,
      value: slot.maxDensity,
    },
    [`${slot.prefix}DistanceAttenuation`]: {
      label: 'Distance Falloff',
      max: 4,
      min: 0,
      step: 0.1,
      value: slot.distanceAttenuation,
    },
    [`${slot.prefix}RaymarchSteps`]: {
      label: 'Raymarch Steps',
      max: 120,
      min: 8,
      step: 1,
      value: slot.raymarchSteps,
    },
    [`${slot.prefix}BlendColor`]: {
      label: 'Blend Color',
      value: slot.blendColor,
    },
  };
}

// GodraysNode raymarches a shadow map, so this slot only builds once the light
// it names has a shadow map allocated. PostRig re-runs the build when that
// becomes true — see the readiness handling there.
export function isReady(slot, light) {
  return Boolean(light?.shadow?.map?.depthTexture);
}

export function create({ ctx, input, light, slot }) {
  const node = godrays(ctx.depthNode, ctx.camera, light);
  const raysColor = node.getTextureNode();
  const blurred = slot.blur ? bilateralBlur(raysColor).getTextureNode() : null;

  const uBlendColor = uniform(threeColor(slot.blendColor));
  const uEdgeRadius = uniform(int(slot.edgeRadius));
  const uEdgeStrength = uniform(float(slot.edgeStrength));

  return {
    node: depthAwareBlend(
      input,
      blurred ?? raysColor,
      ctx.depthNode,
      ctx.camera,
      {
        blendColor: uBlendColor,
        edgeRadius: uEdgeRadius,
        edgeStrength: uEdgeStrength,
      }
    ),
    update: (values) => {
      node.density.value = values[`${slot.prefix}Density`] ?? slot.density;
      node.maxDensity.value =
        values[`${slot.prefix}MaxDensity`] ?? slot.maxDensity;
      node.distanceAttenuation.value =
        values[`${slot.prefix}DistanceAttenuation`] ?? slot.distanceAttenuation;
      node.raymarchSteps.value =
        values[`${slot.prefix}RaymarchSteps`] ?? slot.raymarchSteps;
      uBlendColor.value.set(
        values[`${slot.prefix}BlendColor`] ?? slot.blendColor
      );
    },
  };
}
