import {
  Fn,
  If,
  Return,
  float,
  instanceIndex,
  int,
  ivec3,
  uint,
} from 'three/tsl';

import { FLUID, SOLID } from './flipGrid';

const NEIGHBOURS = [
  [-1, 0, 0],
  [1, 0, 0],
  [0, -1, 0],
  [0, 1, 0],
  [0, 0, -1],
  [0, 0, 1],
];

export function createForces(ctx) {
  const { buffers, grid, uniforms } = ctx;

  return Fn(() => {
    If(instanceIndex.greaterThanEqual(uint(grid.velCount)), () => {
      Return();
    });
    const node = buffers.gridVel.element(instanceIndex);
    node.y.addAssign(uniforms.gravity.negate().mul(uniforms.dt));
  })().compute(grid.velCount);
}

// Free-slip walls, plus no flow through any face that touches a solid cell.
// Running this both before the divergence and after the projection is what
// keeps the obstacles watertight.
export function createBoundary(ctx) {
  const { buffers, grid } = ctx;
  const { n } = ctx;

  return Fn(() => {
    If(instanceIndex.greaterThanEqual(uint(grid.velCount)), () => {
      Return();
    });

    const c = grid.velCoord(instanceIndex).toConst('c');
    const node = buffers.gridVel.element(instanceIndex);
    const markerAt = (offset) =>
      buffers.marker.element(grid.cellIndex(c.add(ivec3(...offset))));

    const solidBehindX = markerAt([-1, 0, 0]).equal(int(SOLID));
    const solidHereX = markerAt([0, 0, 0]).equal(int(SOLID));
    If(
      c.x
        .lessThanEqual(0)
        .or(c.x.greaterThanEqual(n))
        .or(solidBehindX)
        .or(solidHereX),
      () => {
        node.x.assign(0);
      }
    );

    const solidBelowY = markerAt([0, -1, 0]).equal(int(SOLID));
    If(c.y.lessThanEqual(0).or(solidBelowY).or(solidHereX), () => {
      node.y.assign(0);
    });
    // The lid lets fluid fall out but never pushes it back in.
    If(c.y.greaterThanEqual(n), () => {
      node.y.assign(node.y.min(0));
    });

    const solidBehindZ = markerAt([0, 0, -1]).equal(int(SOLID));
    If(
      c.z.lessThanEqual(0).or(c.z.greaterThanEqual(n)).or(solidBehindZ),
      () => {
        node.z.assign(0);
      }
    );
  })().compute(grid.velCount);
}

export function createDivergence(ctx) {
  const { buffers, grid, uniforms } = ctx;

  return Fn(() => {
    If(instanceIndex.greaterThanEqual(uint(grid.cellCount)), () => {
      Return();
    });

    const marker = buffers.marker.element(instanceIndex);
    If(marker.notEqual(int(FLUID)), () => {
      buffers.divergence.element(instanceIndex).assign(0);
      Return();
    });

    const c = grid.cellCoord(instanceIndex).toConst('c');
    const at = (offset) =>
      buffers.gridVel.element(grid.velIndex(c.add(ivec3(...offset))));

    const here = at([0, 0, 0]);
    const value = at([1, 0, 0])
      .x.sub(here.x)
      .add(at([0, 1, 0]).y.sub(here.y))
      .add(at([0, 0, 1]).z.sub(here.z))
      .toVar('divergence');

    // Density correction: cells holding more than the target particle count
    // get artificial outflow, which is what stops particles piling into a
    // clump the projection alone would happily keep compressed.
    value.subAssign(
      here.w.sub(uniforms.targetDensity).mul(uniforms.densityCorrection).max(0)
    );

    buffers.divergence.element(instanceIndex).assign(value);
  })().compute(grid.cellCount);
}

// Red-black Gauss-Seidel rather than plain Jacobi: alternating parity lets each
// sweep read its neighbours' freshly written values, converging about twice as
// fast for the same dispatch count.
export function createPressureSweep(ctx, parity) {
  const { buffers, grid } = ctx;

  return Fn(() => {
    If(instanceIndex.greaterThanEqual(uint(grid.cellCount)), () => {
      Return();
    });

    const c = grid.cellCoord(instanceIndex).toConst('c');
    If(c.x.add(c.y).add(c.z).mod(2).notEqual(int(parity)), () => {
      Return();
    });
    If(buffers.marker.element(instanceIndex).notEqual(int(FLUID)), () => {
      Return();
    });

    const sum = float(0).toVar('sum');
    const diagonal = float(0).toVar('diagonal');

    NEIGHBOURS.forEach((offset) => {
      const at = c.add(ivec3(...offset));
      const index = grid.cellIndex(at);
      const kind = buffers.marker.element(index);
      const outside = grid.inCells(at).not();

      // A solid neighbour drops out of the stencil entirely (Neumann); an air
      // neighbour stays in it at zero pressure (Dirichlet, the free surface).
      If(kind.notEqual(int(SOLID)).and(outside.not()), () => {
        diagonal.addAssign(1);
        If(kind.equal(int(FLUID)), () => {
          sum.addAssign(buffers.pressure.element(index));
        });
      });
    });

    const divergence = buffers.divergence.element(instanceIndex);
    buffers.pressure
      .element(instanceIndex)
      .assign(
        diagonal
          .greaterThan(0)
          .select(sum.sub(divergence).div(diagonal), float(0))
      );
  })().compute(grid.cellCount);
}

export function createProjection(ctx) {
  const { buffers, grid } = ctx;

  return Fn(() => {
    If(instanceIndex.greaterThanEqual(uint(grid.velCount)), () => {
      Return();
    });

    const c = grid.velCoord(instanceIndex).toConst('c');
    const node = buffers.gridVel.element(instanceIndex);
    const pressureAt = (offset) =>
      buffers.pressure.element(grid.cellIndex(c.add(ivec3(...offset))));

    const here = pressureAt([0, 0, 0]);
    node.x.subAssign(here.sub(pressureAt([-1, 0, 0])));
    node.y.subAssign(here.sub(pressureAt([0, -1, 0])));
    node.z.subAssign(here.sub(pressureAt([0, 0, -1])));
  })().compute(grid.velCount);
}
