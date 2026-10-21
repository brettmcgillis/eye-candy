import {
  Fn,
  attribute,
  cross,
  float,
  fract,
  int,
  ivec2,
  length,
  max,
  min,
  mix,
  normalize,
  positionGeometry,
  smoothstep,
  textureLoad,
  uniform,
  varyingProperty,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  RAIN_SHADOW_SIZE,
  SHADOW_EDGE_STEP,
  SPLASH_SECONDS,
  rainDrops,
} from './rainCloudRig';

const HIDDEN_Y = -1000;

// Streak corners are (side x, 0–1 along the streak, side z); splash corners
// span the unit square in xz.
function buildGeometry(drops, corners, quads) {
  const count = drops.length / 4;
  const perDrop = corners.length;
  const positions = new Float32Array(count * perDrop * 3);
  const dropAttr = new Float32Array(count * perDrop * 4);
  const indices = new Uint32Array(count * quads * 6);
  for (let d = 0; d < count; d += 1) {
    corners.forEach((corner, v) => {
      positions.set(corner, (d * perDrop + v) * 3);
      dropAttr.set(drops.subarray(d * 4, d * 4 + 4), (d * perDrop + v) * 4);
    });
    for (let q = 0; q < quads; q += 1) {
      const b = d * perDrop + q * 4;
      indices.set([b, b + 1, b + 2, b + 2, b + 1, b + 3], (d * quads + q) * 6);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('drop', new THREE.BufferAttribute(dropAttr, 4));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  return geometry;
}

const STREAK_CORNERS = [
  [-1, 0, 0],
  [1, 0, 0],
  [-1, 1, 0],
  [1, 1, 0],
  [0, 0, -1],
  [0, 0, 1],
  [0, 1, -1],
  [0, 1, 1],
];
const SPLASH_CORNERS = [
  [-1, 0, -1],
  [1, 0, -1],
  [-1, 0, 1],
  [1, 0, 1],
];

export function buildRainGeometry(count, seed) {
  const drops = rainDrops(count, seed);
  return {
    splashes: buildGeometry(drops, SPLASH_CORNERS, 1),
    streaks: buildGeometry(drops, STREAK_CORNERS, 2),
  };
}

// The streaks and splashes share every uniform; `heights` is the rain
// shadow's texture, read texel by texel as rainCloud's shadowHeight reads it.
export function createRainMaterials(heights) {
  const u = {
    base: uniform(new THREE.Vector3()),
    color: uniform(new THREE.Color()),
    fall: uniform(1),
    flash: uniform(0),
    floorVisible: uniform(1),
    floorY: uniform(-0.9),
    length: uniform(0.07),
    opacity: uniform(0.5),
    radius: uniform(new THREE.Vector2(0.3, 0.2)),
    shadowCenter: uniform(new THREE.Vector2()),
    shadowHalf: uniform(0.3),
    speed: uniform(2.6),
    splash: uniform(0.025),
    time: uniform(0),
    width: uniform(0.002),
  };

  const drop = () => {
    const d = attribute('drop', 'vec4');
    const speed = u.speed.mul(d.w).toVar();
    const x = u.base.x.add(d.x.mul(u.radius.x)).toVar();
    const z = u.base.z.add(d.y.mul(u.radius.y)).toVar();
    const head = u.base.y
      .sub(fract(u.time.mul(speed).div(u.fall).add(d.z)).mul(u.fall))
      .toVar();
    const cell = (w, c) =>
      int(
        w
          .sub(c)
          .div(u.shadowHalf)
          .add(1)
          .mul(0.5 * RAIN_SHADOW_SIZE)
          .floor()
          .clamp(0, RAIN_SHADOW_SIZE - 1)
      );
    const ix = cell(x, u.shadowCenter.x).toVar();
    const iz = cell(z, u.shadowCenter.y).toVar();
    const stop = textureLoad(heights, ivec2(ix, iz)).x.toVar();
    return { head, ix, iz, speed, stop, x, z };
  };

  // rainCloudRig's shadowNormal: slopes to the neighbouring texels, skipping
  // any across a hem or onto the floor.
  const surfaceNormal = (ix, iz, h) => {
    const at = (i, k) =>
      textureLoad(
        heights,
        ivec2(
          i.clamp(int(0), int(RAIN_SHADOW_SIZE - 1)),
          k.clamp(int(0), int(RAIN_SHADOW_SIZE - 1))
        )
      ).x;
    const slope = (before, after) => {
      const useBefore = h.sub(before).abs().lessThan(SHADOW_EDGE_STEP);
      const useAfter = after.sub(h).abs().lessThan(SHADOW_EDGE_STEP);
      const sum = useBefore
        .select(h.sub(before), float(0))
        .add(useAfter.select(after.sub(h), float(0)));
      const n = useBefore
        .select(float(1), float(0))
        .add(useAfter.select(float(1), float(0)));
      return sum.div(max(n, 1)).div(u.shadowHalf.mul(2 / RAIN_SHADOW_SIZE));
    };
    const sx = slope(at(ix.sub(int(1)), iz), at(ix.add(int(1)), iz));
    const sz = slope(at(ix, iz.sub(int(1))), at(ix, iz.add(int(1))));
    return normalize(vec3(sx.negate(), 1, sz.negate()));
  };

  const tint = mix(u.color, vec3(1), u.flash.mul(0.6));

  const streaks = new THREE.MeshBasicNodeMaterial({
    depthWrite: false,
    transparent: true,
  });
  streaks.positionNode = Fn(() => {
    const { head, stop, x, z } = drop();
    const tail = min(u.base.y, head.add(u.length));
    const alive = head.greaterThanEqual(stop).and(tail.greaterThan(head));
    const half = alive.select(u.width.mul(0.5), float(0));
    return vec3(
      x.add(positionGeometry.x.mul(half)),
      alive.select(mix(head, tail, positionGeometry.y), float(HIDDEN_Y)),
      z.add(positionGeometry.z.mul(half))
    );
  })();
  streaks.colorNode = tint;
  streaks.opacityNode = u.opacity.mul(
    float(1).sub(positionGeometry.y.mul(0.7))
  );

  const age = varyingProperty('float', 'vSplashAge');
  const splashes = new THREE.MeshBasicNodeMaterial({
    depthWrite: false,
    side: THREE.DoubleSide,
    transparent: true,
  });
  splashes.positionNode = Fn(() => {
    const { head, ix, iz, speed, stop, x, z } = drop();
    const t = stop.sub(head).div(speed).div(SPLASH_SECONDS).toVar();
    const onFloor = stop.lessThanEqual(u.floorY.add(1e-3));
    const alive = head
      .lessThan(stop)
      .and(t.lessThan(1))
      .and(u.floorVisible.greaterThan(0.5).or(onFloor.not()));
    age.assign(t);
    const r = alive.select(u.splash.mul(t.mul(0.7).add(0.3)), float(0));
    const n = surfaceNormal(ix, iz, stop).toVar();
    const across = normalize(vec3(n.y, n.x.negate(), 0)).toVar();
    const along = cross(n, across);
    const centre = vec3(x, alive.select(stop, float(HIDDEN_Y)), z).add(
      n.mul(0.002)
    );
    return centre.add(
      across.mul(positionGeometry.x).add(along.mul(positionGeometry.z)).mul(r)
    );
  })();
  const ring = length(positionGeometry.xz);
  splashes.colorNode = tint;
  splashes.opacityNode = u.opacity
    .mul(smoothstep(0.55, 0.8, ring))
    .mul(float(1).sub(smoothstep(0.85, 1, ring)))
    .mul(float(1).sub(age));

  return { splashes, streaks, uniforms: u };
}
