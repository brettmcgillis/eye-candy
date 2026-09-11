import {
  Fn,
  If,
  Loop,
  Return,
  atomicAdd,
  float,
  hash,
  instanceIndex,
  int,
  ivec3,
  mix,
  uint,
  vec3,
  vec4,
} from 'three/tsl';

import { FLUID, SOLID, tent } from './flipGrid';
import sampleVelocity from './flipSampling';

const SCALE = 10000;

export function createClearPasses(ctx) {
  const { buffers, grid } = ctx;

  const setAtomic = (value) => {
    ['x', 'y', 'z', 'w'].forEach((key) => {
      buffers.velAccum.setAtomic(key, value);
      buffers.weightAccum.setAtomic(key, value);
    });
  };

  const clearVelocity = Fn(() => {
    setAtomic(false);
    If(instanceIndex.greaterThanEqual(uint(grid.velCount)), () => {
      Return();
    });
    ['x', 'y', 'z', 'w'].forEach((key) => {
      buffers.velAccum.element(instanceIndex).get(key).assign(0);
      buffers.weightAccum.element(instanceIndex).get(key).assign(0);
    });
    buffers.gridVel.element(instanceIndex).assign(0);
    buffers.gridVelOrig.element(instanceIndex).assign(0);
  })().compute(grid.velCount);

  // Solid marking happens here rather than in its own pass: the cell clear has
  // to write SOLID instead of AIR, or a particle pass could mark a solid cell
  // as fluid before anything re-marked it.
  const clearCells = Fn(() => {
    If(instanceIndex.greaterThanEqual(uint(grid.cellCount)), () => {
      Return();
    });
    const marker = int(0).toVar('marker');
    if (ctx.hooks.solid) {
      const centre = vec3(grid.cellCoord(instanceIndex)).add(0.5);
      const hit = ctx.hooks.solid(centre);
      marker.assign(hit.w.greaterThan(-0.5).select(int(SOLID), int(0)));
    }
    buffers.marker.element(instanceIndex).assign(marker);
    buffers.pressure.element(instanceIndex).assign(0);
    buffers.divergence.element(instanceIndex).assign(0);
  })().compute(grid.cellCount);

  return { clearCells, clearVelocity, setAtomic };
}

export function createParticleToGrid(ctx, setAtomic) {
  const { buffers, grid, uniforms } = ctx;

  const transfer = Fn(() => {
    setAtomic(true);
    If(instanceIndex.greaterThanEqual(uniforms.particleCount), () => {
      Return();
    });

    const position = buffers.positions.element(instanceIndex).xyz.toConst('p');
    const velocity = buffers.velocities.element(instanceIndex).xyz.toConst('v');
    const base = ivec3(position.floor()).toConst('base');

    Loop({ start: 0, end: 2, type: 'int', name: 'dx' }, ({ dx }) => {
      Loop({ start: 0, end: 2, type: 'int', name: 'dy' }, ({ dy }) => {
        Loop({ start: 0, end: 2, type: 'int', name: 'dz' }, ({ dz }) => {
          const node = base.add(ivec3(dx, dy, dz)).toConst('node');
          const at = vec3(node).toConst('at');
          const index = grid.velIndex(node);

          // Each component's sample point sits on its own face, so each gets
          // its own weight against the same particle.
          const wx = tent(position.sub(at.add(vec3(0, 0.5, 0.5))));
          const wy = tent(position.sub(at.add(vec3(0.5, 0, 0.5))));
          const wz = tent(position.sub(at.add(vec3(0.5, 0.5, 0))));
          const ws = tent(position.sub(at.add(0.5)));

          const weightCell = buffers.weightAccum.element(index);
          atomicAdd(weightCell.get('x'), int(wx.mul(SCALE)));
          atomicAdd(weightCell.get('y'), int(wy.mul(SCALE)));
          atomicAdd(weightCell.get('z'), int(wz.mul(SCALE)));
          atomicAdd(weightCell.get('w'), int(ws.mul(SCALE)));

          const velCell = buffers.velAccum.element(index);
          atomicAdd(velCell.get('x'), int(velocity.x.mul(wx).mul(SCALE)));
          atomicAdd(velCell.get('y'), int(velocity.y.mul(wy).mul(SCALE)));
          atomicAdd(velCell.get('z'), int(velocity.z.mul(wz).mul(SCALE)));
        });
      });
    });
  })().compute(1);

  const markFluid = Fn(() => {
    If(instanceIndex.greaterThanEqual(uniforms.particleCount), () => {
      Return();
    });
    const position = buffers.positions.element(instanceIndex).xyz;
    const cell = buffers.marker.element(
      grid.cellIndex(ivec3(position.floor()))
    );
    If(cell.notEqual(int(SOLID)), () => {
      cell.assign(int(FLUID));
    });
  })().compute(1);

  const normalise = Fn(() => {
    setAtomic(false);
    If(instanceIndex.greaterThanEqual(uint(grid.velCount)), () => {
      Return();
    });

    const weight = buffers.weightAccum.element(instanceIndex);
    const accum = buffers.velAccum.element(instanceIndex);
    const decode = (v) => float(v).div(SCALE);
    const over = (sum, w) => w.greaterThan(0).select(sum.div(w), float(0));

    const wx = decode(weight.get('x'));
    const wy = decode(weight.get('y'));
    const wz = decode(weight.get('z'));
    const value = vec4(
      over(decode(accum.get('x')), wx),
      over(decode(accum.get('y')), wy),
      over(decode(accum.get('z')), wz),
      decode(weight.get('w'))
    );

    buffers.gridVel.element(instanceIndex).assign(value);
    // The FLIP delta needs the field as it stood before forces and projection.
    buffers.gridVelOrig.element(instanceIndex).assign(value);
  })().compute(grid.velCount);

  return { markFluid, normalise, transfer };
}

