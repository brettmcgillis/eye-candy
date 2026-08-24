import {
  Fn,
  If,
  deltaTime,
  float,
  hash,
  instanceIndex,
  instancedArray,
  mix,
  select,
  uint,
  uniform,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';

export const STATE_FALLING = 0;
export const STATE_CLINGING = 1;
export const STATE_DETACHED = 2;

export default function createRainSimulation({ capacity, probe }) {
  const uniforms = {
    bounds: uniform(140),
    ceiling: uniform(60),
    spawnRange: uniform(40),
    fallSpeed: uniform(26),
    speedJitter: uniform(0.4),
    windX: uniform(0.8),
    windZ: uniform(0),
    catchDepth: uniform(3),
    surfaceLifeMin: uniform(0.6),
    surfaceLifeMax: uniform(2.5),
    slideGravity: uniform(18),
    slideDrag: uniform(2),
    slopeRelease: uniform(1.1),
    airDrag: uniform(1.1),
    gravity: uniform(20),
    sinkDepth: uniform(26),
    timeScale: uniform(1),
  };

  const positionBuffer = instancedArray(capacity, 'vec4');
  const motionBuffer = instancedArray(capacity, 'vec4');
  const anchorBuffer = instancedArray(capacity, 'vec4');

  const randomAt = (cycle, salt) =>
    hash(
      instanceIndex
        .mul(uint(64))
        .add(uint(cycle).mul(uint(8)))
        .add(uint(salt))
    );

  const spawnPosition = (cycle) =>
    vec3(
      randomAt(cycle, 1).sub(0.5).mul(uniforms.bounds),
      uniforms.ceiling.add(randomAt(cycle, 2).mul(uniforms.spawnRange)),
      randomAt(cycle, 3).sub(0.5).mul(uniforms.bounds)
    );

  const init = Fn(() => {
    const cycle = hash(instanceIndex).mul(4096).floor();
    const column = spawnPosition(cycle).toVar();

    // Stagger the first fall across the whole column so the scene doesn't open
    // on a single sheet of drops arriving at once.
    column.y.assign(
      randomAt(cycle, 8)
        .mul(uniforms.ceiling.add(uniforms.spawnRange))
        .sub(uniforms.ceiling.mul(0.15))
    );

    positionBuffer.element(instanceIndex).assign(vec4(column, STATE_FALLING));
    motionBuffer.element(instanceIndex).assign(vec4(0, 0, 0, 0));
    anchorBuffer
      .element(instanceIndex)
      .assign(vec4(0, 0, randomAt(cycle, 4), cycle));
  })().compute(capacity);

  const update = Fn(() => {
    const positionSlot = positionBuffer.element(instanceIndex);
    const motionSlot = motionBuffer.element(instanceIndex);
    const anchorSlot = anchorBuffer.element(instanceIndex);

    const position = positionSlot.xyz.toVar();
    const state = positionSlot.w.toVar();
    const velocity = motionSlot.xyz.toVar();
    const timer = motionSlot.w.toVar();
    const anchor = anchorSlot.xy.toVar();
    const seed = anchorSlot.z.toVar();
    const cycle = anchorSlot.w.toVar();

    // The integration is time-symmetric, so a negative rate replays the whole
    // lifecycle backwards — drops rise out of the dark, gather on the surface
    // and lift off it. Only the state transitions and the exit each drop leaves
    // by have to be mirrored; the damping terms deliberately use the unsigned
    // rate, because reversed drag amplifies instead of decaying and blows up.
    const rate = uniforms.timeScale.toVar();
    const flow = deltaTime.mul(rate.abs()).min(0.05).toVar();
    const step = flow.mul(rate.sign()).toVar();
    const reversed = rate.lessThan(0);

    // Whichever end of the volume a drop leaves by, it re-enters at the other
    // one in the state that end feeds: the top spawns fresh rain, the floor
    // spawns a drop already on its way back up.
    const recycle = () => {
      const column = spawnPosition(cycle.add(1)).toVar();

      timer.assign(0);
      cycle.addAssign(1);
      seed.assign(randomAt(cycle, 4));

      If(reversed, () => {
        state.assign(STATE_DETACHED);
        column.y.assign(uniforms.sinkDepth.negate());
        velocity.assign(vec3(0, uniforms.fallSpeed.negate(), 0));
      }).Else(() => {
        state.assign(STATE_FALLING);
      });

      position.assign(column);
    };
    // Landing is the same in both directions apart from where the cling timer
    // starts: forward it counts up from zero, reversed it counts back down.
    const attach = (surface, startTimer) => {
      state.assign(STATE_CLINGING);
      timer.assign(startTimer);
      velocity.assign(vec3(0, 0, 0));
      // One Newton step back to the anchor whose surface point sits under the
      // drop, so a horizontally displaced surface doesn't yank it sideways on
      // contact.
      anchor.assign(position.xz.mul(2).sub(surface.xz));
      position.assign(probe.sample(anchor).xyz);
    };
    const escaped = () =>
      select(
        reversed,
        position.y.greaterThan(uniforms.ceiling.add(uniforms.spawnRange)),
        position.y.lessThan(uniforms.sinkDepth.negate())
      );

    If(state.lessThan(0.5), () => {
      velocity.assign(
        vec3(
          uniforms.windX,
          uniforms.fallSpeed
            .mul(mix(uniforms.speedJitter.oneMinus(), 1, seed))
            .negate(),
          uniforms.windZ
        )
      );
      position.addAssign(velocity.mul(step));

      const surface = probe.sample(position.xz).toVar();
      // A slow frame can carry a drop further than catchDepth in one step, so
      // the catch window never shrinks below the distance actually travelled.
      const reach = uniforms.catchDepth.max(
        velocity.y.abs().mul(flow).mul(1.5)
      );

      // Running backwards this state is a drop leaving the surface for the
      // ceiling, so it must not re-catch on the way out.
      If(
        rate
          .greaterThan(0)
          .and(surface.w.greaterThan(0.5))
          .and(position.y.lessThan(surface.y))
          .and(position.y.greaterThan(surface.y.sub(reach))),
        () => {
          attach(surface, float(0));
        }
      ).ElseIf(escaped(), recycle);
    })
      .ElseIf(state.lessThan(1.5), () => {
        timer.addAssign(step);

        const gradient = probe.slope(anchor).toVar();
        const slide = velocity.xz
          .sub(gradient.mul(uniforms.slideGravity.mul(step)))
          .mul(uniforms.slideDrag.mul(flow).negate().exp())
          .toVar();

        anchor.addAssign(slide.mul(step));

        const surface = probe.sample(anchor).toVar();
        position.assign(surface.xyz);

        // The vertical term is what makes a clinging drop read as geometry: its
        // streak tips with the slope it is crossing instead of lying flat.
        velocity.assign(vec3(slide.x, gradient.dot(slide), slide.y));

        const lifetime = mix(
          uniforms.surfaceLifeMin,
          uniforms.surfaceLifeMax,
          seed
        );

        // Forward the timer counts up to the cling lifetime; reversed it was
        // seeded at the lifetime and counts back down to zero.
        If(
          surface.w
            .lessThan(0.5)
            .or(gradient.length().greaterThan(uniforms.slopeRelease))
            .or(
              select(reversed, timer.lessThan(0), timer.greaterThan(lifetime))
            ),
          () => {
            state.assign(
              select(reversed, float(STATE_FALLING), float(STATE_DETACHED))
            );
            timer.assign(0);
          }
        );
      })
      .Else(() => {
        timer.addAssign(step);

        const settle = uniforms.airDrag.mul(flow).negate().exp();
        const drift = mix(
          vec2(uniforms.windX, uniforms.windZ),
          velocity.xz,
          settle
        );

        velocity.assign(
          vec3(
            drift.x,
            velocity.y
              .sub(uniforms.gravity.mul(flow))
              .max(uniforms.fallSpeed.negate()),
            drift.y
          )
        );
        position.addAssign(velocity.mul(step));

        // Reversed, this state carries the drop up out of the dark and lands it
        // back on the surface from below — the mirror of falling off it.
        const surface = probe.sample(position.xz).toVar();
        const reach = uniforms.catchDepth.max(
          velocity.y.abs().mul(flow).mul(1.5)
        );

        If(
          reversed
            .and(surface.w.greaterThan(0.5))
            .and(position.y.greaterThan(surface.y))
            .and(position.y.lessThan(surface.y.add(reach))),
          () => {
            attach(
              surface,
              mix(uniforms.surfaceLifeMin, uniforms.surfaceLifeMax, seed)
            );
          }
        ).ElseIf(escaped(), recycle);
      });

    positionSlot.assign(vec4(position, state));
    motionSlot.assign(vec4(velocity, timer));
    anchorSlot.assign(vec4(anchor, seed, cycle));
  })().compute(capacity);

  return {
    anchorBuffer,
    init,
    motionBuffer,
    positionBuffer,
    uniforms,
    update,
  };
}
