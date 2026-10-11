import {
  attribute,
  cameraPosition,
  color,
  faceDirection,
  float,
  mix,
  modelWorldMatrix,
  positionGeometry,
  positionWorld,
  smoothstep,
  transformNormalToView,
  uniform,
  vec3,
  vec4,
  vertexIndex,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import eggIridescence from './iridescence';

// How much of the growth timeline a tube tip takes to round out.
const TIP = 0.03;

export function createTubeUniforms() {
  return {
    clearcoat: uniform(0.3),
    growth: uniform(2),
    metalness: uniform(0),
    roughness: uniform(0.42),
  };
}

// Vertex colours from the lane palette. Growth collapses every vertex not
// yet reached onto its centreline point, so a strand extrudes with a
// tapering tip rather than popping in ring by ring.
export function createTubeMaterial(uniforms) {
  const center = attribute('aCenter', 'vec4');
  const reveal = smoothstep(center.w, center.w.add(TIP), uniforms.growth);
  const material = new THREE.MeshPhysicalNodeMaterial();
  material.positionNode = mix(center.xyz, positionGeometry, reveal);
  material.colorNode = attribute('color', 'vec3');
  material.roughnessNode = uniforms.roughness;
  material.metalnessNode = uniforms.metalness;
  material.clearcoatNode = uniforms.clearcoat;
  material.clearcoatRoughnessNode = uniforms.roughness.mul(0.5);
  return material;
}

// 260421_CatenaryCanopy's two looks, foil and matte (its "Foil Material"
// toggle), as it sets them on its MeshPhysicalMaterial.
const FOIL = {
  clearcoat: 1,
  clearcoatRoughness: 0.24,
  color: 0xf1f5ff,
  eggIridescence: 1.05,
  eggIridescenceFrequency: 1.25,
  envMapIntensity: 1.9,
  iridescence: 0.72,
  iridescenceIOR: 1.22,
  iridescenceThicknessRange: [140, 460],
  metalness: 1,
  reflectivity: 1,
  roughness: 0.28,
  sheen: 0.1,
  sheenColor: 0xe7eeff,
  sheenRoughness: 0.5,
  specularIntensity: 1,
};
const MATTE = {
  clearcoat: 0,
  clearcoatRoughness: 0,
  color: 0xc2d5f2,
  eggIridescence: 0.42,
  eggIridescenceFrequency: 1.1,
  envMapIntensity: 0,
  iridescence: 0.18,
  iridescenceIOR: 1.22,
  iridescenceThicknessRange: [140, 460],
  metalness: 0.04,
  reflectivity: 0.18,
  roughness: 0.86,
  sheen: 0,
  sheenColor: 0xffffff,
  sheenRoughness: 1,
  specularIntensity: 0.22,
};
const FINISH_STYLES = { foil: FOIL, matte: MATTE, tintedFoil: FOIL };

// The membrane straight from its display grid: lane units (z up) to the
// tubes' centred grid units (y up), lit from both sides. `palette` dresses
// it like the tubes; the canopy finishes carry the reference's material,
// with `tintedFoil` laying the foil over the lane colours instead of white.
export function createMembraneMaterial(uniforms, display, gridSize, finish) {
  const half = gridSize / 2;
  const p = display.positions.element(vertexIndex);
  const n = display.normals.element(vertexIndex);
  const local = vec3(n.x, n.z, n.y);
  const material = new THREE.MeshPhysicalNodeMaterial({
    side: THREE.DoubleSide,
  });
  material.positionNode = vec3(p.x, p.z, p.y)
    .mul(display.pitch)
    .sub(vec3(half, 0, half));
  material.normalNode = transformNormalToView(local)
    .toVarying()
    .normalize()
    .mul(faceDirection);
  const lanes = attribute('color', 'vec3');
  const style = FINISH_STYLES[finish];
  if (!style) {
    material.colorNode = lanes;
    material.roughnessNode = uniforms.roughness;
    material.metalnessNode = uniforms.metalness;
    material.clearcoatNode = uniforms.clearcoat;
    material.clearcoatRoughnessNode = uniforms.roughness.mul(0.5);
    return material;
  }
  const r = style.reflectivity * 0.4;
  Object.assign(material, {
    clearcoat: style.clearcoat,
    clearcoatRoughness: style.clearcoatRoughness,
    envMapIntensity: style.envMapIntensity,
    ior: (1 + r) / (1 - r),
    iridescence: style.iridescence,
    iridescenceIOR: style.iridescenceIOR,
    iridescenceThicknessRange: [...style.iridescenceThicknessRange],
    metalness: style.metalness,
    roughness: style.roughness,
    sheen: style.sheen,
    sheenRoughness: style.sheenRoughness,
    specularIntensity: style.specularIntensity,
  });
  material.sheenColor.setHex(style.sheenColor);
  const base = finish === 'tintedFoil' ? lanes : color(style.color);
  const worldNormal = modelWorldMatrix
    .mul(vec4(local, 0))
    .xyz.normalize()
    .toVarying();
  material.colorNode = eggIridescence({
    base,
    eye: cameraPosition,
    frequency: float(style.eggIridescenceFrequency),
    normal: worldNormal.mul(faceDirection),
    position: positionWorld,
    strength: float(style.eggIridescence),
  });
  return material;
}

export function createFloorMaterial() {
  const tint = uniform(new THREE.Color('#ece7dc'));
  const material = new THREE.MeshStandardNodeMaterial({ roughness: 0.95 });
  material.colorNode = tint;
  return { color: tint, material };
}
