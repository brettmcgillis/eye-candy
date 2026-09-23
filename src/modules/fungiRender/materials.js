import {
  Fn,
  PI,
  abs,
  attribute,
  cameraPosition,
  cameraProjectionMatrix,
  cameraViewMatrix,
  clamp,
  cos,
  cross,
  float,
  max,
  min,
  mix,
  modelNormalMatrix,
  modelWorldMatrix,
  normalGeometry,
  normalize,
  positionGeometry,
  pow,
  screenSize,
  sin,
  smoothstep,
  time,
  uniform,
  varyingProperty,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

const STOPS = 5;

export function createUniforms() {
  return {
    exit: uniform(0),
    glow: uniform(0),
    grow: uniform(1),
    minPixels: uniform(0.9),
    occlusion: uniform(0.85),
    rot: uniform(0),
    rotColor: uniform(new THREE.Color('#5a3a28')),
    roughness: uniform(0.55),
    spore: uniform(0),
    sporeAmount: uniform(1),
    sporeColor: uniform(new THREE.Color('#f0e6d0')),
    sporeFall: uniform(4),
    stagger: uniform(0),
    stops: Array.from({ length: STOPS }, () => uniform(new THREE.Color())),
  };
}

function gradient(u, t) {
  const x = clamp(t, 0, 1).mul(STOPS - 1);
  let color = u.stops[0];

  for (let k = 1; k < STOPS; k += 1) {
    color = mix(color, u.stops[k], clamp(x.sub(k - 1), 0, 1));
  }

  return color;
}

function decodeOct(e) {
  const z = abs(e.x).add(abs(e.y)).oneMinus();
  const t = max(z.negate(), 0);
  const x = e.x.add(e.x.greaterThanEqual(0).select(t.negate(), t));
  const y = e.y.add(e.y.greaterThanEqual(0).select(t.negate(), t));

  return normalize(vec3(x, y, z));
}

function toViewNormal(localNormal) {
  return normalize(
    cameraViewMatrix.mul(vec4(modelNormalMatrix.mul(localNormal), 0)).xyz
  );
}

function worldPerPixel(p) {
  const world = modelWorldMatrix.mul(vec4(p, 1)).xyz;
  const distance = world.sub(cameraPosition).length();

  return distance.mul(2).div(cameraProjectionMatrix[1][1].mul(screenSize.y));
}

function memberLevels(u, delay) {
  const grow = clamp(u.grow.sub(delay.mul(u.stagger)), 0, 1);
  const rot = clamp(u.rot.sub(delay.mul(u.stagger).mul(0.5)), 0, 1);

  return { effective: min(grow, u.exit.oneMinus()), rot };
}

function tubePosition(a, u, v, clampToPixels) {
  return Fn(() => {
    const along = positionGeometry.x;
    const angle = positionGeometry.y.mul(PI).mul(2);
    const { effective, rot } = memberLevels(u, a.meta.x);
    const g = clamp(
      effective.sub(a.time.x).div(max(a.time.y.sub(a.time.x), 1e-4)),
      0,
      1
    );
    const born = effective.greaterThan(a.time.x).select(float(1), float(0));
    const droop = pow(rot, 1.6);
    const s0 = a.start.xyz.sub(vec3(0, a.tone.z.mul(droop), 0));
    const e1 = a.end.xyz.sub(vec3(0, a.tone.w.mul(droop), 0));
    const tip = mix(s0, e1, g);
    const center = mix(s0, tip, along);
    const frame = mix(a.frameStart, a.frameEnd, along);
    const t = decodeOct(frame.xy);
    const n = decodeOct(frame.zw);
    const b = cross(t, n);
    const shrink = born.mul(rot.mul(0.35).oneMinus());
    let thin = mix(a.start.w, a.end.w, along);

    if (clampToPixels) {
      thin = max(thin, worldPerPixel(center).mul(u.minPixels).mul(0.5));
    }

    const wide = max(
      mix(a.start.w, a.end.w, along).mul(mix(a.time.z, a.time.w, along)),
      thin
    );
    const c = cos(angle);
    const s = sin(angle);

    v.normal.assign(normalize(n.mul(c).mul(thin).add(b.mul(s).mul(wide))));
    v.color.assign(mix(a.tone.x, a.tone.y, along));
    v.rot.assign(rot);

    return center.add(n.mul(c).mul(wide).add(b.mul(s).mul(thin)).mul(shrink));
  })();
}

function surfaceColor(u, colorT, rand, shade, rot) {
  const base = gradient(u, colorT).mul(shade).mul(rand.mul(0.12).add(0.94));

  return mix(base, u.rotColor, rot.mul(rand.mul(0.5).add(0.5)));
}

function glowNode(u, color, weight, rand) {
  const pulse = sin(time.mul(1.3).add(rand.mul(6.28)))
    .mul(0.25)
    .add(0.75);

  return color.mul(u.glow).mul(weight).mul(pulse).mul(2.4);
}

export function createTubeMaterial(u) {
  const material = new THREE.MeshStandardNodeMaterial();
  const a = {
    end: attribute('aEnd', 'vec4'),
    frameEnd: attribute('aFrameEnd', 'vec4'),
    frameStart: attribute('aFrameStart', 'vec4'),
    meta: attribute('aMeta', 'vec4'),
    start: attribute('aStart', 'vec4'),
    time: attribute('aTime', 'vec4'),
    tone: attribute('aTone', 'vec4'),
  };
  const v = {
    color: varyingProperty('float', 'vFiberColor'),
    normal: varyingProperty('vec3', 'vFiberNormal'),
    rot: varyingProperty('float', 'vFiberRot'),
  };
  const occlusion = a.meta.w.floor().div(255);
  const shade = a.meta.w.fract().mul(2);
  const color = surfaceColor(u, v.color, a.meta.z, shade, v.rot);

  material.positionNode = tubePosition(a, u, v, true);
  material.castShadowPositionNode = tubePosition(a, u, v, false);
  material.colorNode = color;
  material.emissiveNode = glowNode(u, color, a.meta.y, a.meta.z);
  material.normalNode = toViewNormal(v.normal);
  material.roughnessNode = u.roughness;
  material.metalnessNode = float(0);
  material.aoNode = mix(1, occlusion, u.occlusion);

  return material;
}

export function createBeadMaterial(u) {
  const material = new THREE.MeshStandardNodeMaterial();
  const pos = attribute('bPos', 'vec4');
  const info = attribute('bInfo', 'vec4');
  const extra = attribute('bExtra', 'vec4');
  const rand = info.w;
  const spore = extra.x.greaterThan(0.5).select(float(1), float(0));
  const vRot = varyingProperty('float', 'vBeadRot');
  const vSpore = varyingProperty('float', 'vBeadSpore');

  const position = Fn(() => {
    const { effective, rot } = memberLevels(u, info.z);
    const grown = smoothstep(info.x, info.x.add(0.04), effective);
    const local = clamp(u.spore.mul(1.5).sub(rand.mul(0.5)), 0, 1);
    const held = extra.x.greaterThan(1.5).select(float(1), float(0));
    const falling = smoothstep(0.75, 1, local).oneMinus();
    const drifting = local
      .greaterThan(0)
      .select(float(1), float(0))
      .mul(falling)
      .mul(rand.lessThan(u.sporeAmount.div(3)).select(float(1), float(0)));
    const alive = mix(drifting, grown.mul(falling), held);
    const drift = vec3(
      sin(rand.mul(53).add(local.mul(5))),
      float(0),
      cos(rand.mul(31).add(local.mul(4)))
    ).mul(local.mul(u.sporeFall).mul(0.18));
    const fall = vec3(0, local.mul(local).mul(u.sporeFall).negate(), 0);
    const sporeOffset = drift.add(fall);
    const droop = vec3(0, extra.y.mul(pow(rot, 1.6)).negate(), 0);
    const scale = mix(grown.mul(rot.mul(0.3).oneMinus()), alive, spore).mul(
      pos.w
    );
    const center = pos.xyz.add(droop).add(sporeOffset.mul(spore));

    vRot.assign(rot);
    vSpore.assign(spore.mul(held.oneMinus()));

    return center.add(positionGeometry.mul(scale));
  })();

  const color = mix(
    surfaceColor(u, info.y, rand, float(1), vRot),
    u.sporeColor,
    vSpore
  );

  material.positionNode = position;
  material.normalNode = toViewNormal(normalGeometry);
  material.colorNode = color;
  material.emissiveNode = glowNode(
    u,
    color,
    mix(float(0.6), float(1.2), vSpore),
    rand
  );
  material.roughnessNode = u.roughness.mul(0.7);
  material.metalnessNode = float(0);

  return material;
}

export function createSurfaceMaterial(u) {
  const material = new THREE.MeshStandardNodeMaterial({
    side: THREE.DoubleSide,
  });
  const pos = attribute('sPosition', 'vec4');
  const nrm = attribute('sNormal', 'vec4');
  const meta = attribute('sMeta', 'vec4');
  const vRot = varyingProperty('float', 'vSurfaceRot');
  const vBorn = varyingProperty('float', 'vSurfaceBorn');
  const levels = memberLevels(u, meta.x);

  material.positionNode = Fn(() => {
    vRot.assign(levels.rot);
    vBorn.assign(
      levels.effective.greaterThan(pos.w).select(float(1), float(0))
    );

    return pos.xyz.sub(vec3(0, meta.y.mul(pow(levels.rot, 1.6)), 0));
  })();

  const color = surfaceColor(u, nrm.w, float(0.5), float(1), vRot);

  material.maskNode = vBorn.greaterThan(0.5);
  material.normalNode = toViewNormal(nrm.xyz);
  material.colorNode = color;
  material.emissiveNode = glowNode(u, color, meta.z, float(0.5));
  material.roughnessNode = u.roughness;
  material.metalnessNode = float(0);
  material.aoNode = mix(1, meta.w, u.occlusion);

  return material;
}
