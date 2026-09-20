/* eslint-disable no-param-reassign */
import { mulberry32 } from '@utils/noise2d';

import sampleField from '../sampleField';
import { bedArea, bedOutside } from '../shape/bedShape';

// A stratified grid rather than uniform random: the whole point of the grain
// bed is even coverage, and rejection-free random sampling leaves clumps and
// bald patches that read as dirt on the lens from directly overhead. One grain
// per cell, jittered inside it, is the cheapest sampling that has neither.
//
// Role is decided once, here, from the same baked bed the solver uses. It is
// measured against the still surface the bake parked in .w, so a coast that
// floods to one flat level and a stream whose surface runs downhill sort their
// grains by the same rule. The threshold carries per-grain noise so the
// waterline is a dithered band of interleaved rock and water grains rather
// than a drawn line.
export default function createGrainLayout({
  count,
  field,
  jitter,
  resolution,
  roleFeather,
  seed,
  shape,
  waterline,
  worldSize,
}) {
  const inset = shape ? shape.inset : 0;
  const fill = inset > 0 ? bedArea(shape, inset) / (worldSize * worldSize) : 1;
  // Count is a count: the grid is sized so that this many grains land INSIDE
  // the bed, whatever its shape. The buffer is a function of count alone, with
  // headroom for the boundary cells, so reshaping never resizes a buffer and
  // never rebuilds the pipeline.
  const side = Math.max(2, Math.round(Math.sqrt(count / Math.max(fill, 1e-3))));
  const total = Math.ceil(count * 1.08);
  const home = new Float32Array(total * 4);
  const random = mulberry32(seed + 17);
  const spacing = worldSize / side;
  let live = 0;

  for (let iz = 0; iz < side; iz += 1) {
    for (let ix = 0; ix < side; ix += 1) {
      const x =
        ((ix + 0.5) / side - 0.5) * worldSize +
        (random() - 0.5) * spacing * jitter;
      const z =
        ((iz + 0.5) / side - 0.5) * worldSize +
        (random() - 0.5) * spacing * jitter;

      const bed = sampleField(field, resolution, worldSize, x, z);
      const rest = sampleField(field, resolution, worldSize, x, z, 3);
      // Drawn before the shape test, so masking a grain out never shifts the
      // stream and the field is the same field at every shape.
      const feather = (random() - 0.5) * roleFeather;
      const grainSeed = random();
      const rock = bed > rest + waterline + feather;

      if (live < total && !(shape && bedOutside(shape, x, z, inset))) {
        const slot = live * 4;
        live += 1;

        home[slot] = x;
        home[slot + 1] = z;
        home[slot + 2] = grainSeed;
        // Three classes, not two: 1 is rock, 0.5 is bank sand -- water-role, but
        // living above the still surface so it is the same material as the
        // ground it lies on -- and 0 is open water. Baked here rather than read
        // from how wet the grain is right now, because a grain must never change
        // size because the water moved: that is a grain appearing and
        // disappearing.
        let material = 0;
        if (rock) material = 1;
        else if (bed > rest) material = 0.5;
        home[slot + 3] = material;
      }
    }
  }

  return { home, live, side, total };
}
