/* eslint-disable no-param-reassign */
import { createSeededRandom } from '@elements/Lightning/lightningUtils';
import { polygonOutside } from '@utils/regularPolygon';

// Lays the bed out in unit space: xz inside the unit outline, burial as a 0..1
// fraction. Bed radius and sand depth are applied as uniforms in the shader,
// so changing either (a preset switch does) is a uniform write rather than a
// teardown and re-upload of every grain.
//
// Resting height isn't stored at all — it's read from the reaction-diffusion
// field every frame.
//
// Rejection sampled against the outline rather than sampled in polar form.
// Scaling a polar radius by the outline's reach at that angle is cheaper, but
// it hands every angular wedge the same number of grains over a different
// area, so a hexagon comes out visibly sparse at the points.
export default function createBedLayout({ count, home, seed, shape }) {
  const random = createSeededRandom(seed);

  for (let index = 0; index < count; index += 1) {
    const slot = index * 4;

    let x = 0;
    let z = 0;
    // Bounded, not while(true): a degenerate outline must not hang the bake.
    for (let attempt = 0; attempt < 64; attempt += 1) {
      x = random() * 2 - 1;
      z = random() * 2 - 1;
      if (!shape || !polygonOutside(shape, x, z)) break;
    }

    const buried = index < count * 0.72 ? random() ** 3 : random();

    home[slot] = x;
    home[slot + 1] = 0;
    home[slot + 2] = z;
    home[slot + 3] = buried;
  }
}
