/* eslint-disable camelcase */
import {
  Fn,
  attribute,
  color,
  dot,
  float,
  min,
  mix,
  mx_noise_float,
  normalLocal,
  normalView,
  output,
  positionGeometry,
  positionLocal,
  pow,
  smoothstep,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { subjectWash } from '@modules/paintedRender';
import { MAX_ARROWS } from '@modules/rabbit';

import { EYE_ATTRIBUTE, FUR_ATTRIBUTE } from './furMask';

export const WOUND_SLOTS = MAX_ARROWS;

const FUR_WHITE = color('#f6f3ed');
const FUR_SHADE = color('#c2bdb6');
const SKIN_PINK = color('#e3a4a2');
const EYE_DARK = color('#121010');
const EYE_ROUGHNESS = 0.3;
const BLOOM_WASH = color('#d9838c');
const BLOOM_CORE = color('#9c2132');
const RIBBON = color('#ee8a8f');
const RIBBON_EDGE = color('#cf5661');

export function createWoundUniforms() {
  return {
    points: Array.from({ length: WOUND_SLOTS }, () =>
      uniform(new THREE.Vector4(0, -1e4, 0, 1))
    ),
    strength: uniform(1),
  };
}

// Fur only where the mesh's furDensity says skin (./furMask).
export function createFurDensity() {
  return attribute(FUR_ATTRIBUTE, 'float');
}

const eyeMask = () => attribute(EYE_ATTRIBUTE, 'float');

// The photographic hare texture repainted as the painting's white rabbit:
// luminance only survives as faint grey fur detail, pink skin stays pink,
// the eye pieces are black beads (their brown iris would read as fur). Wounds stain the rest-pose skin, so they ride it.
// Shared by the body and its shell fur.
export function createSkinColor(map, wounds, painting = null) {
  return Fn(() => {
    const sample = pow(texture(map, uv()).rgb, vec3(1 / 2.2));
    const lum = dot(sample, vec3(0.299, 0.587, 0.114));
    const fur = mix(FUR_SHADE, FUR_WHITE, smoothstep(0.08, 0.42, lum));
    const pink = smoothstep(0.1, 0.22, sample.r.sub(sample.g));
    const eye = smoothstep(0.13, 0.06, lum);
    const skin = mix(mix(fur, SKIN_PINK, pink.mul(0.85)), EYE_DARK, eye);

    const ragged = mx_noise_float(positionGeometry.mul(0.45))
      .mul(0.3)
      .add(mx_noise_float(positionGeometry.mul(1.6)).mul(0.12));
    const reach = float(1e4).toVar();
    wounds.points.forEach((point) => {
      reach.assign(
        min(reach, positionGeometry.sub(point.xyz).length().div(point.w))
      );
    });
    const d = reach.add(ragged);
    const wash = smoothstep(1, 0.55, d);
    const core = smoothstep(0.55, 0.05, d);
    const tide = smoothstep(0.75, 0.6, d).sub(smoothstep(0.6, 0.45, d));
    const stained = mix(
      mix(skin, BLOOM_WASH, wash.mul(0.75)),
      BLOOM_CORE,
      core.add(tide.mul(0.35)).clamp(0, 1)
    );
    const base = mix(skin, stained, wounds.strength);
    const coolWash = mix(
      color('#a1a0b8'),
      base,
      normalLocal.y.mul(0.5).add(0.5).clamp(0.3, 1)
    );
    let painted = painting
      ? painting.treat(
          painting.u.style
            .greaterThan(0.5)
            .select(painting.colorFor(coolWash, 1), base),
          uv().mul(3.5),
          { seed: float(1001), edge: float(0) }
        )
      : base;
    if (painting) {
      const pencil = painting
        .sample(uv().mul(16))
        .g.mul(0.1)
        .mul(painting.u.style.greaterThan(0.5).select(1, 0));
      painted = mix(painted, painting.inkFor(base), pencil);
    }
    return mix(painted, EYE_DARK, eyeMask());
  })();
}

export function createFurMaterial(original, wounds, painting = null) {
  const material = new THREE.MeshStandardNodeMaterial({
    metalness: 0,
    roughness: 0.92,
    side: THREE.DoubleSide,
  });
  const skin = createSkinColor(original.map, wounds);
  material.colorNode = vec4(skin, 1);
  if (painting) {
    const illustration = subjectWash(
      painting,
      skin,
      uv().mul(2.5),
      normalView,
      float(1001)
    );
    const painted = mix(illustration, output.rgb, eyeMask());
    material.outputNode = vec4(
      painting.u.style.greaterThan(0.5).select(painted, output.rgb),
      output.a
    );
  }
  material.roughnessNode = mix(float(0.92), float(EYE_ROUGHNESS), eyeMask());
  return material;
}

// Inverted hull: back faces only, pushed out along the normal by `width`
// (in the mesh's own units).
export function createOutlineMaterial({ color: ink, width, painting = null }) {
  const material = new THREE.MeshBasicNodeMaterial({
    polygonOffset: true,
    polygonOffsetFactor: 2,
    polygonOffsetUnits: 2,
    side: THREE.BackSide,
  });
  material.colorNode = painting
    ? painting.u.style
        .greaterThan(0.5)
        .and(painting.u.followPalette.greaterThan(0.5))
        .select(painting.inkFor(painting.colorFor(ink, 0)), ink)
    : ink;
  material.positionNode = positionLocal.add(normalLocal.toVar().mul(width));
  material.fog = false;
  return material;
}

// Satin: soft sheen, a little deeper at the edges where it turns. `uv.y`
// runs across the ribbon on both the hanging tail and the wrap.
export function createRibbonMaterial(painting = null) {
  const material = new THREE.MeshPhysicalNodeMaterial({
    roughness: 0.5,
    sheen: 0.3,
    sheenColor: new THREE.Color('#ffb0b4'),
    sheenRoughness: 0.35,
    side: THREE.DoubleSide,
  });
  const ribbonColor = mix(
    RIBBON,
    RIBBON_EDGE,
    smoothstep(0.32, 0.5, uv().y.sub(0.5).abs())
  );
  material.colorNode = ribbonColor;
  if (painting) {
    const deposit = painting.field(uv().mul(vec2(7, 2.5)), float(61)).r;
    const pigment = mix(
      color('#8e1631'),
      color('#cc5967'),
      deposit.mul(1.5).clamp(0, 1)
    );
    const fill = mix(
      color('#ecc3bd'),
      pigment,
      deposit.mul(1.5).add(0.25).clamp(0, 1)
    );
    const wobble = painting
      .grainAt(uv().mul(vec2(19, 3)), float(873))
      .sub(0.5)
      .mul(painting.u.strokeRoughness)
      .mul(0.04);
    const border = smoothstep(0.4, 0.49, uv().y.sub(0.5).abs().add(wobble));
    const graphite = painting.field(uv().mul(vec2(24, 3)), float(873)).g;
    const washed = painting.treat(
      painting.colorFor(color('#8e1631'), 2),
      uv().mul(vec2(2, 1)),
      { seed: float(61), boundary: uv().y.min(float(1).sub(uv().y)) }
    );
    const painted = mix(
      mix(painting.colorFor(fill, 2), washed, painting.u.bleed),
      painting.inkFor(painting.colorFor(fill, 2)),
      border.mul(graphite.mul(1.8).add(0.2).clamp(0, 0.8))
    );
    material.colorNode = painting.u.style
      .greaterThan(0.5)
      .select(painted, ribbonColor);
  }
  return material;
}
