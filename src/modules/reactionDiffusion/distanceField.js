import {
  Fn,
  If,
  instanceIndex,
  int,
  ivec2,
  texture as sampleTexture,
  textureStore,
  uniform,
  vec2,
  vec4,
} from 'three/tsl';

import createFieldTexture, { readOnly, writeOnly } from './fieldTexture';

// Jump flood: turns a thresholded field into a true Euclidean distance.
//
// A reaction-diffusion field is a concentration, not a distance, so nothing can
// sphere-trace it directly. This is the bridge — and it is useful to anything
// that needs an SDF out of a rasterised mask, not just to these solvers.

const UNSEEDED = 1e5;

export default function createDistanceField({
  channel = 'y',
  height,
  source,
  width,
}) {
  const uniforms = { threshold: uniform(0.15) };

  const flood = [
    createFieldTexture(width, height),
    createFieldTexture(width, height),
  ];

  const coordOf = () =>
    ivec2(int(instanceIndex.mod(width)), int(instanceIndex.div(width)));
  const clamped = (c) =>
    ivec2(c.x.clamp(0, width - 1), c.y.clamp(0, height - 1));

  // Occupied texels seed themselves; everything else starts unseeded and gets
  // filled in by the jumps.
  const init = Fn(() => {
    const coord = coordOf();
    const value = readOnly(source).load(coord)[channel];
    const seed = vec2(coord).toVar();

    If(value.lessThanEqual(uniforms.threshold), () => {
      seed.assign(vec2(UNSEEDED));
    });

    textureStore(writeOnly(flood[0]), coord, vec4(seed, 0, 1));
  })().compute(width * height);

  function jump(from, to, stride) {
    const read = readOnly(flood[from]);
    const write = writeOnly(flood[to]);

    return Fn(() => {
      const coord = coordOf();
      const here = vec2(coord);
      const best = read.load(coord).xy.toVar();
      const bestDist = here.sub(best).length().toVar();

      [-1, 0, 1].forEach((dx) => {
        [-1, 0, 1].forEach((dy) => {
          const probe = read.load(
            clamped(coord.add(ivec2(dx * stride, dy * stride)))
          ).xy;

          If(probe.x.lessThan(UNSEEDED * 0.5), () => {
            const d = here.sub(probe).length();

            If(d.lessThan(bestDist), () => {
              bestDist.assign(d);
              best.assign(probe);
            });
          });
        });
      });

      textureStore(write, coord, vec4(best, 0, 1));
    })().compute(width * height);
  }

  // Halving strides, largest first — the standard jump flood schedule.
  const passes = [];
  let target = 0;
  let stride = Math.floor(Math.max(width, height) / 2);
  while (stride >= 1) {
    passes.push(jump(target, 1 - target, stride));
    target = 1 - target;
    stride = Math.floor(stride / 2);
  }

  const seedTexture = flood[target];

  // The jump flood stores a nearest-seed INDEX, which cannot be interpolated —
  // sampling it nearest-neighbour makes every sim texel a hard block, and at
  // any upscale the field reads as a lattice of dots rather than a pattern.
  // Resolving it to an actual distance once means consumers can sample it
  // bilinearly and get a smooth surface out of a coarse sim.
  const distanceTexture = createFieldTexture(width, height);

  const resolve = Fn(() => {
    const coord = coordOf();
    const seed = readOnly(seedTexture).load(coord).xy;
    const d = vec2(coord).add(0.5).sub(seed.add(0.5)).length().sub(0.5);

    textureStore(writeOnly(distanceTexture), coord, vec4(d, 0, 0, 1));
  })().compute(width * height);

  // `fieldSize` is the consumer's own pixel extent, so a world position can be
  // mapped into sim texels and the distance handed back in its units.
  // Bilinear, in the consumer's own units. Callers take 0.9 of it so a march
  // cannot step past a thin feature it should have hit.
  function distanceAt(worldPos, fieldSize) {
    return sampleTexture(distanceTexture, worldPos.div(fieldSize))
      .x.mul(fieldSize.y.div(height))
      .mul(0.9);
  }

  return {
    dispatch: (renderer) => {
      renderer.compute(init);
      passes.forEach((pass) => renderer.compute(pass));
      renderer.compute(resolve);
    },
    distanceAt,
    dispose: () => [...flood, distanceTexture].forEach((tex) => tex.dispose()),
    texture: distanceTexture,
    uniforms,
  };
}
