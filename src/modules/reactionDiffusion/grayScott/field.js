import {
  Fn,
  If,
  Loop,
  float,
  hash,
  instanceIndex,
  int,
  ivec2,
  mix,
  select,
  smoothstep,
  textureStore,
  uniform,
  vec2,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import createFieldTexture, { readOnly, writeOnly } from '@utils/storageField';

// Classic Gray-Scott feed/kill, ported from Hadyn's React||Diffuse
// (https://www.shadertoy.com/view/Wt23W1).
//
// Deliberately not the same algorithm as the expansive solver next door: that
// one advects a field along its own blurred gradient and looks quite different.
// Both are offered because they are different tools, not two spellings of one.
//
// Presents the same surface as the expansive field — update / inject / reseed /
// outputTexture / uniforms / dispose — so a scene can switch between them.

const LAPLACIAN = [
  [-1, 1, 0.05],
  [1, 1, 0.05],
  [-1, -1, 0.05],
  [1, -1, 0.05],
  [-1, 0, 0.2],
  [1, 0, 0.2],
  [0, 1, 0.2],
  [0, -1, 0.2],
];

// Explicit Euler on a 9-point Laplacian is stable only while D*dt stays under
// about a quarter, and this kernel diffuses U at 1. Fixed rather than scaled by
// frame time: every dt the clamp allowed was the same one, so `stepScale` used
// to be inert above 14.4 — it now buys iterations, which is the only lever
// Gray-Scott actually has.
const DT = 0.24;

// Iterations run as 0->1->0 pairs, so the settled half is always fields[0]
// whatever the count. createDistanceField binds that texture once and forever.
const MIN_PAIRS = 1;
const MAX_PAIRS = 16;

// A uniform seed cannot pattern — filling the domain with V drives U to zero
// everywhere at once, and V then decays at (F+K) with nothing spatial left to
// restart it. Per-texel noise cannot either: one texel of V diffuses away
// faster than it reacts. So the seed is quantised into patches the reaction can
// hold. Both failures measured against a CPU mirror of this kernel.
const SEED_CELL = 4;
const SEED_COVERAGE = 0.35;
const SEED_U = 0.5;
const SEED_V = 0.25;

export default function createGrayScottField({ height, seeds, width }) {
  const uniforms = {
    feedBias: uniform(0.012),
    feedRate: uniform(0.055),
    // Shared name with the expansive solver so one control drives either.
    fieldContrast: uniform(3),
    // Pixel size of the consumer's own field, so seed positions given in its
    // pixels and sim texels can meet in normalised space.
    fieldSize: uniform(new THREE.Vector2(1, 1)),
    injectStrength: uniform(0),
    injectX: uniform(0.5),
    injectY: uniform(0.5),
    killRate: uniform(0.062),
    // One radius serves both the one-shot blob and the per-emitter seeding;
    // they are the same footprint applied from different sources.
    // Pocket radius, as a multiple of the emitter's own radius.
    seedClear: uniform(2.5),
    // 1 on a pulse frame, 0 otherwise. Gates the carve as well as the seed.
    seedPulse: uniform(0),
    seedRadius: uniform(0.05),
    seedSalt: uniform(0),
    seedStrength: uniform(0),
    // Read on the CPU to size the dispatch loop, not by any node graph.
    stepScale: uniform(14),
  };

  const fields = [
    createFieldTexture(width, height),
    createFieldTexture(width, height),
  ];
  const outputTexture = createFieldTexture(width, height);

  const cellsX = Math.ceil(width / SEED_CELL);
  const cellCount = cellsX * Math.ceil(height / SEED_CELL);

  const coordOf = () =>
    ivec2(int(instanceIndex.mod(width)), int(instanceIndex.div(width)));
  const clamped = (c) =>
    ivec2(c.x.clamp(0, width - 1), c.y.clamp(0, height - 1));

  function reactPass(from, to, seeding) {
    const read = readOnly(fields[from]);
    const write = writeOnly(fields[to]);

    return Fn(() => {
      const coord = coordOf();
      const current = read.load(coord).xy.toVar();

      const laplacian = vec2(0).toVar();
      LAPLACIAN.forEach(([dx, dy, weight]) => {
        laplacian.addAssign(
          read.load(clamped(coord.add(ivec2(dx, dy)))).xy.mul(weight)
        );
      });
      laplacian.subAssign(current);

      // The x ramp is the reference's, and it is what puts several Gray-Scott
      // regimes in one frame instead of one uniform pattern everywhere.
      const uv = vec2(coord).add(0.5).div(vec2(width, height));
      const feed = uniforms.feedRate.add(
        uv.x.mul(2).sub(1).mul(uniforms.feedBias)
      );

      const uvv = current.x.mul(current.y).mul(current.y);
      const reaction = vec2(
        uvv.negate().add(feed.mul(float(1).sub(current.x))),
        uvv.sub(feed.add(uniforms.killRate).mul(current.y))
      );
      const diffusion = vec2(laplacian.x, laplacian.y.mul(0.5));

      const next = current
        .add(diffusion.add(reaction).mul(DT))
        .clamp(0, 1)
        .toVar();

      if (seeding) {
        const blob = float(1)
          .sub(
            uv
              .sub(vec2(uniforms.injectX, uniforms.injectY))
              .length()
              .div(uniforms.seedRadius.max(1e-4))
          )
          .clamp(0, 1);

        next.y.addAssign(blob.mul(uniforms.injectStrength));

        // Optional per-emitter seeding: a consumer can hand in its own light
        // list and have the pattern grow from wherever it has been lit.
        if (seeds) {
          Loop({ end: seeds.count, start: 0, type: 'int' }, ({ i }) => {
            const light = seeds.data.element(i);

            If(light.w.greaterThan(0), () => {
              const at = light.xy.div(uniforms.fieldSize);
              const d = uv.sub(at).length();

              // A pocket the pattern cannot enter, sized off the light's own
              // radius. Seeding AT the light meant every emitter buried itself
              // in the thing it was growing, within about a second. The light
              // has to stay outside what it seeds or there is nothing to see.
              const pocket = light.z
                .div(uniforms.fieldSize.y)
                .mul(uniforms.seedClear)
                .max(1e-4);

              // Carved only on a seed pulse, not every frame. Carving
              // continuously meant each light bulldozed a room around itself
              // wherever it went, so it was permanently in a clearing of its
              // own making and never simply out in the field. Between pulses
              // the pattern is left alone and the swarm moves through whatever
              // is there.
              next.y.mulAssign(
                mix(
                  float(1),
                  smoothstep(pocket, pocket.mul(1.35), d),
                  uniforms.seedPulse
                )
              );

              // The seed itself goes in the ring just beyond the pocket, so
              // growth starts at arm's length and spreads outward from there.
              const band = uniforms.seedRadius.max(pocket.mul(1.4));
              const ring = smoothstep(pocket, pocket.add(band).mul(0.5), d).mul(
                smoothstep(band, band.mul(0.6), d)
              );

              next.y.addAssign(ring.mul(uniforms.seedStrength));
            });
          });
        }
      }

      textureStore(write, coord, vec4(next.clamp(0, 1), 0, 1));
    })().compute(width * height);
  }

  // Matches the expansive solver's output contract so the same consumer can
  // read either: .r drives height and culling, .g is a colour coordinate.
  // Gray-Scott has no advected colour channel of its own, so U stands in — it
  // anti-correlates with V and varies smoothly across the pattern.
  function shapePass() {
    const read = readOnly(fields[0]);
    const write = writeOnly(outputTexture);

    return Fn(() => {
      const coord = coordOf();
      const field = read.load(coord).xy;
      const shaped = field.y.mul(uniforms.fieldContrast).clamp(0, 1);

      textureStore(write, coord, vec4(shaped, field.x, 0, 1));
    })().compute(width * height);
  }

  function resetPass(index) {
    const write = writeOnly(fields[index]);

    return Fn(() => {
      const coord = coordOf();
      const uv = vec2(coord).add(0.5).div(vec2(width, height));
      const inSeed = uv
        .sub(vec2(uniforms.injectX, uniforms.injectY))
        .length()
        .lessThan(uniforms.seedRadius);
      const cell = coord.x
        .div(int(SEED_CELL))
        .add(coord.y.div(int(SEED_CELL)).mul(int(cellsX)));
      const lit = inSeed.and(
        hash(float(cell).add(uniforms.seedSalt)).lessThan(SEED_COVERAGE)
      );

      textureStore(
        write,
        coord,
        vec4(
          select(lit, float(SEED_U), float(1)),
          select(lit, float(SEED_V), float(0)),
          0,
          1
        )
      );
    })().compute(width * height);
  }

  const resetPasses = [resetPass(0), resetPass(1)];
  const seedingPass = reactPass(0, 1, true);
  const forwardPass = reactPass(0, 1, false);
  const returnPass = reactPass(1, 0, false);
  const shape = shapePass();

  let seeded = false;

  function reset(renderer, { centerX = 0.5, centerY = 0.5, radius } = {}) {
    uniforms.injectX.value = centerX;
    uniforms.injectY.value = centerY;
    if (radius !== undefined) uniforms.seedRadius.value = radius;
    // Offset by a whole field of cells, so a reseed lands on an uncorrelated
    // stretch of the hash rather than translating the same pattern.
    uniforms.seedSalt.value = Math.floor(Math.random() * 512) * cellCount;
    resetPasses.forEach((pass) => renderer.compute(pass));
    seeded = true;
  }

  function update(renderer) {
    // A consumer that only ever seeds from its own emitters never calls
    // reseed, and would otherwise run against an uninitialised field forever.
    if (!seeded) reset(renderer);

    const pairs = Math.min(
      MAX_PAIRS,
      Math.max(MIN_PAIRS, Math.round(uniforms.stepScale.value / 2))
    );

    for (let i = 0; i < pairs; i += 1) {
      renderer.compute(i === 0 ? seedingPass : forwardPass);
      renderer.compute(returnPass);
    }

    renderer.compute(shape);
    uniforms.injectStrength.value = 0;
  }

  return {
    dispose: () =>
      [...fields, outputTexture].forEach((texture) => texture.dispose()),
    fieldTexture: fields[0],
    // One-shot blob, consumed by the next update. Same call shape as the
    // expansive solver's, which is what lets a scene swap between them.
    inject: (
      renderer,
      { centerX = 0.5, centerY = 0.5, radius, strength = 1 } = {}
    ) => {
      uniforms.injectX.value = centerX;
      uniforms.injectY.value = centerY;
      if (radius !== undefined) uniforms.seedRadius.value = radius;
      uniforms.injectStrength.value = strength;
    },
    outputTexture,
    reseed: reset,
    uniforms,
    update,
  };
}
