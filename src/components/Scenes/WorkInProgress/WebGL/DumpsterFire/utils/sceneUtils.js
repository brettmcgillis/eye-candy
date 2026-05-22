import * as THREE from 'three';

import {
  ASSET_GRID_COLUMNS,
  ASSET_GRID_COLUMN_SPACING,
  ASSET_GRID_OPTIONS,
  ASSET_GRID_ROW_SPACING,
  INSTANCED_TRASH_POOL_META,
  SHOT_AIM_PLANE_POINT,
  SHOT_BASE_VERTICAL_BOOST,
  SHOT_POINTER_VERTICAL_BOOST,
  SHOT_SPAWN_OFFSET,
  SHOT_SPEED,
  getRandomShotAsset,
} from './sceneData';

export function toScaleVector(scale = 1) {
  if (Array.isArray(scale)) {
    return new THREE.Vector3(scale[0], scale[1], scale[2]);
  }

  return new THREE.Vector3(scale, scale, scale);
}

export function buildTransformMatrix(transform = {}) {
  const position = new THREE.Vector3(...(transform.position ?? [0, 0, 0]));
  const rotation = new THREE.Euler(...(transform.rotation ?? [0, 0, 0]));
  const quaternion = new THREE.Quaternion().setFromEuler(rotation);
  const scale = toScaleVector(transform.scale ?? 1);

  return new THREE.Matrix4().compose(position, quaternion, scale);
}

export function bakeInstancedGeometry(geometry, transformChain = []) {
  const bakedGeometry = geometry.clone();
  const transformMatrix = new THREE.Matrix4();

  transformChain.forEach((transform) => {
    transformMatrix.multiply(buildTransformMatrix(transform));
  });

  bakedGeometry.applyMatrix4(transformMatrix);
  bakedGeometry.computeBoundingBox();
  bakedGeometry.computeBoundingSphere();

  return bakedGeometry;
}

export function getParkedShotPosition(assetKey, slotIndex) {
  const { assetIndex } = INSTANCED_TRASH_POOL_META[assetKey];

  return [220 + assetIndex * 14, -160 - slotIndex * 8, 0];
}

export function getSceneItemKey({ id, key, position = [0, 0, 0] }) {
  return id ?? `${key}-${position.join('-')}`;
}

export function formatAssetStat(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => formatAssetStat(entry)).join(' x ');
  }

  return Number(value)
    .toFixed(2)
    .replace(/\.00$/, '')
    .replace(/(\.\d)0$/, '$1');
}

export function getAssetComponentName(asset) {
  return asset.Component.displayName ?? asset.Component.name ?? asset.key;
}

export function getAssetShowcaseLabel(asset) {
  const lines = [getAssetComponentName(asset)];

  if (typeof asset.expectedSizeMeters === 'number') {
    lines.push(`expected: ${formatAssetStat(asset.expectedSizeMeters)} m`);
  }

  lines.push(`scale: ${formatAssetStat(asset.scale ?? 1)}`);

  if (typeof asset.mass === 'number') {
    lines.push(`mass: ${formatAssetStat(asset.mass)}`);
  }

  return lines.join('\n');
}

export function getAssetGridCellPosition(index) {
  const row = Math.floor(index / ASSET_GRID_COLUMNS);
  const column = index % ASSET_GRID_COLUMNS;
  const rowCount = Math.ceil(ASSET_GRID_OPTIONS.length / ASSET_GRID_COLUMNS);

  return [
    (column - (ASSET_GRID_COLUMNS - 1) / 2) * ASSET_GRID_COLUMN_SPACING,
    0,
    ((rowCount - 1) / 2 - row) * ASSET_GRID_ROW_SPACING,
  ];
}

export function getNormalizedPointerPosition(clientX, clientY, domElement) {
  const bounds = domElement.getBoundingClientRect();

  return new THREE.Vector2(
    ((clientX - bounds.left) / bounds.width) * 2 - 1,
    -(((clientY - bounds.top) / bounds.height) * 2 - 1)
  );
}

export function createTrashBlast(
  camera,
  pointerPosition = new THREE.Vector2(0, 0)
) {
  const raycaster = new THREE.Raycaster();
  const rayDirection = new THREE.Vector3();
  const shotDirection = new THREE.Vector3();
  const spawnPosition = new THREE.Vector3();
  const aimPlaneNormal = new THREE.Vector3();
  const aimPlanePoint = new THREE.Vector3(...SHOT_AIM_PLANE_POINT);
  const aimPlane = new THREE.Plane();
  const aimTarget = new THREE.Vector3();

  raycaster.setFromCamera(pointerPosition, camera);
  rayDirection.copy(raycaster.ray.direction).normalize();

  camera.getWorldDirection(aimPlaneNormal);
  aimPlane.setFromNormalAndCoplanarPoint(aimPlaneNormal, aimPlanePoint);

  spawnPosition
    .copy(camera.position)
    .addScaledVector(rayDirection, SHOT_SPAWN_OFFSET);
  spawnPosition.y -= 0.45;

  if (raycaster.ray.intersectPlane(aimPlane, aimTarget)) {
    shotDirection.copy(aimTarget).sub(spawnPosition).normalize();
  } else {
    shotDirection.copy(rayDirection);
  }

  const velocity = shotDirection.clone().multiplyScalar(SHOT_SPEED);
  velocity.y +=
    SHOT_BASE_VERTICAL_BOOST + pointerPosition.y * SHOT_POINTER_VERTICAL_BOOST;

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    asset: getRandomShotAsset(),
    position: [spawnPosition.x, spawnPosition.y, spawnPosition.z],
    rotation: [
      THREE.MathUtils.randFloatSpread(Math.PI),
      THREE.MathUtils.randFloatSpread(Math.PI),
      THREE.MathUtils.randFloatSpread(Math.PI),
    ],
    velocity: [velocity.x, velocity.y, velocity.z],
    spin: [
      THREE.MathUtils.randFloatSpread(6),
      THREE.MathUtils.randFloatSpread(12),
      THREE.MathUtils.randFloatSpread(6),
    ],
  };
}
