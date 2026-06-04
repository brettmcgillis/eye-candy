import {
  Fn,
  length,
  mix,
  oneMinus,
  sin,
  smoothstep,
  time,
  uv,
  vec2,
  vec4,
} from 'three/tsl';

const RETRO_SCANLINE_TIME_SCALE = 60;
const RETRO_SCANLINE_MIN_MODULATION = 0.88;
const RETRO_SCANLINE_MAX_MODULATION = 1;

export const applyRetroScanlines = Fn(
  ([inputNode, intensityNode, densityNode, speedNode]) => {
    const scanlineFrequency = densityNode.mul(360).add(8);
    const phase = uv()
      .y.mul(scanlineFrequency)
      .add(time.mul(speedNode).mul(RETRO_SCANLINE_TIME_SCALE));
    const scanlineBand = sin(phase).mul(0.5).add(0.5);
    const scanlineModulation = scanlineBand
      .mul(RETRO_SCANLINE_MAX_MODULATION - RETRO_SCANLINE_MIN_MODULATION)
      .add(RETRO_SCANLINE_MIN_MODULATION);
    const scanlinedColor = inputNode.rgb.mul(scanlineModulation);
    return vec4(mix(inputNode.rgb, scanlinedColor, intensityNode), inputNode.a);
  }
);

export const applyRetroVignette = Fn(([inputNode, intensityNode]) => {
  const centeredUv = uv().sub(vec2(0.5));
  const vignetteMask = smoothstep(0.3, 1, length(centeredUv).mul(1.8)).mul(
    intensityNode
  );
  const vignettedColor = inputNode.rgb.mul(oneMinus(vignetteMask));
  return vec4(vignettedColor, inputNode.a);
});

export const applyRetroAffineDistortion = Fn(([inputNode, amountNode]) => {
  const centeredUv = uv().sub(vec2(0.5));
  const skew = centeredUv.x.mul(centeredUv.y).mul(amountNode).mul(2.4);
  const shiftedColor = vec4(
    inputNode.r.add(skew.mul(0.18)),
    inputNode.g,
    inputNode.b.sub(skew.mul(0.18)),
    inputNode.a
  );
  return vec4(mix(inputNode.rgb, shiftedColor.rgb, amountNode), inputNode.a);
});
