// Screen-space twin of the geometry Slit Scan (glitchMaterial.js): one thin
// strip of the frame is stretched across the span it opens up, and everything
// past it slides along by the same amount. The forward map is
// d = s + stretch * saturate((s - p) / width); this samples by its inverse, so
// stretch = 0 is exactly the identity and the smear stays a frozen row rather
// than a blur.
import {
  Fn,
  float,
  fract,
  mix,
  screenUV,
  select,
  time,
  uniform,
  vec2,
} from 'three/tsl';

import { buildChunkMask, createChunkUniforms } from './screenChunks';

export function createSlitScanUniforms() {
  return {
    axis: uniform(0),
    position: uniform(0.35),
    width: uniform(0.02),
    stretch: uniform(0.3),
    speed: uniform(0),
    jitter: uniform(0),
    chunks: createChunkUniforms(),
  };
}

export function buildSlitScanPostNode(sceneColor, u, chunkMode) {
  return Fn(() => {
    const { mask, chunkHash } = buildChunkMask(chunkMode, u.chunks);
    const active = mask.toVar('ssMask');

    const coord = mix(screenUV.y, screenUV.x, u.axis);
    const slit = fract(
      u.position.add(time.mul(u.speed)).add(chunkHash.mul(u.jitter))
    );
    const width = u.width.max(0.0001);
    const span = width.add(u.stretch);
    const past = coord.sub(slit);

    const source = select(
      past.lessThan(0),
      coord,
      select(
        past.lessThanEqual(span),
        slit.add(past.mul(width.div(span))),
        coord.sub(u.stretch)
      )
    );
    const wrapped = fract(source.add(float(1)));
    const sourceUv = vec2(
      mix(screenUV.x, wrapped, u.axis),
      mix(wrapped, screenUV.y, u.axis)
    );

    return mix(
      sceneColor.sample(screenUV),
      sceneColor.sample(sourceUv),
      active
    );
  })();
}
