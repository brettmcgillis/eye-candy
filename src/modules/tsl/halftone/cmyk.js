import {
  Fn,
  clamp,
  cos,
  float,
  floor,
  fract,
  fwidth,
  length,
  min,
  radians,
  screenCoordinate,
  screenSize,
  select,
  sin,
  sqrt,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';

import { antialiasedStep, opaque } from './shared';

function rotate(point, angleDeg) {
  const angle = radians(angleDeg);
  const c = cos(angle);
  const s = sin(angle);
  return vec2(
    c.mul(point.x).add(s.mul(point.y)),
    s.negate().mul(point.x).add(c.mul(point.y))
  );
}

const toGrid = (angleDeg, u) =>
  rotate(screenCoordinate.xy, angleDeg).div(u.pixelSize);

function cellCenterUV(angleDeg, u) {
  const center = floor(toGrid(angleDeg, u)).add(0.5);
  return rotate(center, angleDeg.negate()).mul(u.pixelSize).div(screenSize);
}

function halftoneDot(angleDeg, coverage, u) {
  const d = length(fract(toGrid(angleDeg, u)).sub(0.5));
  const r = u.dotSize.mul(sqrt(clamp(coverage, 0, 1)));
  return antialiasedStep(r, fwidth(d), d).oneMinus();
}

// Matt DesLauriers' RGB → CMYK:
// https://gist.github.com/mattdesl/e40d3189717333293813626cbdb2c1d1
export function rgbToCmyk(rgb) {
  const k = min(rgb.r.oneMinus(), min(rgb.g.oneMinus(), rgb.b.oneMinus()));
  const invK = k.oneMinus();
  const cmy = select(
    invK.notEqual(0),
    vec3(rgb.oneMinus().sub(k)).div(invK),
    vec3(0)
  );
  return clamp(vec4(cmy, k), 0, 1);
}

export function buildCmyk(sampleFn, u) {
  return Fn(() => {
    const angles = u.cmykAngles;
    const strengths = u.cmykStrengths;
    const channel = (angle) => rgbToCmyk(sampleFn(cellCenterUV(angle, u)).rgb);

    const dotC = halftoneDot(angles.x, channel(angles.x).x, u);
    const dotM = halftoneDot(angles.y, channel(angles.y).y, u);
    const dotY = halftoneDot(angles.z, channel(angles.z).z, u);
    const dotK = halftoneDot(angles.w, channel(angles.w).w, u);

    const ink = vec3(
      float(1).sub(strengths.x.mul(dotC)),
      float(1).sub(strengths.y.mul(dotM)),
      float(1).sub(strengths.z.mul(dotY))
    ).mul(float(1).sub(strengths.w.mul(dotK)));

    return opaque(u.paperColor.mul(ink));
  })();
}
