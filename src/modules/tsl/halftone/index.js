import { texture } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { buildCmyk } from './cmyk';
import {
  buildDots,
  buildDotsAndSquares,
  buildRings,
  buildWhiteDots,
} from './grid';
import {
  DEFAULT_KERNEL_RADIUS,
  buildCellWall,
  buildDisplacedRings,
  buildGooey,
} from './kernel';
import {
  HALFTONE_VARIANTS,
  createUniforms,
  resolveOptions,
  updateUniforms,
} from './shared';

export { HALFTONE_VARIANTS };
export { default as createMouseTrail } from './mouseTrail';

const BUILDERS = {
  dots: buildDots,
  whiteDots: buildWhiteDots,
  dotsAndSquares: buildDotsAndSquares,
  rings: buildRings,
  cmyk: buildCmyk,
  cellWall: buildCellWall,
  gooey: buildGooey,
  displacedRings: buildDisplacedRings,
};

let stillTrail = null;
function emptyTrail() {
  if (!stillTrail) {
    stillTrail = new THREE.DataTexture(new Float32Array(4), 1, 1);
    stillTrail.type = THREE.FloatType;
    stillTrail.needsUpdate = true;
  }
  return texture(stillTrail);
}

// `kernelRadius` is baked into the shader; `trail` only feeds displacedRings.
export function halftone(sampleFn, options = {}) {
  const variant = HALFTONE_VARIANTS.includes(options.variant)
    ? options.variant
    : 'dots';
  const values = resolveOptions(variant, options);
  const uniforms = createUniforms(values);

  const colorNode = BUILDERS[variant](sampleFn, uniforms, {
    kernelRadius: options.kernelRadius ?? DEFAULT_KERNEL_RADIUS[variant],
    trail: options.trail ?? emptyTrail(),
  });

  return { colorNode, uniforms };
}

export function updateHalftoneUniforms(uniforms, values) {
  updateUniforms(uniforms, values);
}
