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
  select,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';

import { brightnessJitter, outlineFactor, pointerSplit } from './shared';

const LUMA = vec3(0.299, 0.587, 0.114);

// Triangular (60°) lattice basis and its inverse, ported from the
// "multiscale trixels" reference in this effect's todo.md — a screen point
// maps to lattice space via `toLattice`, and a lattice point maps back to
// pixels via `fromLattice`. Only ever scaled (never rotated), so the inverse
// is the fixed constant below rather than a per-fragment `inverse()`.
const INV_SQRT3 = 0.5773502692;
const TWO_INV_SQRT3 = 1.1547005384;
const SQRT3_OVER_2 = 0.8660254038;

function toLattice(px, scale) {
  return vec2(px.x.sub(px.y.mul(INV_SQRT3)), px.y.mul(TWO_INV_SQRT3)).div(
    scale
  );
}

function fromLattice(q, scale) {
  return vec2(q.x.add(q.y.mul(0.5)), q.y.mul(SQRT3_OVER_2)).mul(scale);
}

// A unit rhombus in lattice space holds two triangles: "up" (qi, qi+(1,0),
// qi+(0,1)) when the barycentric leftover z = 1-f.x-f.y is >= 0, otherwise
// "down" (qi+(1,0), qi+(0,1), qi+(1,1)). `select` picks the right vertex set
// per-fragment without branching the graph.
function triangleVerts(qi, isDown) {
  const v0 = select(isDown, qi.add(vec2(1, 0)), qi);
  const v1 = select(isDown, qi.add(vec2(0, 1)), qi.add(vec2(1, 0)));
  const v2 = select(isDown, qi.add(vec2(1, 1)), qi.add(vec2(0, 1)));
  return [v0, v1, v2];
}

function triangleCentroid(qi, isDown) {
  return select(isDown, qi.add(vec2(2 / 3, 2 / 3)), qi.add(vec2(1 / 3, 1 / 3)));
}

function noiseSplit(qi, isDown, level, uniforms) {
  const flag = select(isDown, float(1), float(0));
  const hash = mxCellNoise(
    qi
      .mul(uniforms.noiseScale)
      .add(vec2(float(level).mul(13.7), uniforms.seed))
      .add(vec2(flag.mul(3.1), flag.mul(7.3)))
  );
  return hash.greaterThan(uniforms.threshold);
}

// Content-aware split test — samples the current triangle's 3 vertices and
// compares their luminance spread, same reasoning as the quad variant's
// child-sampling (see quad.js) but using the triangle's own corners since a
// tri's "children" are a finer re-tiling rather than 4 clean sub-cells.
function varianceSplit(qi, isDown, cellPx, sampleFn, uniforms) {
  const [v0, v1, v2] = triangleVerts(qi, isDown);
  const luma = (v) =>
    dot(sampleFn(fromLattice(v, cellPx).div(screenSize)).rgb, LUMA);

  const l0 = luma(v0);
  const l1 = luma(v1);
  const l2 = luma(v2);
  const maxL = l0.max(l1).max(l2);
  const minL = l0.min(l1).min(l2);
  return maxL.sub(minL).greaterThan(uniforms.varianceThreshold);
}

export function buildTriPixelation(sampleFn, uniforms, { driver }) {
  return Fn(() => {
    const cellPx = uniforms.cellSize.toVar();
    const active = bool(true).toVar();

    Loop(
      { start: int(0), end: uniforms.levels, type: 'int', condition: '<' },
      ({ i }) => {
        const q = toLattice(screenCoordinate.xy, cellPx);
        const qi = floor(q);
        const f = q.sub(qi);
        const z = float(1).sub(f.x).sub(f.y);
        const isDown = z.lessThan(0);

        let shouldSplit;
        if (driver === 'pointer') {
          const centroidUV = fromLattice(
            triangleCentroid(qi, isDown),
            cellPx
          ).div(screenSize);
          shouldSplit = pointerSplit(centroidUV, i, uniforms);
        } else if (driver === 'variance') {
          shouldSplit = varianceSplit(qi, isDown, cellPx, sampleFn, uniforms);
        } else {
          shouldSplit = noiseSplit(qi, isDown, i, uniforms);
        }

        If(active.and(shouldSplit), () => {
          cellPx.assign(cellPx.div(2));
        }).Else(() => {
          active.assign(bool(false));
        });
      }
    );

    const q = toLattice(screenCoordinate.xy, cellPx);
    const qi = floor(q);
    const f = q.sub(qi);
    const z = float(1).sub(f.x).sub(f.y);
    const isDown = z.lessThan(0);

    const centroid = triangleCentroid(qi, isDown);
    const finalUV = fromLattice(centroid, cellPx).div(screenSize);
    const sampled = sampleFn(finalUV);

    const flag = select(isDown, float(1), float(0));
    const brightness = brightnessJitter(
      qi.add(vec2(flag.mul(3.1), flag.mul(7.3))),
      uniforms
    );

    const edgeDistMin = min(f.x, min(f.y, z.abs()));

    return vec4(
      sampled.rgb.mul(brightness).mul(outlineFactor(edgeDistMin, uniforms)),
      sampled.a
    );
  })();
}
