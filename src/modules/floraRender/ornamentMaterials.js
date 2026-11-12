import {
  Fn,
  PI,
  abs,
  attribute,
  cross,
  faceDirection,
  float,
  hash,
  instanceIndex,
  max,
  mix,
  normalGeometry,
  normalize,
  positionGeometry,
  pow,
  rotate,
  sin,
  smoothstep,
  texture,
  uint,
  varyingProperty,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { seedFlight, windOffset, worldPerPixel } from './motionNodes';
import { crownColor, ornamentTone, toViewNormal } from './palette';

function ornamentBase(position, info, birth, u) {
  const appear = smoothstep(birth, birth.add(0.05), u.growth);
  const pop = appear.mul(sin(appear.mul(PI)).mul(0.35).add(1));
  const rest = position.xyz.add(windOffset(position.xyz, info.w, u));
  const flight = seedFlight(rest, birth, info.z, u);

  return {
    center: rest.add(flight.offset),
    scale: pop.mul(flight.fade),
    spin: flight.spin,
  };
}

function ornamentColor(info, u) {
  return ornamentTone(
    mix(u.ornamentColor, crownColor(info.y, u), 0.2),
    info.z,
    u
  ).mul(info.z.mul(0.3).add(0.85));
}

function sizeFor(base, center, u, clampToPixels) {
  const size = base.mul(u.ornamentScale);

  return clampToPixels
    ? max(size, worldPerPixel(center).mul(u.ornamentMinPixels).mul(0.5))
    : size;
}

export function createSolidMaterial(u, group = 2) {
  const material = new THREE.MeshStandardNodeMaterial();
  const position = attribute('sPos', 'vec4');
  const info = attribute('sInfo', 'vec4');
  const tumble = vec3(
    hash(instanceIndex.add(3)),
    hash(instanceIndex.add(101)),
    hash(instanceIndex.add(997))
  ).mul(PI.mul(2));
  const place = (clampToPixels) =>
    Fn(() => {
      const base = ornamentBase(position, info, info.x, u);
      const size = sizeFor(position.w, base.center, u, clampToPixels);

      return base.center.add(
        rotate(positionGeometry, tumble.add(base.spin))
          .mul(size)
          .mul(base.scale)
      );
    })();

  material.positionNode = place(true);
  material.castShadowPositionNode = place(false);
  material.normalNode = toViewNormal(rotate(normalGeometry, tumble));
  material.colorNode = u.painting.treat(
    ornamentColor(info, u),
    positionGeometry.xy.mul(0.5).add(0.5),
    {
      seed: instanceIndex.toVarying().toUint().bitOr(uint(group).shiftLeft(28)),
      edge: float(0),
    }
  );
  material.emissiveNode = material.colorNode.mul(
    u.painting.u.style.greaterThan(0.5).select(0.3, 0)
  );
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
  const seed = instanceIndex.toVarying().toUint().bitOr(uint(1).shiftLeft(28));
  const at = positionGeometry.xy.mul(0.5).add(0.5);
  const drift = u.painting.field(at.mul(2), seed).rg.sub(0.5).mul(0.05);
  const shapeUV = vec2(
    info.z.greaterThan(0.5).select(at.x, float(1).sub(at.x)),
    at.y
  ).add(drift);
  const penWobble = u.painting
    .field(at.mul(5), seed.add(317))
    .rg.sub(0.5)
    .mul(u.painting.u.strokeRoughness)
    .mul(0.04);
  const botanical = texture(u.botanical, shapeUV.add(penWobble));
  const base = ornamentColor(info, u).mul(
    positionGeometry.y.add(1).mul(0.2).add(0.6)
  );
  const wash = u.painting.treat(base, at.mul(3), {
    seed,
    edge: float(0),
  });
  const graphite = mix(
    base,
    u.painting.inkFor(base),
    botanical.b.mul(9).clamp(0, 1)
  );
  const hatch = u.painting.hatch(
    at.x.add(at.y.mul(0.6)).mul(24),
    at.y.mul(9),
    seed
  );
  const hatched = mix(
    botanical.g.mul(9).clamp(0, 1),
    hatch.mul(0.65),
    u.painting.u.hatchRoughness
  );
  const legacyDrawing = mix(
    u.painting.u.paper,
    graphite,
    botanical.g.mul(9).add(botanical.b.mul(12)).clamp(0, 1)
  );
  const looseDrawing = mix(
    u.painting.u.paper,
    mix(base, u.painting.inkFor(base), hatched),
    hatched.add(botanical.b.mul(12)).clamp(0, 1)
  );
  const drawing = mix(legacyDrawing, looseDrawing, u.painting.u.hatchRoughness);
  material.colorNode = u.painting.u.style
    .lessThan(0.5)
    .select(
      base,
      u.painting.u.style.greaterThan(1.5).select(drawing, mix(base, wash, 0.5))
    );
  const nativeLeaf = u.painting.washMark(at, seed);
  const washAlpha = botanical.r
    .mul(2.4)
    .clamp(0, 1)
    .mul(u.painting.field(at.mul(5), seed.add(91)).r.mul(0.8).add(0.45))
    .clamp(0, 1);
  const pencilAlpha = mix(
    botanical.b.mul(12).add(botanical.g.mul(7)).clamp(0, 1),
    botanical.b.mul(12).add(hatched).clamp(0, 1),
    u.painting.u.hatchRoughness
  );
  const alpha = u.painting.u.style
    .greaterThan(1.5)
    .select(
      pencilAlpha,
      mix(
        washAlpha,
        washAlpha
          .mul(nativeLeaf.r.mul(2).clamp(0, 1))
          .add(nativeLeaf.b.mul(u.painting.u.pooling).mul(0.2))
          .clamp(0, 1),
        u.painting.u.bleed
      )
    );
  material.opacityNode = u.painting.u.style.greaterThan(0.5).select(alpha, 1);
  material.emissiveNode = material.colorNode.mul(
    u.painting.u.style.greaterThan(0.5).select(0.6, 0)
  );
  material.normalNode = toViewNormal(vNormal).mul(faceDirection);
  material.roughnessNode = u.roughness;
  material.metalnessNode = float(0);
  material.maskNode = u.painting.u.style
    .greaterThan(0.5)
    .select(
      alpha.greaterThan(0.005),
      info.x
        .lessThan(0.5)
        .select(heartMask(positionGeometry.xy), petalMask(positionGeometry.xy))
    );

  return material;
}
