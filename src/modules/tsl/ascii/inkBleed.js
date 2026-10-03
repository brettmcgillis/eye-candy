import {
  Fn,
  If,
  Loop,
  clamp,
  float,
  max,
  mix,
  screenSize,
  screenUV,
  uniformArray,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { luma } from './shared';

const SAMPLES = 64;
const GOLDEN = 2.39996323;

// Vogel spiral over the whole disc, Gaussian-weighted: (cos, sin, r, w).
const kernel = uniformArray(
  Array.from({ length: SAMPLES }, (_, i) => {
    const rn = Math.sqrt((i + 0.5) / SAMPLES);
    const angle = i * GOLDEN;
    return new THREE.Vector4(
      Math.cos(angle),
      Math.sin(angle),
      rn,
      Math.exp(-rn * rn * 2.2)
    );
  }),
  'vec4'
);

// Ink (anything not white) spread across cell borders and tinted by its own
// colour, plus an optional Gaussian blur over the same disc.
export default function buildInkBleed(source, u) {
  return Fn(() => {
    const input = source.sample(screenUV).level(0);
    const col = vec3(input.rgb).toVar();
    const doBleed = u.bleed.greaterThan(0);
    const doBlur = u.bleedBlur.greaterThan(0);

    If(doBleed.or(doBlur), () => {
      const px = vec2(u.bleedRadius).div(screenSize);
      const aspect = screenSize.x.div(screenSize.y);
      const inkSum = vec3(0).toVar();
      const presSum = float(0).toVar();
      const colSum = vec3(0).toVar();
      const wTotal = float(0).toVar();

      Loop(SAMPLES, ({ i }) => {
        const k = kernel.element(i);
        const offset = vec2(k.x, k.y.mul(aspect)).mul(k.z).mul(px);
        const c = source.sample(screenUV.add(offset)).level(0).rgb;
        const p = clamp(luma(c).oneMinus(), 0, 1);
        inkSum.addAssign(c.mul(p).mul(k.w));
        presSum.addAssign(p.mul(k.w));
        colSum.addAssign(c.mul(k.w));
        wTotal.addAssign(k.w);
      });

      If(doBleed, () => {
        const inkColor = inkSum.div(max(presSum, 1e-4));
        const coverage = presSum.div(max(wTotal, 1e-4));
        col.assign(
          mix(col, inkColor, clamp(coverage.mul(u.bleed).mul(2.5), 0, 1))
        );
      });
      If(doBlur, () => {
        col.assign(
          mix(col, colSum.div(max(wTotal, 1e-4)), clamp(u.bleedBlur, 0, 1))
        );
      });
    });

    return vec4(col, input.a);
  })();
}
