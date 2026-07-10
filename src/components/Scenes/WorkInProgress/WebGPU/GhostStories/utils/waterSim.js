/* eslint-disable camelcase */
import {
  Fn,
  clamp,
  cos,
  float,
  instanceIndex,
  instancedArray,
  int,
  length,
  max,
  min,
  select,
  uint,
  uniform,
  vec2,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

// The ghost-ripple field, ported from three.js `webgpu_compute_water`: a
// ping-pong pair of vec2 buffers (x = height, y = previous height) stepped
// by a neighbor-average wave pass with viscosity, disturbed by the ghost.
// The field is a 40m patch at ~0.31m cells — the source example's texel
// density — that follows the ghost; re-anchoring runs a shift pass that
// copies the field displaced by whole cells, so ripples stay pinned to the
// world instead of resetting.
//
// The field is mesh-agnostic: water chunk materials sample it by world
// position (see waterMaterial.js), so ripples appear on whatever pond the
// ghost is stirring.
export const WIDTH = 128;
export const BOUNDS = 40;
export const CELL = BOUNDS / WIDTH;

export default function createWaterSim(initial) {
  const cellCount = WIDTH * WIDTH;
  const stateStorageA = instancedArray(
    new Float32Array(cellCount * 2),
    'vec2'
  ).setName('GhostWaterA');
  const stateStorageB = instancedArray(
    new Float32Array(cellCount * 2),
    'vec2'
  ).setName('GhostWaterB');

  const uniforms = {
    ambientAmp: uniform(initial.waterWaveAmp),
    // Patch center in world XZ.
    anchor: uniform(new THREE.Vector2(0, 0)),
    deepColor: uniform(new THREE.Color(initial.waterColor)),
    disturbDeep: uniform(initial.waterDisturbDepth),
    disturbPos: uniform(new THREE.Vector2(1e5, 1e5)),
    disturbSize: uniform(initial.waterDisturbSize),
    disturbSpeed: uniform(new THREE.Vector2(0, 0)),
    opacity: uniform(initial.waterOpacity),
    readFromA: uniform(1),
    shift: uniform(new THREE.Vector2(0, 0)),
    skyColor: uniform(new THREE.Color(initial.waterSkyColor)),
    viscosity: uniform(initial.waterViscosity),
  };

  const cellXY = (index) => ({
    x: int(index.mod(WIDTH)),
    y: int(index.div(WIDTH)),
  });

  const neighborIndices = (index) => {
    const width = uint(WIDTH);
    const { x, y } = cellXY(index);
    const leftX = max(0, x.sub(1));
    const rightX = min(x.add(1), width.sub(1));
    const bottomY = max(0, y.sub(1));
    const topY = min(y.add(1), width.sub(1));
    return {
      eastIndex: y.mul(width).add(rightX),
      northIndex: topY.mul(width).add(x),
      southIndex: bottomY.mul(width).add(x),
      westIndex: y.mul(width).add(leftX),
    };
  };

  const createStep = (readBuffer, writeBuffer) =>
    Fn(() => {
      const state = readBuffer.element(instanceIndex).toVar();
      const { eastIndex, northIndex, southIndex, westIndex } =
        neighborIndices(instanceIndex);

      const neighborSum = readBuffer
        .element(northIndex)
        .x.add(readBuffer.element(southIndex).x)
        .add(readBuffer.element(eastIndex).x)
        .add(readBuffer.element(westIndex).x);

      const newHeight = neighborSum
        .mul(0.5)
        .sub(state.y)
        .mul(uniforms.viscosity)
        .toVar();

      // Cell position in patch space [-BOUNDS/2, BOUNDS/2].
      const { x, y } = cellXY(instanceIndex);
      const px = float(x)
        .mul(CELL)
        .sub(BOUNDS / 2);
      const py = float(y)
        .mul(CELL)
        .sub(BOUNDS / 2);

      // Ghost influence: press the surface around the disturbance point,
      // scaled by how fast the ghost is moving.
      const phase = clamp(
        length(vec2(px, py).sub(uniforms.disturbPos))
          .mul(Math.PI)
          .div(uniforms.disturbSize),
        0.0,
        Math.PI
      );
      newHeight.addAssign(
        cos(phase)
          .add(1.0)
          .mul(uniforms.disturbDeep)
          .mul(uniforms.disturbSpeed.length().min(1))
      );

      writeBuffer.element(instanceIndex).assign(vec2(newHeight, state.x));
    })().compute(cellCount, [16, 16]);

  // Re-anchor: copy the field displaced by a whole-cell offset. Cells that
  // shift in from outside the old patch start calm.
  const createShift = (readBuffer, writeBuffer) =>
    Fn(() => {
      const width = int(WIDTH);
      const { x, y } = cellXY(instanceIndex);
      const sx = x.add(int(uniforms.shift.x));
      const sy = y.add(int(uniforms.shift.y));
      const inBounds = sx
        .greaterThanEqual(0)
        .and(sx.lessThan(width))
        .and(sy.greaterThanEqual(0))
        .and(sy.lessThan(width));
      const clampedX = clamp(sx, 0, width.sub(1));
      const clampedY = clamp(sy, 0, width.sub(1));
      const sourceIndex = uint(clampedY.mul(width).add(clampedX));
      writeBuffer
        .element(instanceIndex)
        .assign(select(inBounds, readBuffer.element(sourceIndex), vec2(0, 0)));
    })().compute(cellCount, [16, 16]);

  return {
    shiftAtoB: createShift(stateStorageA, stateStorageB),
    shiftBtoA: createShift(stateStorageB, stateStorageA),
    stateStorageA,
    stateStorageB,
    stepAtoB: createStep(stateStorageA, stateStorageB),
    stepBtoA: createStep(stateStorageB, stateStorageA),
    uniforms,
  };
}
