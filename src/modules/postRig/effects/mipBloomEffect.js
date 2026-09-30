import { mipBloom } from '@modules/tsl';

export const defaults = {
  levels: 6,
  strength: 1,
  threshold: 1,
};

export function controls(slot) {
  return {
    [`${slot.prefix}Threshold`]: {
      label: 'Threshold',
      max: 4,
      min: 0,
      step: 0.05,
      value: slot.threshold,
    },
    [`${slot.prefix}Strength`]: {
      label: 'Strength',
      max: 4,
      min: 0,
      step: 0.05,
      value: slot.strength,
    },
  };
}

// The luminance-damped mip chain from 0b5vr's present pass; `levels` is
// baked into the chain of targets.
export function create({ input, slot }) {
  const merged = { ...defaults, ...slot };
  const bloom = mipBloom(input, {
    levels: merged.levels,
    strength: merged.strength,
    threshold: merged.threshold,
  });

  return {
    node: input.add(bloom),
    update: (values) => {
      bloom.strength.value =
        values[`${slot.prefix}Strength`] ?? merged.strength;
      bloom.threshold.value =
        values[`${slot.prefix}Threshold`] ?? merged.threshold;
    },
  };
}
