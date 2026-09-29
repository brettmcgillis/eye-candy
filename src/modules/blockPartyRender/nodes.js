import {
  abs,
  float,
  floor,
  instancedBufferAttribute,
  mix,
  normalGeometry,
  step,
  texture,
  vec2,
} from 'three/tsl';

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

// The GPU twin of paletteCoordinate in @modules/blockParty: repeat, shift,
// then fold back mirrored, so the plot SVG picks the same pen.
function paletteCoordinate(tone, uniforms) {
  const u = tone.mul(uniforms.paletteRepeat).add(uniforms.paletteShift);
  const folded = u.sub(floor(u.div(2)).mul(2));
  const mirrored = mix(folded, float(2).sub(folded), step(1, folded));

  return mix(mirrored, float(1).sub(mirrored), uniforms.paletteReverse);
}

// A cell's palette colour and how much of it `target` takes: nothing when no
// palette is chosen or the target is not coloured per cell.
export function cellTint(buffers, uniforms, target) {
  const tone = instancedBufferAttribute(buffers.tone);
  const coordinate = paletteCoordinate(tone, uniforms);
  const color = texture(uniforms.paletteTexture, vec2(coordinate, 0.5)).rgb;
  const amount = uniforms.paletteOn
    .mul(uniforms[target])
    .mul(uniforms.cellStrength);

  return { amount, color };
}
