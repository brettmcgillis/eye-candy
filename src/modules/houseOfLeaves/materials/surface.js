import {
  abs,
  add,
  float,
  mix,
  normalWorld,
  positionWorld,
  smoothstep,
  texture,
  uniform,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

// Rotate about Y. Passing the sine negated gives the inverse rotation.
function rotY(v, c, s) {
  return vec3(v.x.mul(c).sub(v.z.mul(s)), v.y, v.x.mul(s).add(v.z.mul(c)));
}

// The architecture is swept procedurally and carries no UVs, so everything is
// projected triplanar from world space. That also keeps the texture at a
// constant scale down a tapering corridor and around the shaft, where UVs would
// stretch.
//
// World space is wrong for anything that moves, though: the texture stays put
// while the geometry slides through it, so a scrolling corridor or a screwing
// stair reads as stationary walls with the architecture gliding over them. The
// frame below undoes the moving group's transform before projecting, which
// pins the texture to the geometry and puts the motion back.
function surfaceFrame() {
  const offset = uniform(new THREE.Vector3());
  const spin = uniform(0);
  const c = spin.cos();
  const s = spin.sin();
  return {
    offset,
    spin,
    position: rotY(positionWorld.sub(offset), c, s),
    normal: rotY(normalWorld, c, s),
    toWorld: (v) => rotY(v, c, s.negate()),
  };
}

function blendWeights(normal, sharpness) {
  const n = abs(normal).pow(sharpness);
  const sum = add(n.x, n.y, n.z).max(0.0001);
  return n.div(sum);
}

function projections(position, scale) {
  const p = position.mul(scale);
  return [vec2(p.z, p.y), vec2(p.x, p.z), vec2(p.x, p.y)];
}

function triplanar(map, uvs, blend) {
  return texture(map, uvs[0])
    .mul(blend.x)
    .add(texture(map, uvs[1]).mul(blend.y))
    .add(texture(map, uvs[2]).mul(blend.z));
}

// Tiling is broken up by mixing a second, coarser sample at an offset. A single
// projection at one scale repeats visibly across a 70m room or a 30m shaft.
function triplanarDetiled(map, uvs, coarse, blend, amount) {
  const fine = triplanar(map, uvs, blend);
  const wide = triplanar(map, coarse, blend);
  return mix(fine, wide, amount);
}

// Triplanar normals have to be reoriented per axis *and* signed by which way
// the surface faces. Without the sign, a wall facing +Z and one facing -Z get
// tilted the same way, so one brightens and the other darkens and they read as
// different materials.
function triplanarNormal(map, frame, uvs, blend, strength) {
  const sign = frame.normal.sign();
  const nx = texture(map, uvs[0]).rgb.mul(2).sub(1);
  const ny = texture(map, uvs[1]).rgb.mul(2).sub(1);
  const nz = texture(map, uvs[2]).rgb.mul(2).sub(1);
  const wx = vec3(nx.z.mul(sign.x), nx.y, nx.x).normalize();
  const wy = vec3(ny.x, ny.z.mul(sign.y), ny.y).normalize();
  const wz = vec3(nz.x, nz.y, nz.z.mul(sign.z)).normalize();
  const blended = wx
    .mul(blend.x)
    .add(wy.mul(blend.y))
    .add(wz.mul(blend.z))
    .normalize();
  return frame.toWorld(mix(frame.normal, blended, strength).normalize());
}

export const SURFACE_DEFAULTS = {
  scale: 0.12,
  sharpness: 8,
  detile: 0.35,
  detileScale: 0.23,
  floorBlend: [0.55, 0.9],
  tint: '#ffffff',
};

// One material for a corridor or room: the floor set where a surface faces up,
// the wall set everywhere else. Doing it by facing rather than by splitting the
// geometry keeps the sweeps as single meshes.
export default function createSurfaceMaterial({
  wallMaps,
  floorMaps = null,
  options = {},
} = {}) {
  const o = { ...SURFACE_DEFAULTS, ...options };
  const scale = uniform(o.scale);
  const sharpness = uniform(o.sharpness);
  const tint = uniform(new THREE.Color(o.tint));

  const material = new THREE.MeshStandardNodeMaterial({
    metalness: 0,
    side: THREE.DoubleSide,
  });

  const frame = surfaceFrame();
  const weights = blendWeights(frame.normal, sharpness);
  const uvs = projections(frame.position, scale);
  const coarse = projections(frame.position, scale.mul(o.detileScale));
  const detile = uniform(o.detile);
  const upness = floorMaps
    ? smoothstep(float(o.floorBlend[0]), float(o.floorBlend[1]), frame.normal.y)
    : null;

  const pick = (key) => {
    const wall = triplanarDetiled(wallMaps[key], uvs, coarse, weights, detile);
    if (!floorMaps || !floorMaps[key]) return wall;
    const floor = triplanarDetiled(
      floorMaps[key],
      uvs,
      coarse,
      weights,
      detile
    );
    return mix(wall, floor, upness);
  };

  material.colorNode = pick('albedo').rgb.mul(tint);
  material.roughnessNode = pick('roughness').r;
  if (wallMaps.ao) {
    material.aoNode = pick('ao').r;
  }
  if (wallMaps.normal) {
    const strength = uniform(o.normalStrength ?? 0.85);
    material.normalNode = triplanarNormal(
      wallMaps.normal,
      frame,
      uvs,
      weights,
      strength
    );
  }

  material.userData.houseSurface = { scale, sharpness, tint, frame };
  return material;
}

// Drive this every frame with the transform of the group the mesh lives in, so
// the texture travels with the geometry instead of the geometry travelling
// through the texture.
export function setSurfaceFrame(material, { x = 0, y = 0, z = 0, spin = 0 }) {
  const surface = material?.userData?.houseSurface;
  if (!surface) return;
  surface.frame.offset.value.set(x, y, z);
  surface.frame.spin.value = spin;
}

export const SURFACE_SETS = {
  wall: '/textures/houseOfLeaves/wall',
  wood: '/textures/houseOfLeaves/wood',
  stone: '/textures/houseOfLeaves/stone',
};

export const SURFACE_MAPS = ['albedo', 'normal', 'roughness', 'ao'];
