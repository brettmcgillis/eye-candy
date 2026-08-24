import * as THREE from 'three';

export const FUR_TECHNIQUES = Object.freeze({
  shell: 'shell',
  strand: 'strand',
});

export const MAX_FUR_SHELLS = 24;
export const MAX_STATIC_STRANDS = 24000;
export const MAX_SKINNED_STRANDS = 100000;

export function unwrapRef(value) {
  if (
    value &&
    typeof value === 'object' &&
    Object.prototype.hasOwnProperty.call(value, 'current')
  ) {
    return value.current;
  }

  return value;
}

export function getFirstMaterial(material) {
  if (Array.isArray(material)) {
    return material[0] ?? null;
  }

  return material ?? null;
}

export function findFurSourceMesh(sourceMesh) {
  const resolved = unwrapRef(sourceMesh);

  if (!resolved) {
    return null;
  }

  if (resolved.isMesh || resolved.isSkinnedMesh) {
    return resolved;
  }

  let match = null;

  resolved.traverse?.((child) => {
    if (!match && (child.isMesh || child.isSkinnedMesh)) {
      match = child;
    }
  });

  return match;
}

export function resolveMaterialColor(material, fallback = '#ffffff') {
  const color = new THREE.Color(fallback);

  if (material?.color?.isColor) {
    color.copy(material.color);
    return color;
  }

  if (material?.color !== undefined) {
    color.set(material.color);
  }

  return color;
}

export function resolveMaterialMap(material) {
  return getFirstMaterial(material)?.map ?? null;
}

export function resolveGeometryRadius(geometry, fallback = 1) {
  if (!geometry) {
    return fallback;
  }

  if (!geometry.boundingSphere) {
    geometry.computeBoundingSphere();
  }

  const radius = geometry.boundingSphere?.radius;

  if (!Number.isFinite(radius) || radius <= 1e-6) {
    return fallback;
  }

  return radius;
}

export function normalizeWaveDirection(direction = [1, 0]) {
  const waveDirection = new THREE.Vector2(
    Number.isFinite(direction?.[0]) ? direction[0] : 1,
    Number.isFinite(direction?.[1]) ? direction[1] : 0
  );

  if (waveDirection.lengthSq() <= 1e-6) {
    waveDirection.set(1, 0);
  }

  return waveDirection.normalize();
}

export function copyObjectTransform(target, source) {
  if (!target || !source) {
    return;
  }

  target.position.copy(source.position);
  target.quaternion.copy(source.quaternion);
  target.scale.copy(source.scale);
}

export function createSeededRandom(seed = 1) {
  let state = Math.floor(seed) % 2147483647;

  if (state <= 0) {
    state += 2147483646;
  }

  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

export function createSolidColorTexture(colorValue = '#ffffff') {
  const color = new THREE.Color(colorValue);
  const data = new Uint8Array([
    Math.round(color.r * 255),
    Math.round(color.g * 255),
    Math.round(color.b * 255),
    255,
  ]);
  const texture = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);

  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;

  return texture;
}

export function clampShellCount(shellCount = 18) {
  return THREE.MathUtils.clamp(Math.round(shellCount), 1, MAX_FUR_SHELLS);
}

export function clampStrandCount(strandCount = 5000, isSkinnedMesh = false) {
  return THREE.MathUtils.clamp(
    Math.round(strandCount),
    1,
    isSkinnedMesh ? MAX_SKINNED_STRANDS : MAX_STATIC_STRANDS
  );
}
