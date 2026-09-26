import {
  Fn,
  abs,
  distance,
  dot,
  float,
  floor,
  fract,
  fwidth,
  int,
  length,
  max,
  min,
  mix,
  mod,
  screenSize,
  screenUV,
  select,
  sin,
  smoothstep,
  time,
  uniformArray,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';

import { aspectGrid, snapToGrid } from './maskOutputs';

const LUMA = vec3(0.299, 0.587, 0.114);
const BAYER_4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

function boxSdf(point, halfSize) {
  const delta = abs(point).sub(halfSize);
  return length(max(delta, vec2(0))).add(min(max(delta.x, delta.y), 0));
}

function segmentProjection(point, start, end) {
  const segment = end.sub(start);
  return dot(point.sub(start), segment)
    .div(max(dot(segment, segment), 0.0001))
    .clamp(0, 1);
}

function straightSegmentPoint(point, start, end) {
  return start.add(end.sub(start).mul(segmentProjection(point, start, end)));
}

// Cubic Bézier whose control points bow 20% of the length off each side.
function curvedSegmentPoint(point, start, end) {
  const segment = end.sub(start);
  const segmentLength = distance(start, end);
  const direction = segment.div(max(segmentLength, 0.0001));
  const normal = vec2(direction.y.negate(), direction.x);
  const curveAmount = segmentLength.mul(0.2);
  const control1 = start.add(segment.mul(0.33)).add(normal.mul(curveAmount));
  const control2 = start.add(segment.mul(0.67)).sub(normal.mul(curveAmount));
  const t = segmentProjection(point, start, end);
  const s = t.oneMinus();
  return start
    .mul(s.mul(s).mul(s))
    .add(control1.mul(3).mul(s).mul(s).mul(t))
    .add(control2.mul(3).mul(s).mul(t).mul(t))
    .add(end.mul(t.mul(t).mul(t)));
}

function thermal(color) {
  const intensity = dot(color, LUMA);
  const timeOffset = mod(time.div(10), 1);
  const h = mod(intensity.mul(300).add(timeOffset.mul(360)), 360).div(60);
  const saturation = intensity.mul(2).add(0.5);
  const lightness = intensity.mul(0.25).add(0.3);
  const chroma = abs(lightness.mul(2).sub(1)).oneMinus().mul(saturation);
  const secondary = chroma.mul(abs(mod(h, 2).sub(1)).oneMinus());
  const sextant = (index, rgb) => [h.lessThan(index), rgb];
  const rgb = [
    sextant(1, vec3(chroma, secondary, 0)),
    sextant(2, vec3(secondary, chroma, 0)),
    sextant(3, vec3(0, chroma, secondary)),
    sextant(4, vec3(0, secondary, chroma)),
    sextant(5, vec3(secondary, 0, chroma)),
  ].reduceRight(
    (otherwise, [test, value]) => select(test, value, otherwise),
    vec3(chroma, 0, secondary)
  );
  return rgb.add(lightness.sub(chroma.div(2)));
}

function chromaticDither(scene, u) {
  const grid = aspectGrid(u.ditherRows);
  const luminance = dot(scene.sample(snapToGrid(screenUV, grid)).rgb, LUMA);
  const bayer = uniformArray(BAYER_4, 'float');
  const orderedDither = (uv) => {
    const cell = mod(floor(uv.mul(grid)), 4);
    const threshold = bayer
      .element(int(cell.y.mul(4).add(cell.x)))
      .add(2.5)
      .div(16);
    return select(luminance.clamp(0, 1).greaterThan(threshold), 1, 0);
  };
  const offset = vec2(float(0.5).div(u.ditherRows), 0);
  const noiseCell = floor(screenUV.mul(grid)).add(
    vec2(time.mul(17), time.mul(29))
  );
  const noise = fract(
    sin(dot(noiseCell, vec2(12.9898, 78.233))).mul(43758.5453)
  )
    .sub(0.5)
    .mul(0.08);
  return vec3(
    orderedDither(screenUV.sub(offset)),
    orderedDither(screenUV),
    orderedDither(screenUV.add(offset))
  ).add(noise);
}

export default function buildBlobOutput({
  scene,
  blobBuffer,
  maxBlobs,
  fill,
  segments,
  u,
}) {
  return Fn(() => {
    const aspect = screenSize.x.div(screenSize.y);
    const drawUv = vec2(screenUV.x.mul(aspect), screenUV.y);
    const sceneColor = scene.sample(screenUV).rgb;
    const fillMask = float(0).toVar();
    const lineMask = float(0).toVar();

    for (let i = 0; i < maxBlobs; i += 1) {
      const blob = blobBuffer.element(i);
      const active = blob.w.greaterThan(0.04).toFloat();
      const center = vec2(blob.x.mul(aspect), blob.y);
      const distanceToBox = boxSdf(
        drawUv.sub(center),
        vec2(blob.z).mul(u.boxScale)
      );
      const edgeWidth = fwidth(distanceToBox).mul(2.5);
      const box = smoothstep(0, edgeWidth, abs(distanceToBox))
        .oneMinus()
        .mul(active);
      fillMask.assign(
        max(
          fillMask,
          smoothstep(0, edgeWidth, distanceToBox).oneMinus().mul(active)
        )
      );
      lineMask.assign(max(lineMask, box));

      if (segments) {
        const next = blobBuffer.element((i + 1) % maxBlobs);
        const nextActive = next.w.greaterThan(0.04).toFloat();
        const nextCenter = vec2(next.x.mul(aspect), next.y);
        const segmentPoint = mix(
          straightSegmentPoint(drawUv, center, nextCenter),
          curvedSegmentPoint(drawUv, center, nextCenter),
          u.segmentCurve
        );
        const line = smoothstep(0, 0.002, distance(drawUv, segmentPoint))
          .oneMinus()
          .mul(active)
          .mul(nextActive);
        lineMask.assign(max(lineMask, line));
      }
    }

    let color = sceneColor;
    if (fill !== 'none') {
      const effectColor =
        fill === 'thermal' ? thermal(sceneColor) : chromaticDither(scene, u);
      const inside = select(
        u.fillOutside.greaterThan(0.5),
        fillMask.oneMinus(),
        fillMask
      );
      color = mix(sceneColor, effectColor, inside);
    }

    return vec4(mix(color, u.lineColor, lineMask), 1);
  })();
}
