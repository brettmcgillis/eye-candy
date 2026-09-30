import {
  Fn,
  attribute,
  cos,
  cross,
  positionGeometry,
  positionWorld,
  sin,
  smoothstep,
  uniform,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

// orthBas(vec3(-1, 3, 4)) from the rect reference, doubled; `p *= m` in GLSL
// is p·m, so each output axis is a dot with one basis column.
const NOISE_BASIS = [
  [0.9701425, 0, 0.2425356],
  [0.1426954, 0.8086075, -0.5707818],
  [-0.1961161, 0.5883484, 0.7844645],
].map((column) => vec3(...column.map((c) => c * 2)));

export const cyclicNoise = Fn(([point, pump]) => {
  const p = vec3(point).toVar();
  const sum = vec4(0).toVar();
  for (let i = 0; i < 6; i += 1) {
    p.assign(vec3(...NOISE_BASIS.map((column) => p.dot(column))));
    p.addAssign(sin(p.yzx));
    sum.assign(sum.mul(pump).add(vec4(cross(sin(p.zxy), cos(p)), 1)));
  }
  return sum.xyz.div(sum.w);
});

const placed = () => {
  const center = attribute('aCenter', 'vec4');
  const half = attribute('aHalf', 'vec4');
  return positionGeometry.mul(half.xyz).add(center.xyz);
};

// Per instance: aColor = albedo + roughness, aEmissive = emission + noise
// amount. Dark cells vary with the reference's cyclic noise.
export function createCellMaterial() {
  const surface = attribute('aColor', 'vec4');
  const glow = attribute('aEmissive', 'vec4');
  const grain = smoothstep(-0.2, 0.7, cyclicNoise(positionWorld, 2).y).mul(
    glow.w
  );
  const material = new THREE.MeshStandardNodeMaterial({ metalness: 0 });
  material.positionNode = placed();
  material.colorNode = surface.rgb.mul(grain.mul(0.4).add(1));
  material.roughnessNode = surface.w.add(grain.mul(0.08)).clamp(0.02, 1);
  material.emissiveNode = glow.rgb;
  return material;
}

export function createGlassUniforms() {
  return { dispersion: uniform(5), ior: uniform(1.4) };
}

// Transmission through one layer: the octree reference refracts through
// every cube it meets, a raster pass sees the opaque frame behind the glass.
export function createGlassMaterial(uniforms) {
  const tint = attribute('aTint', 'vec4');
  const half = attribute('aHalf', 'vec4');
  const material = new THREE.MeshPhysicalNodeMaterial({
    metalness: 0,
    transmission: 1,
  });
  material.dispersionNode = uniforms.dispersion;
  material.positionNode = placed();
  material.colorNode = tint.rgb;
  material.roughnessNode = tint.w;
  material.iorNode = uniforms.ior;
  material.thicknessNode = half.x.mul(2);
  return material;
}

export function createFrameUniforms() {
  return {
    color: uniform(new THREE.Color('#dacb59')),
    metalness: uniform(1),
    roughness: uniform(0.1),
  };
}

export function createFrameMaterial(uniforms) {
  const center = attribute('aCenter', 'vec4');
  const half = attribute('aHalf', 'vec4');
  const offset = attribute('aOffset', 'vec3');
  const material = new THREE.MeshStandardNodeMaterial();
  material.positionNode = positionGeometry
    .mul(half.xyz)
    .add(offset.mul(half.w))
    .add(center.xyz);
  material.colorNode = uniforms.color;
  material.metalnessNode = uniforms.metalness;
  material.roughnessNode = uniforms.roughness;
  return material;
}

export function createFloorUniforms() {
  return {
    color: uniform(new THREE.Color('#bc3939')),
    roughness: uniform(0.15),
  };
}

export function createFloorMaterial(uniforms) {
  const material = new THREE.MeshStandardNodeMaterial({ metalness: 0 });
  material.colorNode = uniforms.color;
  material.roughnessNode = uniforms.roughness;
  return material;
}
