import {
  float,
  fract,
  fwidth,
  length,
  min,
  mix,
  positionWorld,
  smoothstep,
  vec2,
} from 'three/tsl';

import { select } from './nodes';

function lines(coord, width) {
  const cell = fract(coord);
  const edge = min(cell, float(1).sub(cell));
  const nearest = min(edge.x, edge.y);
  const half = width.mul(0.5);

  return float(1).sub(smoothstep(half, half.add(fwidth(nearest)), nearest));
}

// Evaluated in world space so a flush, receded pit floor carries exactly the
// pattern of the ground around it.
export default function groundTone(uniforms) {
  const coord = vec2(positionWorld.x, positionWorld.z).div(
    uniforms.patternScale.mul(uniforms.worldPerPixel)
  );
  const width = uniforms.patternWidth;
  const radius = length(fract(coord).sub(0.5));
  const dots = float(1).sub(
    smoothstep(width, width.add(fwidth(radius)), radius)
  );
  const diagonal = vec2(coord.x.add(coord.y), coord.x.sub(coord.y)).mul(0.7071);
  const mask = select(uniforms.groundPattern, [
    float(0),
    dots,
    lines(coord, width),
    lines(diagonal, width),
  ]);

  return mix(
    uniforms.groundColor,
    uniforms.patternColor,
    mask.mul(uniforms.patternStrength)
  );
}
