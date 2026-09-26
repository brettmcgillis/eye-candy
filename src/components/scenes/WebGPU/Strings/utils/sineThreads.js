import {
  Fn,
  Loop,
  float,
  floor,
  length,
  mix,
  sin,
  smoothstep,
  vec3,
  vec4,
} from 'three/tsl';

import { centeredUV } from './shaderPlate';
import { simplex3d } from './simplex3d';

const FIRST = -70;
const LAST = 70;

export default function sineThreadsNode(u) {
  return Fn(() => {
    const p = centeredUV(u);
    const col = vec3(0).toVar();
    const offset = float(0).toVar();
    const lens = smoothstep(0.25, 0.75, length(p).oneMinus());

    Loop({ start: FIRST, end: LAST, type: 'float' }, ({ i }) => {
      const even = i.sub(floor(i.mul(0.5)).mul(2)).lessThan(0.5);
      const shade = even.select(float(1.2), float(0));

      offset.addAssign(
        even.select(
          simplex3d(vec3(i.mul(0.05), 10, 10)).mul(u.plateThreadNoise),
          0
        )
      );

      const curve = p.y
        .sub(
          u.plateThreadAmplitude
            .mul(lens)
            .mul(sin(p.x.mul(u.plateThreadFrequency).sub(u.time).add(offset)))
        )
        .add(i.div(u.plateThreadSpacing));

      col.assign(
        mix(
          col,
          vec3(shade),
          smoothstep(curve, curve.add(u.plateThreadEdge), 0)
        )
      );
    });

    return vec4(col.mul(2).mul(u.tint).mul(u.plateBrightness), 1);
  })();
}
