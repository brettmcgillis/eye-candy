import {
  Fn,
  If,
  atomicLoad,
  atomicMax,
  atomicStore,
  float,
  instanceIndex,
  int,
  ivec2,
  textureStore,
  vec2,
  vec4,
} from 'three/tsl';

import { writeOnly } from '@utils/storageField';

import { FIXED } from './walkers';

// The page lives in the atomic grid and is only ever copied out to a texture
// for reading. Nothing binds the texture for reading and writing at once, which
// WebGPU forbids, and nothing can lose a mark to a concurrent write.
export default function createPageKernels({
  deposit,
  gridHeight,
  gridWidth,
  ink,
  uniforms,
}) {
  const cells = gridWidth * gridHeight;
  const write = writeOnly(ink);
  const coordOf = () =>
    ivec2(int(instanceIndex.mod(gridWidth)), int(instanceIndex.div(gridWidth)));

  const wipe = Fn(() => {
    const cell = deposit.element(instanceIndex);
    atomicStore(cell.get('ink'), int(0));
    atomicStore(cell.get('tint'), int(0));
  })().compute(cells);

  // Drawn into the page rather than enforced as a bounds check, so the frame
  // shows up in the picture and the walkers turn away from it like anything
  // else they meet.
  const frame = Fn(() => {
    const coord = coordOf();
    const point = vec2(coord).add(0.5);
    const half = vec2(gridWidth, gridHeight).mul(0.5);
    const inset = uniforms.borderMargin.mul(gridHeight).toVar();

    const corner = point.sub(half).abs().sub(half.sub(inset)).toVar();
    const toEdge = uniforms.border
      .lessThan(1.5)
      .select(
        corner.x.max(corner.y).abs(),
        point.sub(half).length().sub(half.y.sub(inset)).abs()
      );

    If(
      uniforms.border
        .greaterThan(0.5)
        .and(toEdge.lessThan(uniforms.borderWidth)),
      () => {
        const cell = deposit.element(instanceIndex);
        atomicMax(cell.get('ink'), int(FIXED));
        atomicMax(cell.get('tint'), int(1));
      }
    );
  })().compute(cells);

  const resolve = Fn(() => {
    const cell = deposit.element(instanceIndex);
    const laid = float(atomicLoad(cell.get('ink')))
      .div(FIXED)
      .toVar();
    const tint = float(atomicLoad(cell.get('tint')).sub(1).max(0))
      .div(FIXED)
      .toVar();

    textureStore(write, coordOf(), vec4(laid.clamp(0, 1), tint, 0, 1));
  })().compute(cells);

  const clearTexture = Fn(() => {
    textureStore(write, coordOf(), vec4(0, 0, 0, 1));
  })().compute(cells);

  return { clearTexture, frame, resolve, wipe };
}
