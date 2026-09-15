import {
  Fn,
  PI,
  abs,
  attribute,
  cross,
  faceDirection,
  float,
  max,
  mix,
  normalize,
  positionGeometry,
  pow,
  rotate,
  sin,
  smoothstep,
  varyingProperty,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { scatterState, windOffset, worldPerPixel } from './motionNodes';
import { crownColor, toViewNormal } from './palette';

function ornamentBase(position, info, birth, u) {
  const appear = smoothstep(birth, birth.add(0.05), u.growth);
  const pop = appear.mul(sin(appear.mul(PI)).mul(0.35).add(1));
  const rest = position.xyz.add(windOffset(position.xyz, info.w, u));
  const scatter = scatterState(rest, float(1), float(0), info.z, u);

  return {
    center: rest.add(scatter.offset),
    scale: pop.mul(scatter.fade),
    spin: scatter.spin,
  };
}

function ornamentColor(info, u) {
  return mix(u.ornamentColor, crownColor(info.y, u), 0.2).mul(
    info.z.mul(0.3).add(0.85)
  );
}

function sizeFor(base, center, u, clampToPixels) {
  const size = base.mul(u.ornamentScale);

  return clampToPixels
    ? max(size, worldPerPixel(center).mul(u.ornamentMinPixels).mul(0.5))
    : size;
}

export function createBeadMaterial(u) {
  const material = new THREE.MeshStandardNodeMaterial();
  const position = attribute('bPos', 'vec4');
  const info = attribute('bInfo', 'vec4');
  const place = (clampToPixels) =>
    Fn(() => {
      const base = ornamentBase(position, info, info.x, u);
      const size = sizeFor(position.w, base.center, u, clampToPixels);

      return base.center.add(positionGeometry.mul(size).mul(base.scale));
    })();

  material.positionNode = place(true);
  material.castShadowPositionNode = place(false);
  material.colorNode = ornamentColor(info, u);
  material.roughnessNode = u.roughness.mul(0.7);
  material.metalnessNode = float(0);

  return material;
}

function heartMask(uv) {
  const x = uv.x.mul(1.3);
  const y = uv.y.mul(1.3).add(0.15);
  const r = x.mul(x).add(y.mul(y)).sub(1);

  return r.mul(r).mul(r).sub(x.mul(x).mul(y).mul(y).mul(y)).lessThan(0);
}

function petalMask(uv) {
  const along = uv.y.add(1).mul(0.5);
  const half = sin(pow(along, 0.7).mul(PI)).mul(0.55);

  return abs(uv.x).lessThan(half);
}

export function createCardMaterial(u) {
  const material = new THREE.MeshStandardNodeMaterial({
    side: THREE.DoubleSide,
  });
  const position = attribute('cPos', 'vec4');
  const direction = attribute('cDir', 'vec4');
  const info = attribute('cInfo', 'vec4');
  const vNormal = varyingProperty('vec3', 'vCardNormal');
  const place = (clampToPixels) =>
    Fn(() => {
      const base = ornamentBase(position, info, direction.w, u);
      const size = sizeFor(position.w, base.center, u, clampToPixels).mul(
        base.scale
      );
      const up = normalize(rotate(direction.xyz, base.spin));
      const roll = vec3(
        info.z.sub(0.5),
        info.z.mul(7.3).fract().sub(0.5),
        info.z.mul(3.7).fract().sub(0.5)
      );
      const side = normalize(cross(up, normalize(roll.add(vec3(0.001, 0, 0)))));
      const facing = cross(side, up);
      const { x } = positionGeometry;
      const cup = x.mul(x).mul(u.cardCup);

      vNormal.assign(normalize(facing.sub(side.mul(x).mul(u.cardCup).mul(2))));

      return base.center
        .add(up.mul(positionGeometry.y.add(1).mul(size)))
        .add(side.mul(x).mul(size))
        .add(facing.mul(cup).mul(size));
    })();

  material.positionNode = place(true);
  material.castShadowPositionNode = place(false);
  material.colorNode = ornamentColor(info, u).mul(
    positionGeometry.y.add(1).mul(0.2).add(0.6)
  );
  material.normalNode = toViewNormal(vNormal).mul(faceDirection);
  material.roughnessNode = u.roughness;
  material.metalnessNode = float(0);
  material.maskNode = info.x
    .lessThan(0.5)
    .select(heartMask(positionGeometry.xy), petalMask(positionGeometry.xy));

  return material;
}
