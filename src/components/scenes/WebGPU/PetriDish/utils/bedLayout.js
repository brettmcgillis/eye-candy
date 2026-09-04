/* eslint-disable no-param-reassign */
import { createSeededRandom } from '@elements/Lightning/lightningUtils';

// Lays the bed out in unit space: xz on the unit disc, burial as a 0..1
// fraction. Bed radius and sand depth are applied as uniforms in the shader,
// so changing either (a preset switch does) is a uniform write rather than a
// teardown and re-upload of every grain.
//
// Resting height isn't stored at all — it's read from the reaction-diffusion
// field every frame.
export default function createBedLayout({
  count,
  home,
  radialBias = 0.5,
  seed,
  surfaceFraction = 0.72,
}) {
  const random = createSeededRandom(seed);

  for (let index = 0; index < count; index += 1) {
    const slot = index * 4;
    const angle = random() * Math.PI * 2;
    const distance = random() ** radialBias;
    const buried = index < count * surfaceFraction ? random() ** 3 : random();

    home[slot] = Math.cos(angle) * distance;
    home[slot + 1] = 0;
    home[slot + 2] = Math.sin(angle) * distance;
    home[slot + 3] = buried;
  }
}
