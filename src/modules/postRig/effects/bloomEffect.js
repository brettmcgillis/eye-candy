import { gaussianBlur } from 'three/addons/tsl/display/GaussianBlurNode.js';
import { max, uniform } from 'three/tsl';

export const defaults = {
  radius: 0.4,
  strength: 0.35,
  threshold: 0.9,
};

export function controls(slot) {
  return {
    [`${slot.prefix}Threshold`]: {
      label: 'Threshold',
      max: 3,
      min: 0,
      step: 0.05,
      value: slot.threshold,
    },
    [`${slot.prefix}Strength`]: {
      label: 'Strength',
      max: 2,
      min: 0,
      step: 0.05,
      value: slot.strength,
    },
    [`${slot.prefix}Radius`]: {
      label: 'Radius',
      max: 1,
      min: 0.1,
      step: 0.05,
      value: slot.radius,
    },
  };
}

// `radius` is baked into the blur at build time rather than being a uniform,
// so changing it rebuilds the chain — same as the standalone Bloom component.
export function create({ input, slot }) {
  const uThreshold = uniform(slot.threshold);
  const uStrength = uniform(slot.strength);
  const bright = max(input.sub(uThreshold), 0);
  const blurred = gaussianBlur(bright, slot.radius, 6, {
    resolutionScale: 0.5,
  });

  return {
    node: input.add(blurred.mul(uStrength)),
    rebuildKeys: [`${slot.prefix}Radius`],
    update: (values) => {
      uThreshold.value = values[`${slot.prefix}Threshold`] ?? slot.threshold;
      uStrength.value = values[`${slot.prefix}Strength`] ?? slot.strength;
    },
  };
}
