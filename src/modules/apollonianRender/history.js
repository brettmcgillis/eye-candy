import {
  Fn,
  If,
  Loop,
  abs,
  clamp,
  cos,
  float,
  floor,
  int,
  max,
  sin,
  storage,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  HISTORY_GRID,
  HISTORY_MAX_CIRCLES,
  historyPackingFor,
} from '@modules/apollonian';

export function createHistoryBuffers() {
  return {
    circles: new THREE.StorageBufferAttribute(
      new Float32Array(HISTORY_MAX_CIRCLES * 4),
      4
    ),
    starts: new THREE.StorageBufferAttribute(
      new Uint32Array(HISTORY_GRID ** 2 + 1),
      1
    ),
    indices: new THREE.StorageBufferAttribute(new Uint32Array(2 ** 16), 1),
  };
}

export function uploadHistory(buffers, config) {
  const { circles, grid } = historyPackingFor(config);
  buffers.circles.array.set(circles);
  buffers.starts.array.set(grid.starts);
  buffers.indices.array.set(grid.indices);
  Object.values(buffers).forEach((attribute) => {
    // eslint-disable-next-line no-param-reassign
    attribute.needsUpdate = true;
  });
}

export default function historyCore(u, buffers) {
  const circles = storage(
    buffers.circles,
    'vec4',
    buffers.circles.count
  ).toReadOnly();
  const starts = storage(
    buffers.starts,
    'uint',
    buffers.starts.count
  ).toReadOnly();
  const indices = storage(
    buffers.indices,
    'uint',
    buffers.indices.count
  ).toReadOnly();
  return Fn(([p]) => {
    const half = u.historyHeight.mul(0.5).toVar();
    const seconds = u.historyTime
      .sub(
        float(0.5)
          .sub(clamp(p.y, half.negate(), half).div(u.historyHeight))
          .mul(u.historySeconds)
      )
      .toVar();
    const magnitude = u.historyWarp
      .mul(sin(seconds.mul(0.43)).mul(0.35).add(0.65))
      .toVar();
    const a = vec2(cos(seconds.mul(0.27)), sin(seconds.mul(0.27)))
      .mul(magnitude)
      .negate()
      .toVar();
    const radial = p.xz.length().toVar();
    const q = p.xz.div(max(radial, 1)).toVar();
    const angle = seconds.mul(u.historyTwist).toVar();
    const cosine = cos(angle).toVar();
    const sine = sin(angle).toVar();
    const warp = a.negate().toVar();
    const w2 = warp.dot(warp).toVar();
    const rotated = vec2(
      cosine.mul(q.x).add(sine.mul(q.y)),
      cosine.mul(q.y).sub(sine.mul(q.x))
    );
    const denom = vec2(
      float(1).add(a.dot(rotated)),
      a.x.mul(rotated.y).sub(a.y.mul(rotated.x))
    );
    const numerator = rotated.add(a);
    const point = vec2(
      numerator.dot(denom),
      numerator.y.mul(denom.x).sub(numerator.x.mul(denom.y))
    )
      .div(denom.dot(denom))
      .toVar();
    const cell = clamp(
      floor(point.add(1).mul(HISTORY_GRID / 2)),
      0,
      HISTORY_GRID - 1
    );
    const index = int(cell.y.mul(HISTORY_GRID).add(cell.x));
    const begin = int(starts.element(index));
    const end = int(starts.element(index.add(1)));
    const d = float(2 / HISTORY_GRID)
      .mul(u.historyWarp.oneMinus())
      .div(u.historyWarp.add(1))
      .toVar();
    const radius = float(1).toVar();
    const trap = float(0).toVar();
    Loop({ start: begin, end, type: 'int' }, ({ i }) => {
      const circle = circles.element(int(indices.element(i))).toVar();
      const r = circle.z.mul(u.historyGap.oneMinus()).toVar();
      const den = vec2(
        float(1).add(warp.dot(circle.xy)),
        warp.x.mul(circle.y).sub(warp.y.mul(circle.x))
      );
      const divisor = den
        .dot(den)
        .sub(w2.mul(r.mul(r)))
        .toVar();
      const sum = circle.xy.add(warp).toVar();
      const centre = vec2(sum.dot(den), sum.y.mul(den.x).sub(sum.x.mul(den.y)))
        .sub(warp.mul(r.mul(r)))
        .div(divisor)
        .toVar();
      const rotatedCentre = vec2(
        cosine.mul(centre.x).sub(sine.mul(centre.y)),
        sine.mul(centre.x).add(cosine.mul(centre.y))
      );
      const transformedRadius = r.mul(w2.oneMinus()).div(divisor);
      const dist = q.sub(rotatedCentre).length().sub(transformedRadius);
      If(dist.lessThan(d), () => {
        d.assign(dist);
        radius.assign(circle.z);
        trap.assign(circle.w);
      });
    });
    return vec3(
      max(d.div(u.historyLipschitz), max(radial.sub(1), abs(p.y).sub(half))),
      radius,
      trap
    );
  }).setLayout({
    name: 'historyCore',
    type: 'vec3',
    inputs: [{ name: 'p', type: 'vec3' }],
  });
}
