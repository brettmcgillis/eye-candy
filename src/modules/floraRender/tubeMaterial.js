import {
  Fn,
  PI,
  attribute,
  cos,
  cross,
  float,
  hash,
  instanceIndex,
  max,
  mix,
  normalize,
  positionGeometry,
  pow,
  sin,
  varyingProperty,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  growFraction,
  unravelGrowth,
  windOffset,
  worldPerPixel,
} from './motionNodes';
import { decodeOct, strandColor, toViewNormal } from './palette';

function tubeAttributes() {
  return {
    end: attribute('aEnd', 'vec4'),
    frameEnd: attribute('aFrameEnd', 'vec4'),
    frameStart: attribute('aFrameStart', 'vec4'),
    start: attribute('aStart', 'vec4'),
    time: attribute('aTime', 'vec4'),
    tone: attribute('aTone', 'vec4'),
  };
}

function stemnessOf(tone) {
  const code = tone.z.floor();

  return code
    .greaterThan(1.5)
    .select(float(1), code.greaterThan(0.5).select(float(0.7), float(0)));
}

function tubePosition(a, u, varyings, clampToPixels) {
  return Fn(() => {
    const along = positionGeometry.x;
    const angle = positionGeometry.y.mul(PI).mul(2);
    const rand = hash(instanceIndex.add(17));
    const growth = unravelGrowth(u);
    const g = growFraction(a.time.x, a.time.y, growth);
    const born = growth.greaterThanEqual(a.time.x).select(float(1), float(0));
    const p0 = a.start.xyz.add(windOffset(a.start.xyz, a.time.z, u));
    const tip = mix(a.start.xyz, a.end.xyz, g);
    const p1 = tip.add(windOffset(tip, mix(a.time.z, a.time.w, g), u));
    const center = mix(p0, p1, along);
    const frame = mix(a.frameStart, a.frameEnd, along);
    const t = decodeOct(frame.xy);
    const n = decodeOct(frame.zw);
    const b = cross(t, n);
    const thick = mix(a.start.w, a.end.w, along);
    const leaf = thick.lessThan(0).select(float(1), float(0));
    const fiber = mix(
      u.tipWidth,
      u.stemWidth,
      pow(max(thick, 0), u.thicknessCurve)
    );
    const blade = pow(thick.negate().max(0), 0.8)
      .mul(u.leafWidth)
      .add(u.tipWidth);
    let rx = mix(fiber, blade, leaf);
    let ry = rx.mul(mix(1, u.leafFlatness, leaf));

    if (clampToPixels) {
      const grow = max(
        worldPerPixel(center).mul(u.minPixels).mul(0.5).div(rx),
        1
      );

      rx = rx.mul(grow);
      ry = ry.mul(grow);
    }

    const shrink = born;
    const c = cos(angle);
    const s = sin(angle);

    varyings.normal.assign(normalize(n.mul(c).mul(ry).add(b.mul(s).mul(rx))));
    varyings.occlusion.assign(a.tone.z.fract());
    varyings.shade.assign(rand.mul(0.24).add(0.88));
    varyings.rand.assign(rand);

    return center.add(n.mul(c).mul(rx).add(b.mul(s).mul(ry)).mul(shrink));
  })();
}

export default function createTubeMaterial(u) {
  const material = new THREE.MeshStandardNodeMaterial();
  const a = tubeAttributes();
  const varyings = {
    normal: varyingProperty('vec3', 'vTubeNormal'),
    occlusion: varyingProperty('float', 'vTubeOcclusion'),
    rand: varyingProperty('float', 'vTubeRand'),
    shade: varyingProperty('float', 'vTubeShade'),
  };

  material.positionNode = tubePosition(a, u, varyings, true);
  material.castShadowPositionNode = tubePosition(a, u, varyings, false);
  material.colorNode = strandColor(
    a.tone,
    stemnessOf(a.tone),
    varyings.shade,
    varyings.rand,
    u
  );
  material.normalNode = toViewNormal(varyings.normal);
  material.roughnessNode = u.roughness;
  material.metalnessNode = float(0);
  material.aoNode = mix(1, varyings.occlusion, u.occlusion);

  return material;
}
