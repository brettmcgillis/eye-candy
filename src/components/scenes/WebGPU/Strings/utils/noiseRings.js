import {
  Fn,
  Loop,
  abs,
  atan,
  cos,
  float,
  fract,
  length,
  sin,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';

import { centeredUV } from './shaderPlate';
import { simplex3d } from './simplex3d';

const RINGS = 16;
const PI = 3.14159;
const TAU = 2 * 3.14159;
const LOOP_RADIUS = 0.2;

export default function noiseRingsNode(u) {
  return Fn(() => {
    const p = centeredUV(u);
    const col = vec3(0).toVar();
    const tt = fract(u.time.mul(u.plateRingLoopSpeed));
    const a = atan(p.y, p.x).add(PI);
    const damp = length(p.sub(vec2(-0.4)));

    Loop({ start: 1, end: RINGS, type: 'float', condition: '<=' }, ({ i }) => {
      const loopAngle = tt.mul(TAU).sub(a.mul(u.plateRingLobes));
      const loopX = sin(loopAngle).mul(LOOP_RADIUS);
      const loopY = cos(loopAngle).mul(LOOP_RADIUS);
      const inner = simplex3d(vec3(sin(a), cos(a), i));

      const nx = simplex3d(
        vec3(i.mul(10).add(loopX), i.mul(10).add(loopY), inner)
      ).mul(u.plateRingNoise);
      const ny = simplex3d(
        vec3(i.mul(2).add(loopX), i.mul(2).add(loopY), inner)
      ).mul(u.plateRingNoise);

      const d2 = damp.mul(damp);
      const circle = abs(
        length(p.sub(vec2(nx.mul(d2), ny.mul(d2)))).sub(u.plateRingRadius)
      );

      col.addAssign(float(damp).mul(u.plateRingGlow).div(abs(circle)));
    });

    return vec4(col.mul(u.tint).mul(u.plateBrightness), 1);
  })();
}
