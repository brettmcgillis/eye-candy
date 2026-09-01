import { Fn } from 'three/tsl';

function ridge(x, z, frequency) {
  const fx = x.mul(frequency);
  const fz = z.mul(frequency);

  return fx
    .add(fz.mul(0.7).cos())
    .sin()
    .mul(fz.mul(0.9).sub(fx.mul(0.6).sin()).cos());
}

// Resting height of the sand at a world xz. Evaluated per frame rather than
// baked, so a grain settles to the surface wherever it happens to lie — which
// is what lets ejected grains stay where they land instead of walking home.
//
// Each octave carries progressively more of `phase`: a strike rearranges fine
// surface detail while the large dunes barely move, which reads as loose sand
// being redistributed rather than the whole bed sliding.
const bedSurface = Fn(([x, z, scale, height, phase]) => {
  const coarse = ridge(x.add(phase.mul(0.12)), z, scale.mul(0.42));
  const medium = ridge(
    x.add(11.3).add(phase.mul(0.45)),
    z.sub(4.7),
    scale.mul(1.3)
  );
  const fine = ridge(
    x.sub(6.1).add(phase),
    z.add(8.9).sub(phase.mul(0.6)),
    scale.mul(3.6)
  );

  return coarse.mul(0.55).add(medium.mul(0.3)).add(fine.mul(0.15)).mul(height);
});

// CPU mirror of the graph above, for the one consumer that cannot run on the
// GPU: the accretion walk, which has to know where the sand surface is in order
// to stop the bolt at it. KEEP THE TWO IN SYNC — they are deliberately adjacent
// so a change to one is a visible omission in the other.
function ridgeCPU(x, z, frequency) {
  const fx = x * frequency;
  const fz = z * frequency;

  return (
    Math.sin(fx + Math.cos(fz * 0.7)) * Math.cos(fz * 0.9 - Math.sin(fx * 0.6))
  );
}

export function sampleBedSurface(x, z, scale, height, phase) {
  return (
    (ridgeCPU(x + phase * 0.12, z, scale * 0.42) * 0.55 +
      ridgeCPU(x + 11.3 + phase * 0.45, z - 4.7, scale * 1.3) * 0.3 +
      ridgeCPU(x - 6.1 + phase, z + 8.9 - phase * 0.6, scale * 3.6) * 0.15) *
    height
  );
}

export default bedSurface;
