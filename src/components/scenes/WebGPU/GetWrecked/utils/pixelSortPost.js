// "Pixel sorting" glitch look, approximated for real-time GPU use — there's
// no clean single-pass GPU equivalent to a true per-row/column sort, so this
// instead walks from each bright-enough pixel along a direction until it
// finds the edge of that bright "run" (or hits the step cap), and paints the
// whole span with whatever color it lands on. Same streaking, dripping
// character as a real sort, without actually sorting anything. The chunk mask
// keeps it to bands/cells of the frame rather than the whole picture.
import {
  Break,
  Fn,
  If,
  Loop,
  float,
  int,
  luminance,
  mix,
  screenUV,
  uniform,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { buildChunkMask, createChunkUniforms } from './screenChunks';

const MAX_PIXEL_SORT_STEPS = 64;

export function createPixelSortUniforms() {
  return {
    threshold: uniform(0.55),
    steps: uniform(20),
    stepSize: uniform(0.004),
    direction: uniform(new THREE.Vector2(0, 1)),
    lengthJitter: uniform(0),
    chunks: createChunkUniforms(),
  };
}

export function buildPixelSortNode(sceneColor, u, chunkMode) {
  return Fn(() => {
    const { mask, chunkHash } = buildChunkMask(chunkMode, u.chunks);
    const active = mask.toVar('psMask');
    const baseColor = sceneColor.sample(screenUV).toVar('psBase');
    const result = baseColor.toVar('psResult');

    If(
      luminance(baseColor.rgb)
        .greaterThan(u.threshold)
        .and(active.greaterThan(0.01)),
      () => {
        const steps = u.steps
          .mul(mix(float(1), chunkHash, u.lengthJitter))
          .toVar('psSteps');
        const stepVec = u.direction.mul(u.stepSize);
        const sampleUv = screenUV.toVar('psUv');

        Loop(
          { start: int(0), end: int(MAX_PIXEL_SORT_STEPS), type: 'int' },
          ({ i }) => {
            If(i.toFloat().greaterThanEqual(steps), () => {
              Break();
            });

            sampleUv.assign(sampleUv.add(stepVec));
            const sampled = sceneColor.sample(sampleUv);

            If(luminance(sampled.rgb).lessThan(u.threshold), () => {
              result.assign(sampled);
              Break();
            });

            result.assign(sampled);
          }
        );
      }
    );

    return mix(baseColor, result, active);
  })();
}
