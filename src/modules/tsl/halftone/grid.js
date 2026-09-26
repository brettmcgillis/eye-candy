import {
  Fn,
  float,
  floor,
  fract,
  fwidth,
  length,
  max,
  mix,
  mod,
  pow,
  screenCoordinate,
  screenSize,
  select,
  smoothstep,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';

import { antialiasedStep, isOn, luma, opaque } from './shared';

// All four sample the scene at the cell's corner, like the source demos do
// (`pixelSize * floor(uv / pixelSize)`), rather than at its center.
function pixelCell(sampleFn, pixelSize, px = screenCoordinate.xy) {
  const color = sampleFn(
    floor(px.div(pixelSize)).mul(pixelSize).div(screenSize)
  );
  const cellUV = fract(px.div(pixelSize));
  return { color, luminance: luma(color), dist: length(cellUV.sub(0.5)) };
}

export function buildDots(sampleFn, u) {
  return Fn(() => {
    const px = screenCoordinate.xy;
    const row = floor(px.y.div(u.pixelSize));
    const shifted = isOn(u.offset).and(mod(row, 2).equal(1));
    const offsetPx = vec2(
      px.x.add(select(shifted, u.pixelSize.mul(0.5), float(0))),
      px.y
    );
    const { color, luminance, dist } = pixelCell(
      sampleFn,
      u.pixelSize,
      offsetPx
    );

    const radius = select(
      isOn(u.useLuma),
      pow(max(luminance.mul(0.7), 0), 1.75).add(0.08),
      float(0.5)
    );
    const circleMask = smoothstep(radius.sub(0.05), radius, dist).oneMinus();

    return vec4(
      select(isOn(u.useLuma), vec3(circleMask), color.rgb.mul(circleMask)),
      color.a
    );
  })();
}

function whiteDot(color, luminance, dist, u) {
  const radius = u.dotSize.mul(luminance.oneMinus().add(0.1));
  const circle = antialiasedStep(radius, fwidth(dist), dist);
  return mix(color.rgb, u.paperColor, circle.oneMinus());
}

export function buildWhiteDots(sampleFn, u) {
  return Fn(() => {
    const { color, luminance, dist } = pixelCell(sampleFn, u.pixelSize);
    return opaque(whiteDot(color, luminance, dist, u));
  })();
}

export function buildDotsAndSquares(sampleFn, u) {
  return Fn(() => {
    const { color, luminance, dist } = pixelCell(sampleFn, u.pixelSize);

    const radius = u.dotSize.mul(luminance.add(0.1));
    const outside = antialiasedStep(radius, fwidth(dist), dist);
    const dot = mix(color.rgb, u.paperColor, outside);

    return opaque(
      select(luminance.lessThan(0.5), whiteDot(color, luminance, dist, u), dot)
    );
  })();
}

export function buildRings(sampleFn, u) {
  return Fn(() => {
    const { luminance, dist } = pixelCell(sampleFn, u.pixelSize);
    const edgeWidth = fwidth(dist);

    const radius = u.dotSize.mul(luminance.add(0.2));
    const outerCircle = antialiasedStep(radius, edgeWidth, dist);
    const innerCircle = antialiasedStep(
      radius.sub(u.ringThickness),
      edgeWidth,
      dist
    );
    const shape = innerCircle.mul(outerCircle.oneMinus());

    return opaque(mix(u.paperColor, u.inkColor, shape));
  })();
}
