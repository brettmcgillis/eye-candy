import { Fn, floor, screenSize, screenUV, vec3, vec4 } from 'three/tsl';

import { applyMask, curvedEdge, rgbCells, scanlines, shakeUV } from './crt';
import applyQuantize from './quantize';
import {
  DEFAULT_HUE_PALETTE,
  DEFAULT_PALETTE,
  DITHER_PATTERNS,
  DITHER_QUANTIZE,
  createUniforms,
  resolveOptions,
  updateUniforms,
} from './shared';
import patternThreshold from './thresholds';

export { DITHER_PATTERNS, DITHER_QUANTIZE };

// `pattern`, `quantize`, `crt` and palette lengths are baked into the shader.
export function dither(sampleFn, options = {}) {
  const pattern = DITHER_PATTERNS.includes(options.pattern)
    ? options.pattern
    : 'bayer8';
  const quantize = DITHER_QUANTIZE.includes(options.quantize)
    ? options.quantize
    : 'color';
  const crt = Boolean(options.crt);
  const palette = options.palette ?? DEFAULT_PALETTE;
  const huePalette = options.huePalette ?? DEFAULT_HUE_PALETTE;

  const values = resolveOptions({ pattern, quantize, crt }, options);
  const u = createUniforms(values, palette, huePalette);
  const counts = {
    paletteCount: palette.length,
    hueCount: huePalette.length,
  };

  const colorNode = Fn(() => {
    const uv = crt ? shakeUV(screenUV, u) : screenUV;
    const px = uv.mul(screenSize);

    let sampleUV;
    let rgb;
    let mask;
    if (crt) {
      ({ sampleUV, mask } = rgbCells(px, u));
      rgb = vec3(
        sampleFn(sampleUV.add(u.spread)).r,
        sampleFn(sampleUV).g,
        sampleFn(sampleUV.sub(u.spread)).b
      );
    } else {
      sampleUV = floor(px.div(u.pixelSize)).mul(u.pixelSize).div(screenSize);
      rgb = sampleFn(sampleUV).rgb;
    }

    const threshold = patternThreshold(
      pattern,
      sampleUV.mul(screenSize),
      sampleUV
    );
    const dithered = applyQuantize(quantize, rgb, threshold, u, counts);
    if (!crt) return vec4(dithered, 1);

    return vec4(
      applyMask(dithered, mask, u).mul(scanlines(uv, u)).mul(curvedEdge(uv, u)),
      1
    );
  })();

  return { colorNode, uniforms: u };
}

export function updateDitherUniforms(uniforms, values) {
  updateUniforms(uniforms, values);
}
