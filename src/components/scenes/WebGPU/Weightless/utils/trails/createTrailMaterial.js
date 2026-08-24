import {
  attribute,
  float,
  mat4,
  positionGeometry,
  select,
  uint,
  uniform,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

// TSL port of three-sketches' FadeLineMaterial (GLSL ShaderMaterials can't
// run on the WebGPU renderer): opacity fades by vertex age. Adds a
// space-mode switch shared by all trail materials:
//   world (0): position attribute holds frozen world-space points
//              (CPU-skinned at push time) — trails smear as the bird moves.
//   ride  (1): position holds bind-pose points; each vertex is re-skinned
//              here against the live bone matrices — trails glue to the
//              flapping surface.

export function createSharedTrailUniforms() {
  return {
    currentSec: uniform(0),
    fadeSec: uniform(4),
    spaceMode: uniform(0),
  };
}

export default function createTrailMaterial({
  boneBuf,
  shared,
  color,
  opacity,
}) {
  const uniforms = {
    color: uniform(new THREE.Color(color)),
    opacity: uniform(opacity),
  };

  const material = new THREE.LineBasicNodeMaterial({
    transparent: true,
    depthWrite: false,
  });

  const boneMatrix = (index) => {
    const base = uint(index).mul(4);
    return mat4(
      boneBuf.element(base),
      boneBuf.element(base.add(1)),
      boneBuf.element(base.add(2)),
      boneBuf.element(base.add(3))
    );
  };

  const si = attribute('tSkinIndex', 'vec4');
  const sw = attribute('tSkinWeight', 'vec4');
  const p4 = vec4(positionGeometry, 1);
  const skinned = boneMatrix(si.x)
    .mul(p4)
    .mul(sw.x)
    .add(boneMatrix(si.y).mul(p4).mul(sw.y))
    .add(boneMatrix(si.z).mul(p4).mul(sw.z))
    .add(boneMatrix(si.w).mul(p4).mul(sw.w));

  material.positionNode = select(
    shared.spaceMode.greaterThan(0.5),
    skinned.xyz,
    positionGeometry
  );

  // Fade: alpha = opacity * max(0, fade - age) / fade — same curve as the
  // reference material. Unwritten vertices carry creationSec = -1e9 → 0.
  const age = shared.currentSec.sub(attribute('creationSec', 'float'));
  const fade = float(1).sub(age.div(shared.fadeSec)).clamp(0, 1);

  material.colorNode = uniforms.color;
  material.opacityNode = uniforms.opacity.mul(fade);

  return { material, uniforms };
}