export function createGridToParticle(ctx) {
  const { buffers, grid, uniforms } = ctx;

  const gather = Fn(() => {
    If(instanceIndex.greaterThanEqual(uniforms.particleCount), () => {
      Return();
    });

    const position = buffers.positions.element(instanceIndex).xyz.toConst('p');
    const previous = buffers.velocities
      .element(instanceIndex)
      .xyz.toConst('v0');

    const after = sampleVelocity(grid, buffers.gridVel, position).toConst(
      'vNew'
    );
    const before = sampleVelocity(grid, buffers.gridVelOrig, position).toConst(
      'vOld'
    );

    // PIC takes the grid velocity outright and is stable but damped; FLIP adds
    // only what the grid changed and keeps the motion alive. The blend is the
    // single knob between smooth and turbulent.
    const flip = previous.add(after.sub(before));
    buffers.velocities
      .element(instanceIndex)
      .assign(vec4(mix(after, flip, uniforms.fluidity), 0));
  })().compute(1);

  return gather;
}

export function createAdvect(ctx) {
  const { buffers, grid, uniforms } = ctx;

  return Fn(() => {
    If(instanceIndex.greaterThanEqual(uniforms.particleCount), () => {
      Return();
    });

    const position = buffers.positions
      .element(instanceIndex)
      .xyz.toVar('position');
    const velocity = buffers.velocities
      .element(instanceIndex)
      .xyz.toVar('velocity');

    // RK2: sampling at the midpoint rather than the start keeps particles on
    // curved paths instead of flinging them off corners.
    const v1 = sampleVelocity(grid, buffers.gridVel, position).toConst('v1');
    const mid = position.add(v1.mul(uniforms.dt).mul(0.5)).toConst('mid');
    const v2 = sampleVelocity(grid, buffers.gridVel, mid).toConst('v2');

    const salt = uniforms.phase
      .mul(613.7)
      .add(float(instanceIndex).mul(0.7351))
      .toConst('advectSalt');
    const jitter = vec3(
      hash(salt).sub(0.5),
      hash(salt.add(1.37)).sub(0.5),
      hash(salt.add(2.71)).sub(0.5)
    )
      .normalize()
      .mul(uniforms.turbulence)
      .mul(v1.length())
      .toConst('jitter');

    position.addAssign(v2.add(jitter).mul(uniforms.dt));

    if (ctx.hooks.collide) {
      ctx.hooks.collide({ index: instanceIndex, position, velocity });
    }

    position.assign(position.clamp(vec3(0.01), vec3(ctx.n - 0.01)));

    if (ctx.hooks.recycle) {
      ctx.hooks.recycle({
        dt: uniforms.dt,
        extra: buffers.extra.element(instanceIndex),
        index: instanceIndex,
        phase: uniforms.phase,
        position,
        velocity,
      });
    }

    buffers.positions.element(instanceIndex).assign(vec4(position, 1));
    buffers.velocities.element(instanceIndex).assign(vec4(velocity, 0));
  })().compute(1);
}
