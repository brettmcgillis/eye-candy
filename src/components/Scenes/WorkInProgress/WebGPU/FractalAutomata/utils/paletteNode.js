import {
  color,
  instanceIndex,
  mix,
  select,
  sqrt,
  step,
  uint,
  uniform,
} from 'three/tsl';

import { decomposeIndexNode } from './gridIndex';

// "How color gets applied" modes — each derives a 0..1 scalar `t` purely
// from data already resident in stateRevealBuf/instanceIndex (no extra
// storage buffer needed), which then samples a 3-stop gradient.
export const COLOR_MODES = [
  'growthOrder',
  'height',
  'distanceFromCore',
  'state',
];

const COLOR_MODE_TO_INT = COLOR_MODES.reduce((acc, mode, index) => {
  acc[mode] = index;
  return acc;
}, {});

// Builds the InstancedMesh material's colorNode plus the live uniforms
// VoxelField updates each frame from Leva config (palette colors/midpoint/
// mode). `k` is the grid's per-axis cell count (structural, fixed for this
// compute instance). `compactedIndexBuf` maps a drawn instance's
// `instanceIndex` (0..occupiedCount-1) back to its original cellIndex into
// `stateRevealBuf` — see growthCompute.js's compaction notes.
export default function createPaletteNode({
  stateRevealBuf,
  compactedIndexBuf,
  k,
}) {
  const uniforms = {
    paletteStart: uniform(color('#3fd0ff')),
    paletteMid: uniform(color('#a742ff')),
    paletteEnd: uniform(color('#ffd27a')),
    paletteMidpoint: uniform(0.5),
    colorMode: uniform(COLOR_MODE_TO_INT.growthOrder, 'uint'),
  };

  const kUint = uint(k);
  const kMax = uint(Math.max(1, k - 1));
  const originalIndex = compactedIndexBuf.element(instanceIndex);
  const cell = stateRevealBuf.element(originalIndex);
  const revealTime = cell.y;
  const { x, y, z } = decomposeIndexNode(originalIndex, kUint);

  const heightT = y.toFloat().div(kMax.toFloat());

  const half = kMax.toFloat().mul(0.5);
  const dx = x.toFloat().sub(half);
  const dy = y.toFloat().sub(half);
  const dz = z.toFloat().sub(half);
  const maxRadius = half.mul(Math.sqrt(3)).max(0.0001);
  const distanceT = sqrt(dx.mul(dx).add(dy.mul(dy)).add(dz.mul(dz)))
    .div(maxRadius)
    .clamp(0, 1);

  const stateT = cell.x.sub(1).div(2).clamp(0, 1);

  const t = select(
    uniforms.colorMode.equal(uint(COLOR_MODE_TO_INT.growthOrder)),
    revealTime,
    select(
      uniforms.colorMode.equal(uint(COLOR_MODE_TO_INT.height)),
      heightT,
      select(
        uniforms.colorMode.equal(uint(COLOR_MODE_TO_INT.distanceFromCore)),
        distanceT,
        stateT
      )
    )
  );

  const midpoint = uniforms.paletteMidpoint.clamp(0.001, 0.999);
  const lowerT = t.div(midpoint).clamp(0, 1);
  const upperT = t
    .sub(midpoint)
    .div(uint(1).toFloat().sub(midpoint))
    .clamp(0, 1);
  const lower = mix(uniforms.paletteStart, uniforms.paletteMid, lowerT);
  const upper = mix(uniforms.paletteMid, uniforms.paletteEnd, upperT);
  const colorNode = mix(lower, upper, step(midpoint, t));

  return { colorNode, uniforms, colorModeToInt: COLOR_MODE_TO_INT };
}
