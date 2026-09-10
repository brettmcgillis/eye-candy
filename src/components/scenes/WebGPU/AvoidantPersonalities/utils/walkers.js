/* eslint-disable camelcase */
import {
  Fn,
  If,
  Loop,
  atomicMax,
  float,
  hash,
  instanceIndex,
  instancedArray,
  int,
  ivec2,
  mix,
  mx_noise_float,
  struct,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';

import { readOnly } from '@modules/reactionDiffusion';
import { curlNoise } from '@modules/tsl';

import { clampCoord, outlineSample, toGrid, unitVector } from './spawnShapes';

const QUARTER = Math.PI / 4;

// Eight headings, and a walk that only ever moves along one of them. Turning is
// the whole behaviour: a line prefers to keep going, takes the smallest turn it
// can when the way ahead is taken, and ends only when every direction is taken.
const HEADINGS = 8;

// Forward probes per candidate heading, each also sampled to either side.
// Enough to catch a stroke crossing the intended path at a shallow angle.
const AHEAD_SAMPLES = 4;

export const FIXED = 4096;

export const createInkBuffer = (cellCount) =>
  instancedArray(
    cellCount,
    struct({
      ink: { atomic: true, type: 'int' },
      tint: { atomic: true, type: 'int' },
    })
  );

export default function createWalkers({
  deposit,
  gridHeight,
  gridWidth,
  ink,
  maxCount,
  reactionHeight,
  reactionTexture,
  reactionWidth,
  uniforms,
}) {
  const state = instancedArray(maxCount, 'vec4');
  const memory = instancedArray(maxCount, 'vec4');
  const inkRead = readOnly(ink);
  const reactionRead = readOnly(reactionTexture);
  const gridSize = vec2(gridWidth, gridHeight);

  const inkAt = (at) =>
    inkRead.load(clampCoord(ivec2(at), gridWidth, gridHeight)).r;

  // Where this walker would rather go, if nothing were in the way. The brief's
  // three fields, mixed; the walk then rounds the answer onto a heading.
  const preferred = (at, salt) => {
    const flow = curlNoise(
      vec3(
        at.div(gridSize.y).mul(uniforms.curlScale),
        uniforms.time.mul(uniforms.curlEvolve)
      )
    ).xy.mul(uniforms.curlWeight);

    const rd = ivec2(
      at.div(gridSize).mul(vec2(reactionWidth, reactionHeight))
    ).toVar();
    const sample = (offset) =>
      reactionRead.load(
        clampCoord(rd.add(offset), reactionWidth, reactionHeight)
      ).r;
    const slope = vec2(
      sample(ivec2(1, 0)).sub(sample(ivec2(-1, 0))),
      sample(ivec2(0, 1)).sub(sample(ivec2(0, -1)))
    );
    const along = vec2(slope.y.negate(), slope.x).mul(uniforms.reactionWeight);

    const wander = mx_noise_float(
      vec3(at.div(uniforms.axisCell.max(1)).floor(), salt)
    ).mul(uniforms.axisWander);
    const axis = unitVector(uniforms.axisAngle.add(wander)).mul(
      uniforms.axisWeight
    );

    return flow.add(along).add(axis);
  };

  // Is a step in this heading open? Everything already drawn counts, this
  // walker's own earlier passes included. That is the whole piece: a line that
  // has to keep clear of its own track spirals in on itself, and one that is
  // boxed in turns back alongside where it came from.
  const isClear = (at, heading) => {
    const dir = unitVector(heading.mul(QUARTER)).toVar();
    const side = vec2(dir.y.negate(), dir.x).toVar();
    const gap = uniforms.clearance.toVar();
    const blocked = float(0).toVar();

    Loop({ end: AHEAD_SAMPLES, start: 0, type: 'int' }, ({ i }) => {
      // Probes start beyond the clearance so a walker never trips over the mark
      // it just laid down behind itself.
      const reach = gap
        .add(1)
        .add(uniforms.stepLength.mul(float(i)).div(AHEAD_SAMPLES - 1))
        .toVar();
      const centre = at.add(dir.mul(reach)).toVar();

      blocked.assign(blocked.max(inkAt(centre)));
      blocked.assign(blocked.max(inkAt(centre.add(side.mul(gap)))));
      blocked.assign(blocked.max(inkAt(centre.sub(side.mul(gap)))));
    });

    const landing = at.add(dir.mul(uniforms.stepLength)).toVar();
    const outside = landing.x
      .lessThan(1)
      .or(landing.y.lessThan(1))
      .or(landing.x.greaterThan(gridWidth - 2))
      .or(landing.y.greaterThan(gridHeight - 2));

    return blocked.greaterThan(0.5).or(outside).select(float(0), float(1));
  };

  const spawn = (salt, at, heading, tint) => {
    const index = float(instanceIndex);
    const roll = (offset) => hash(index.mul(offset).add(salt).add(offset));

    const point = vec2(0).toVar();
    const normal = vec2(0).toVar();
    outlineSample(roll(2.17).toVar(), uniforms.shape, point, normal);

    at.assign(toGrid(point, gridSize, uniforms));

    const inward = roll(6.71)
      .lessThan(uniforms.emitInward)
      .select(float(Math.PI), float(0));
    heading.assign(
      normal.y.atan(normal.x).add(inward).div(QUARTER).round().mod(HEADINGS)
    );
    tint.assign(roll(13.7));
  };

  const dormancy = (salt) => hash(salt).mul(uniforms.stagger).add(1).negate();

  const init = Fn(() => {
    const at = vec2(0).toVar();
    const heading = float(0).toVar();
    const tint = float(0).toVar();
    spawn(uniforms.spawnSalt, at, heading, tint);

    state
      .element(instanceIndex)
      .assign(
        vec4(
          at,
          heading,
          dormancy(float(instanceIndex).mul(1.61).add(uniforms.spawnSalt))
        )
      );
    memory.element(instanceIndex).assign(vec4(at, tint, 0));
  })().compute(maxCount);

  const walk = Fn(() => {
    const self = state.element(instanceIndex);
    const mem = memory.element(instanceIndex);

    const at = self.xy.toVar();
    const heading = self.z.toVar();
    const age = self.w.toVar();
    const tint = mem.z.toVar();

    const from = at.toVar();
    const drew = float(0).toVar();

    age.addAssign(1);

    // A line picks its start when it actually begins, not when it was queued,
    // so it can see whatever went down on the page while it waited its turn.
    If(age.equal(0), () => {
      spawn(
        uniforms.spawnSalt.add(tint.mul(97.3)).add(uniforms.time),
        at,
        heading,
        tint
      );
      from.assign(at);
    }).ElseIf(age.greaterThan(0), () => {
      const want = preferred(at, tint.mul(37.1)).toVar();
      const wanted = want.y.atan(want.x).div(QUARTER).toVar();

      const bestScore = float(1e9).toVar();
      const bestHeading = float(-1).toVar();

      // Straight is cheap and a half turn is dear, so a line runs until it is
      // stopped and then makes the smallest turn that gets it past.
      for (let candidate = 0; candidate < HEADINGS; candidate += 1) {
        const option = heading.add(candidate).mod(HEADINGS).toVar();
        const turn = float(Math.min(candidate, HEADINGS - candidate));
        const drift = option
          .sub(wanted)
          .div(HEADINGS)
          .add(0.5)
          .fract()
          .sub(0.5)
          .abs()
          .mul(HEADINGS);
        const score = turn
          .mul(uniforms.turnCost)
          .add(drift.mul(uniforms.flowCost))
          .add(
            hash(tint.add(candidate * 3.1).add(age.mul(0.017))).mul(
              uniforms.wobble
            )
          )
          .toVar();

        If(
          score.lessThan(bestScore).and(isClear(at, option).greaterThan(0.5)),
          () => {
            bestScore.assign(score);
            bestHeading.assign(option);
          }
        );
      }

      If(
        bestHeading.lessThan(0).or(age.greaterThan(uniforms.lifeSteps)),
        () => {
          age.assign(dormancy(tint.add(uniforms.time).add(3.1)));
        }
      ).Else(() => {
        heading.assign(bestHeading);
        at.assign(
          at.add(unitVector(bestHeading.mul(QUARTER)).mul(uniforms.stepLength))
        );
        drew.assign(1);
      });
    });

    self.assign(vec4(at, heading, age));
    mem.assign(vec4(from, tint, drew));
  })().compute(maxCount);

  // Marking is its own pass so the walk above always reads a settled page, and
  // it goes through an atomic grid so two walkers landing on one texel cannot
  // erase each other.
  const mark = Fn(() => {
    const self = state.element(instanceIndex);
    const mem = memory.element(instanceIndex);

    If(mem.w.greaterThan(0.5), () => {
      const from = mem.xy.toVar();
      const to = self.xy.toVar();
      const tint = mem.z.toVar();

      Loop({ end: 9, start: 0, type: 'int' }, ({ i }) => {
        const along = mix(from, to, float(i).div(8)).toVar();
        const base = along.sub(0.5).floor().toVar();

        Loop({ end: 2, name: 'my', start: -1, type: 'int' }, ({ my }) => {
          Loop({ end: 2, name: 'mx', start: -1, type: 'int' }, ({ mx }) => {
            const nib = base.add(vec2(float(mx), float(my))).toVar();
            const weight = uniforms.lineWidth
              .add(0.5)
              .sub(nib.add(0.5).sub(along).length())
              .clamp(0, 1)
              .toVar();

            const inside = nib.x
              .greaterThanEqual(0)
              .and(nib.y.greaterThanEqual(0))
              .and(nib.x.lessThan(gridWidth))
              .and(nib.y.lessThan(gridHeight))
              .and(weight.greaterThan(0.05));

            If(inside, () => {
              const coord = ivec2(nib);
              const cell = deposit.element(
                coord.y.mul(int(gridWidth)).add(coord.x)
              );
              atomicMax(cell.get('ink'), int(weight.mul(FIXED)));
              atomicMax(cell.get('tint'), int(tint.mul(FIXED).add(1)));
            });
          });
        });
      });
    });
  })().compute(maxCount);

  return { init, mark, walk };
}
