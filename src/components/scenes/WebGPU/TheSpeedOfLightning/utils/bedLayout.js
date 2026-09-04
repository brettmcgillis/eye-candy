/* eslint-disable no-param-reassign */
import { createSeededRandom } from '@elements/Lightning/lightningUtils';

// Stores xz and a burial depth only — resting height is evaluated in the shader
// from bedSurface(), so the bed can be reshaped at runtime without re-uploading
// 300k positions. Most grains get a shallow burial so the surface reads as an
// unbroken bed; the rest fill in beneath it to catch shadow and give the rim
// depth when the camera is low.
export default function createBedLayout({
  count,
  home,
  minBury = 0,
  offset,
  radialBias = 0.5,
  radius,
  seed,
  surfaceFraction = 0.72,
  thickness = 0.09,
}) {
  const random = createSeededRandom(seed);

  for (let index = 0; index < count; index += 1) {
    const slot = (offset + index) * 4;
    const angle = random() * Math.PI * 2;
    // radialBias 0.5 is an even spread over the disc; lower values crowd the
    // rim, which is where the bolt reserve is drawn from first.
    const distance = random() ** radialBias * radius;
    const buried = index < count * surfaceFraction ? random() ** 3 : random();

    home[slot] = Math.cos(angle) * distance;
    home[slot + 1] = 0;
    home[slot + 2] = Math.sin(angle) * distance;
    home[slot + 3] = minBury + buried * thickness;
  }
}
