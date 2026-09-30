import {
  abs,
  screenSize,
  screenUV,
  select,
  uniform,
  vec2,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

export const defaults = {
  letterbox: 0,
  tint: '#ffffff',
  vignette: 0.2,
};

export function controls(slot) {
  return {
    [`${slot.prefix}Tint`]: { label: 'Tint', value: slot.tint },
    [`${slot.prefix}Vignette`]: {
      label: 'Vignette',
      max: 1,
      min: 0,
      step: 0.01,
      value: slot.vignette,
    },
    [`${slot.prefix}Letterbox`]: {
      label: 'Letterbox',
      max: 4,
      min: 0,
      step: 0.01,
      value: slot.letterbox,
    },
  };
}

// 0b5vr's present: a colour multiply, `1 - k·|p|` on the gamma-encoded frame
// (so raised to 2.2 here, in linear), and black beyond `letterbox` frame
// heights from the centre.
export function create({ input, slot }) {
  const merged = { ...defaults, ...slot };
  const uTint = uniform(new THREE.Color(merged.tint));
  const uVignette = uniform(merged.vignette);
  const uLetterbox = uniform(merged.letterbox);

  const p = screenUV
    .mul(2)
    .sub(1)
    .mul(vec2(screenSize.x.div(screenSize.y), 1));
  const falloff = uVignette.mul(p.length()).oneMinus().max(0).pow(2.2);
  const graded = input.rgb.mul(uTint).mul(falloff);
  const boxed = uLetterbox.greaterThan(0).and(abs(p.x).greaterThan(uLetterbox));

  return {
    node: vec4(select(boxed, graded.mul(0), graded), 1),
    update: (values) => {
      uTint.value.set(values[`${slot.prefix}Tint`] ?? merged.tint);
      uVignette.value = values[`${slot.prefix}Vignette`] ?? merged.vignette;
      uLetterbox.value = values[`${slot.prefix}Letterbox`] ?? merged.letterbox;
    },
  };
}
