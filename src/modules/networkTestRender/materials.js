import {
  abs,
  attribute,
  cameraPosition,
  cameraProjectionMatrix,
  cameraViewMatrix,
  cross,
  distance,
  exp,
  float,
  fwidth,
  length,
  max,
  mix,
  normalize,
  positionGeometry,
  positionView,
  screenSize,
  select,
  smoothstep,
  uniform,
  varying,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { NODE_CORE } from '@modules/networkTest';

export const STYLE_IDS = { dot: 0, halo: 1, ring: 2 };
const MIN_LINE_PX = 0.75;
const MIN_SPRITE_PX = 1.2;

export function createUniforms() {
  return {
    depthFade: uniform(0.5),
    depthFar: uniform(10),
    depthNear: uniform(0),
    nodeStyle: uniform(STYLE_IDS.halo),
    softness: uniform(0.7),
  };
}

// World units one output pixel spans at `p`, for either projection:
// projection[3][3] is 1 for an orthographic camera and 0 for a perspective.
const worldPerPixel = (p) =>
  mix(distance(p, cameraPosition), float(1), cameraProjectionMatrix[3][3])
    .mul(2)
    .div(cameraProjectionMatrix[1][1].mul(screenSize.y));

const depthFadeOf = (u) =>
  float(1).sub(
    u.depthFade.mul(
      smoothstep(u.depthNear, u.depthFar, positionView.z.negate())
    )
  );

function baseMaterial() {
  const material = new THREE.MeshBasicNodeMaterial();
  material.transparent = true;
  material.depthWrite = false;
  material.side = THREE.DoubleSide;
  material.toneMapped = false;
  return material;
}

// A camera-facing ribbon per segment: start+width, end, colour at each end.
// Thinner than a pixel, it is drawn a pixel wide and fainter instead, so
// fine wire neither shimmers nor vanishes.
export function createRibbonMaterial(u) {
  const start = attribute('aStart', 'vec4');
  const end = attribute('aEnd', 'vec4');
  const colorA = attribute('aColorA', 'vec4');
  const colorB = attribute('aColorB', 'vec4');
  const along = positionGeometry.x;
  const side = positionGeometry.y;
  const p = mix(start.xyz, end.xyz, along);
  const dir = normalize(end.xyz.sub(start.xyz).add(vec3(1e-6, 0, 0)));
  const across = normalize(
    cross(dir, cameraPosition.sub(p)).add(vec3(0, 1e-6, 0))
  );
  const half = start.w.mul(0.5);
  const drawn = max(half, worldPerPixel(p).mul(MIN_LINE_PX * 0.5));
  const thin = varying(half.div(drawn));

  const material = baseMaterial();
  material.positionNode = p.add(across.mul(drawn.mul(side)));
  const color = mix(colorA, colorB, along);
  const d = abs(side);
  const edge = float(1).sub(u.softness).sub(fwidth(d)).max(0);
  const shape = float(1).sub(smoothstep(edge, 1, d));
  material.colorNode = color.rgb;
  material.opacityNode = color.a.mul(shape).mul(thin).mul(depthFadeOf(u));
  return material;
}

// A camera-facing sprite per point: centre+radius, colour+alpha. The core is
// NODE_CORE of the radius (the plot draws that circle); halo spends the rest
// on a glow.
export function createSpriteMaterial(u, style) {
  const center = attribute('aCenter', 'vec4');
  const tint = attribute('aColor', 'vec4');
  const right = vec3(
    cameraViewMatrix[0].x,
    cameraViewMatrix[1].x,
    cameraViewMatrix[2].x
  );
  const up = vec3(
    cameraViewMatrix[0].y,
    cameraViewMatrix[1].y,
    cameraViewMatrix[2].y
  );
  const radius = center.w;
  const drawn = max(radius, worldPerPixel(center.xyz).mul(MIN_SPRITE_PX));
  const thin = varying(radius.div(drawn).pow(2));

  const material = baseMaterial();
  material.positionNode = center.xyz.add(
    right.mul(positionGeometry.x).add(up.mul(positionGeometry.y)).mul(drawn)
  );
  const r = length(positionGeometry.xy);
  const aa = fwidth(r);
  const disc = (edge) =>
    float(1).sub(smoothstep(float(edge).sub(aa), float(edge).add(aa), r));
  const core = disc(NODE_CORE);
  const halo = max(
    disc(NODE_CORE * 0.6),
    exp(r.mul(r).mul(-7))
      .mul(0.65)
      .mul(float(1).sub(smoothstep(0.85, 1, r)))
  );
  const ring = float(1).sub(
    smoothstep(
      float(0.07).sub(aa),
      float(0.07).add(aa),
      abs(r.sub(NODE_CORE - 0.07))
    )
  );
  const id = style ?? u.nodeStyle;
  const shape = select(
    id.equal(STYLE_IDS.halo),
    halo,
    select(id.equal(STYLE_IDS.ring), ring, core)
  );
  material.colorNode = tint.rgb;
  material.opacityNode = tint.a.mul(shape).mul(thin).mul(depthFadeOf(u));
  return material;
}
