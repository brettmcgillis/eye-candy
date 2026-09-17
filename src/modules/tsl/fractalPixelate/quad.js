/* eslint-disable no-param-reassign, import/prefer-default-export */
import {
  Fn,
  If,
  Loop,
  bool,
  dot,
  float,
  floor,
  int,
  min,
  mx_cell_noise_float as mxCellNoise,
  screenCoordinate,
  screenSize,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';

import { brightnessJitter, outlineFactor, pointerSplit } from './shared';

const LUMA = vec3(0.299, 0.587, 0.114);

// Noise-driven split test — hash the cell id (+ level, + seed) and compare
// against a fixed threshold.
function noiseSplit(cellId, level, uniforms) {
  const hash = mxCellNoise(
    cellId
      .mul(uniforms.noiseScale)
      .add(vec2(float(level).mul(13.7), uniforms.seed))
  );
  return hash.greaterThan(uniforms.threshold);
}

// Content-aware split test — samples the 4 children the cell would split
// into and compares their luminance spread against a threshold. A flat
// block (sky, a wall) reads as low spread and locks; a busy one (foliage,
// text) keeps subdividing. This is a per-fragment approximation of the
// mip-pyramid variance walk described in this effect's todo.md — cheap
// enough for a single pass since `levels` is small, but re-samples the
// scene texture per level rather than reusing a precomputed pyramid.
function varianceSplit(cellId, cellPx, sampleFn, uniforms) {
  const childPx = cellPx.div(2);
  const origin = cellId.mul(cellPx);
  const luma = (offset) =>
    dot(sampleFn(origin.add(childPx.mul(offset)).div(screenSize)).rgb, LUMA);

  const l00 = luma(vec2(0.5, 0.5));
  const l10 = luma(vec2(1.5, 0.5));
  const l01 = luma(vec2(0.5, 1.5));
  const l11 = luma(vec2(1.5, 1.5));
  const maxL = l00.max(l10).max(l01).max(l11);
  const minL = l00.min(l10).min(l01).min(l11);
  return maxL.sub(minL).greaterThan(uniforms.varianceThreshold);
}

export function buildQuadPixelation(sampleFn, uniforms, { driver }) {
  return Fn(() => {
    const cellPx = uniforms.cellSize.toVar();
    const active = bool(true).toVar();

    Loop(
      { start: int(0), end: uniforms.levels, type: 'int', condition: '<' },
      ({ i }) => {
        const cellId = floor(screenCoordinate.xy.div(cellPx));

        let shouldSplit;
        if (driver === 'pointer') {
          const cellCenterUV = cellId.add(0.5).mul(cellPx).div(screenSize);
          shouldSplit = pointerSplit(cellCenterUV, i, uniforms);
        } else if (driver === 'variance') {
          shouldSplit = varianceSplit(cellId, cellPx, sampleFn, uniforms);
        } else {
          shouldSplit = noiseSplit(cellId, i, uniforms);
        }

        If(active.and(shouldSplit), () => {
          cellPx.assign(cellPx.div(2));
        }).Else(() => {
          active.assign(bool(false));
        });
      }
    );

    const cellId = floor(screenCoordinate.xy.div(cellPx));
    const cellCenterPx = cellId.add(0.5).mul(cellPx);
    const finalUV = cellCenterPx.div(screenSize);
    const sampled = sampleFn(finalUV);

    const brightness = brightnessJitter(cellId, uniforms);

    const localUV = screenCoordinate.xy.div(cellPx).sub(cellId);
    const edgeDist = min(localUV, localUV.oneMinus());
    const edgeDistMin = min(edgeDist.x, edgeDist.y);

    return vec4(
      sampled.rgb.mul(brightness).mul(outlineFactor(edgeDistMin, uniforms)),
      sampled.a
    );
  })();
}
