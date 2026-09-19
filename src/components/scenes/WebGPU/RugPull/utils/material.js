import {
  Fn,
  float,
  mix,
  positionGeometry,
  sRGBTransferEOTF,
  screenSize,
  select,
  uv,
  vec2,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import grade from './grade';
import { REGION, fringe, textileRegions } from './layout';
import { PATTERNS } from './patterns';

function fullscreenColor(u, build) {
  return Fn(() => {
    const col = build({
      fragCoord: uv().mul(screenSize),
      resolution: screenSize,
      tile: u.tile,
      time: u.time,
    });
    return vec4(sRGBTransferEOTF(grade(u, col)), 1);
  })();
}

function textileColor(u, build) {
  return Fn(() => {
    const { coord, knotShade, q0, region, stripe } = textileRegions(u);

    const raw = build({
      fragCoord: coord.add(0.5),
      resolution: vec2(1),
      tile: u.tile,
      time: u.time,
    }).toVar();
    const rotated = select(
      region.equal(REGION.border),
      raw.zxy,
      select(region.equal(REGION.medallion), raw.yzx, raw)
    );

    const woven = grade(u, rotated).toVar();
    const guard = mix(u.guardColor, u.palette0, stripe);
    woven.assign(select(region.equal(REGION.guard), guard, woven));
    woven.mulAssign(knotShade);

    const tassels = fringe(u, q0);
    const inside = select(
      u.layout.equal(3),
      q0.length().lessThan(u.halfSize.x),
      q0.y.abs().lessThan(u.halfSize.y)
    );
    const color = select(tassels.inFringe, tassels.color, woven);
    const alpha = select(
      tassels.inFringe,
      select(tassels.alive, float(1), float(0)),
      select(inside, float(1), float(0))
    );

    return vec4(sRGBTransferEOTF(color), alpha);
  })();
}

export default function buildMaterial(u, { fullscreen, model, pattern }) {
  const { build } = PATTERNS[pattern] ?? Object.values(PATTERNS)[0];

  const material = new THREE.MeshBasicNodeMaterial({
    side: THREE.DoubleSide,
    toneMapped: false,
  });

  if (fullscreen) {
    material.depthTest = false;
    material.depthWrite = false;
    material.vertexNode = vec4(positionGeometry.xy, 0, 1);
    material.colorNode = fullscreenColor(u, build);
    return material;
  }

  if (model) {
    const color = textileColor(u, build);
    material.colorNode = color.rgb;
    material.opacityNode = color.a;
    material.alphaTest = 0.5;
    return material;
  }

  const color = textileColor(u, build);
  material.colorNode = color.rgb;
  material.opacityNode = color.a;
  material.alphaTest = 0.5;

  return material;
}
