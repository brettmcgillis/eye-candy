import {
  If,
  abs,
  clamp,
  float,
  floor,
  int,
  max,
  min,
  select,
  step,
  vec3,
} from 'three/tsl';

import { hslToRgb, rgbToHsl } from './color';
import { luma } from './shared';

const quantizeLevels = (value, levels) =>
  floor(value.mul(levels.sub(1)).add(0.5)).div(levels.sub(1));

function hueDistance(h1, h2) {
  const diff = abs(h1.sub(h2));
  return min(abs(diff.oneMinus()), diff);
}

const lightnessStep = (value) => floor(value.mul(16).add(0.5)).div(16);

// Alex Charlton's hue-lightness dither: snap to the two palette hues nearest
// this pixel's hue, then let the threshold choose between them — and between
// the two nearest of 16 lightness / saturation steps.
// http://alex-charlton.com/posts/Dithering_on_the_GPU/
function hueLightness(color, threshold, huePalette, hueCount) {
  const hsl = rgbToHsl(color);
  const closest = vec3(-2, 0, 0).toVar();
  const secondClosest = vec3(-2, 0, 0).toVar();

  for (let i = 0; i < hueCount; i += 1) {
    const candidate = huePalette.element(i);
    const distance = hueDistance(candidate.x, hsl.x);
    If(distance.lessThan(hueDistance(closest.x, hsl.x)), () => {
      secondClosest.assign(closest);
      closest.assign(candidate);
    }).ElseIf(distance.lessThan(hueDistance(secondClosest.x, hsl.x)), () => {
      secondClosest.assign(candidate);
    });
  }

  const hueDiff = hueDistance(hsl.x, closest.x).div(
    hueDistance(secondClosest.x, closest.x)
  );
  const pair = (value) => {
    const low = lightnessStep(max(value.sub(0.125), 0));
    const high = lightnessStep(min(value.add(0.124), 1));
    const diff = value.sub(low).div(high.sub(low));
    return select(diff.lessThan(threshold), low, high);
  };

  const hue = select(hueDiff.lessThan(threshold), closest.x, secondClosest.x);
  return hslToRgb(vec3(hue, pair(hsl.y), pair(hsl.z)));
}

export default function applyQuantize(mode, color, rawThreshold, u, counts) {
  const threshold = rawThreshold.add(u.ditherOffset).mul(u.ditherStrength);
  const luminance = luma(color);

  if (mode === 'threshold') return vec3(step(threshold, luminance));
  if (mode === 'grayscale')
    return quantizeLevels(vec3(luminance).add(threshold), u.colorNum);
  if (mode === 'color') return quantizeLevels(color.add(threshold), u.colorNum);
  if (mode === 'hueLightness')
    return hueLightness(color, threshold, u.huePalette, counts.hueCount);

  const levels = counts.paletteCount;
  const level = quantizeLevels(luminance.add(threshold), float(levels));
  const index = clamp(floor(level.mul(levels)), 0, levels - 1);
  return u.palette.element(int(index));
}
