import * as THREE from 'three';

export const PATCH_RADIUS = 0.875;
export const PATCH_HEIGHT = 0.16;

export function createDomeGeometry({
  radius = PATCH_RADIUS,
  height = PATCH_HEIGHT,
  widthSegments = 64,
  heightSegments = 24,
} = {}) {
  const geometry = new THREE.SphereGeometry(
    radius,
    widthSegments,
    heightSegments,
    0,
    Math.PI * 2,
    0,
    Math.PI / 2
  );
  const positions = geometry.getAttribute('position');

  for (let index = 0; index < positions.count; index += 1) {
    const normalizedY = THREE.MathUtils.clamp(
      positions.getY(index) / radius,
      0,
      1
    );

    positions.setY(index, normalizedY * height);
  }

  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  return geometry;
}
