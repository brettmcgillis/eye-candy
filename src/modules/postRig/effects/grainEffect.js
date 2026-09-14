import {
  dot,
  floor,
  fract,
  screenCoordinate,
  sin,
  time,
  uniform,
  vec2,
  vec3,
} from 'three/tsl';

export const defaults = {
  amount: 0.06,
  animated: true,
  scale: 1,
};

export function controls(slot) {
  return {
    [`${slot.prefix}Amount`]: {
      label: 'Amount',
      max: 0.4,
      min: 0,
      step: 0.005,
      value: slot.amount,
    },
    [`${slot.prefix}Scale`]: {
      label: 'Scale',
      max: 4,
      min: 0.25,
      step: 0.05,
      value: slot.scale,
    },
    [`${slot.prefix}Animated`]: { label: 'Animated', value: slot.animated },
  };
}

// Per-pixel film grain, the reference's closing move: it sits last in the
// chain so it lands on the finished image rather than being blurred by
// anything downstream.
export function create({ input, slot }) {
  const uAmount = uniform(slot.amount);
  const uScale = uniform(slot.scale);
  const uAnimated = uniform(slot.animated ? 1 : 0);

  const cell = floor(screenCoordinate.xy.div(uScale));
  const drift = floor(time.mul(24)).mul(uAnimated);
  const noise = fract(
    sin(dot(cell.add(drift), vec2(12.9898, 78.233))).mul(43758.5453)
  );

  return {
    node: input.add(vec3(noise.sub(0.5).mul(uAmount))),
    update: (values) => {
      uAmount.value = values[`${slot.prefix}Amount`] ?? slot.amount;
      uScale.value = values[`${slot.prefix}Scale`] ?? slot.scale;
      uAnimated.value =
        (values[`${slot.prefix}Animated`] ?? slot.animated) ? 1 : 0;
    },
  };
}
