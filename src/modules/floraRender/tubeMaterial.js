import {
  Fn,
  PI,
  attribute,
  cameraPosition,
  cos,
  cross,
  float,
  hash,
  instanceIndex,
  max,
  mix,
  modelWorldMatrixInverse,
  normalize,
  positionGeometry,
  pow,
  sin,
  smoothstep,
  texture,
  varyingProperty,
  vec2,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  growFraction,
  unravelGrowth,
  windOffset,
  worldPerPixel,
} from './motionNodes';
import { decodeOct, strandColor, toViewNormal } from './palette';
import { paletteSample } from './paletteMap';

function tubeAttributes() {
  return {
    end: attribute('aEnd', 'vec4'),
    brush: attribute('aBrush', 'vec4'),
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
        worldPerPixel(center)
          .mul(
            u.painting.u.style
              .greaterThan(1.5)
              .select(u.minPixels.max(2), u.minPixels)
          )
          .mul(0.5)
          .div(rx),
        1
      );

      rx = rx.mul(grow);
      ry = ry.mul(grow);
    }

    const shrink = born;
    const c = cos(angle);
    const s = sin(angle);

    const surfaceNormal = normalize(n.mul(c).mul(ry).add(b.mul(s).mul(rx)));
    varyings.occlusion.assign(a.tone.z.fract());
    varyings.shade.assign(rand.mul(0.24).add(0.88));
    varyings.rand.assign(rand);
    varyings.brushU.assign(mix(a.brush.x, a.brush.y, along));
    varyings.brushSeed.assign(a.brush.z);

    const eye = modelWorldMatrixInverse.mul(vec4(cameraPosition, 1)).xyz;
    const side = normalize(cross(t, eye.sub(center)));
    const ribbon = side.mul(c).mul(rx).mul(1.4);
    const pencil = u.painting.u.style.greaterThan(1.5);
    varyings.across.assign(c.mul(0.5).add(0.5));
    varyings.normal.assign(
      pencil.select(normalize(cross(side, t)), surfaceNormal)
    );
    return center.add(
      pencil.select(ribbon, n.mul(c).mul(rx).add(b.mul(s).mul(ry))).mul(shrink)
    );
  })();
}

export default function createTubeMaterial(u) {
  const material = new THREE.MeshStandardNodeMaterial();
  const a = tubeAttributes();
  const varyings = {
    across: varyingProperty('float', 'vTubeAcross'),
    brushU: varyingProperty('float', 'vTubeBrushU'),
    brushSeed: varyingProperty('float', 'vTubeBrushSeed'),
    normal: varyingProperty('vec3', 'vTubeNormal'),
    occlusion: varyingProperty('float', 'vTubeOcclusion'),
    rand: varyingProperty('float', 'vTubeRand'),
    shade: varyingProperty('float', 'vTubeShade'),
  };

  material.positionNode = tubePosition(a, u, varyings, true);
  material.castShadowPositionNode = tubePosition(a, u, varyings, false);
  const authoredBase = strandColor(
    a.tone,
    stemnessOf(a.tone),
    varyings.shade,
    varyings.rand,
    u
  );
  const base = mix(
    authoredBase,
    paletteSample(u, a.tone.x).mul(varyings.shade),
    u.paletteOn
      .mul(stemnessOf(a.tone))
      .mul(u.painting.u.followPalette)
      .mul(u.painting.u.style.greaterThan(0.5).select(1, 0))
  );
  const seed = varyings.brushSeed;
  const point = vec2(varyings.brushU.mul(3), positionGeometry.y.mul(0.8));
  const wash = u.painting.treat(base, point, { seed, edge: float(0) });
  const mottled = mix(base, wash, 0.6);
  const penShift = sin(varyings.brushU.mul(7).add(varyings.brushSeed))
    .mul(u.painting.u.strokeRoughness)
    .mul(0.025);
  const stroke = texture(
    u.botanical,
    vec2(
      varyings.brushU.mul(0.85).add(0.075),
      varyings.across.add(penShift).mul(0.12).add(0.44)
    )
  ).a;
  const center = float(1).sub(
    smoothstep(0.06, 0.22, varyings.across.add(penShift).sub(0.5).abs())
  );
  const coverage = max(stroke.mul(5), center.mul(0.95)).clamp(0, 1);
  const sketch = mix(base, u.painting.inkFor(base), stroke.mul(2).clamp(0, 1));
  material.maskNode = u.painting.u.style
    .greaterThan(1.5)
    .select(coverage.greaterThan(0.01), true);
  material.opacityNode = u.painting.u.style
    .greaterThan(1.5)
    .select(coverage, 1);
  material.colorNode = u.painting.u.style
    .lessThan(0.5)
    .select(base, u.painting.u.style.greaterThan(1.5).select(sketch, mottled));
  material.emissiveNode = material.colorNode.mul(
    u.painting.u.style.greaterThan(0.5).select(0.5, 0)
  );
  material.normalNode = toViewNormal(varyings.normal);
  material.roughnessNode = u.roughness;
  material.metalnessNode = float(0);
  material.aoNode = mix(1, varyings.occlusion, u.occlusion);

  return material;
}
