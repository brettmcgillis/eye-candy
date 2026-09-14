import { abs, float, mix, normalGeometry, step } from 'three/tsl';

export function select(mode, options) {
  return options
    .slice(1)
    .reduce(
      (chosen, option, index) => mix(chosen, option, step(index + 0.5, mode)),
      options[0]
    );
}

// Canvas composites alpha in sRGB, so a reference alpha has to be re-expressed
// as linear coverage toward black or every ramp comes out pale.
export function canvasAlpha(alpha) {
  return float(1).sub(float(1).sub(alpha).pow(2.2));
}

export function isTop() {
  return abs(normalGeometry.y).greaterThan(0.5);
}
