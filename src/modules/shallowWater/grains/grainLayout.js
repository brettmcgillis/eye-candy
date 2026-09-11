/* eslint-disable no-param-reassign */
import { mulberry32 } from '@utils/noise2d';

import { sampleBed } from './coastField';
import { WORLD_SIZE } from './constants';

// A stratified grid rather than uniform random: the whole point of the grain
// bed is even coverage, and rejection-free random sampling leaves clumps and
// bald patches that read as dirt on the lens from directly overhead. One grain
// per cell, jittered inside it, is the cheapest sampling that has neither.
//
// Role is decided once, here, from the same baked bed the solver uses. The
// threshold carries per-grain noise so the waterline is a dithered band of
// interleaved rock and water grains rather than a drawn line.
export default function createGrainLayout({
  count,
  field,
  jitter,
  resolution,
  roleFeather,
  seed,
  waterline,
}) {
  const side = Math.max(2, Math.round(Math.sqrt(count)));
  const total = side * side;
  const home = new Float32Array(total * 4);
  const random = mulberry32(seed + 17);
  const spacing = WORLD_SIZE / side;

  for (let iz = 0; iz < side; iz += 1) {
    for (let ix = 0; ix < side; ix += 1) {
      const slot = (iz * side + ix) * 4;
      const x =
        ((ix + 0.5) / side - 0.5) * WORLD_SIZE +
        (random() - 0.5) * spacing * jitter;
      const z =
        ((iz + 0.5) / side - 0.5) * WORLD_SIZE +
        (random() - 0.5) * spacing * jitter;

      const bed = sampleBed(field, resolution, x, z);
      const rock = bed > waterline + (random() - 0.5) * roleFeather;

      home[slot] = x;
      home[slot + 1] = z;
      home[slot + 2] = random();
      // Three classes, not two: 1 is rock, 0.5 is shore sand -- water-role, but
      // living above the waterline so it is the same material as the shore it
      // lies on -- and 0 is sea. Baked here rather than read from how wet the
      // grain is right now, because a grain must never change size because the
      // water moved: that is a grain appearing and disappearing.
      let material = 0;
      if (rock) material = 1;
      else if (bed > 0) material = 0.5;
      home[slot + 3] = material;
    }
  }

  return { home, side, total };
}
