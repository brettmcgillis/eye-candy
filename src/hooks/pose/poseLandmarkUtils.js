import * as THREE from 'three';

export const POSE_LANDMARK_NAMES = [
  'nose',
  'leftEyeInner',
  'leftEye',
  'leftEyeOuter',
  'rightEyeInner',
  'rightEye',
  'rightEyeOuter',
  'leftEar',
  'rightEar',
  'mouthLeft',
  'mouthRight',
  'leftShoulder',
  'rightShoulder',
  'leftElbow',
  'rightElbow',
  'leftWrist',
  'rightWrist',
  'leftPinky',
  'rightPinky',
  'leftIndex',
  'rightIndex',
  'leftThumb',
  'rightThumb',
  'leftHip',
  'rightHip',
  'leftKnee',
  'rightKnee',
  'leftAnkle',
  'rightAnkle',
  'leftHeel',
  'rightHeel',
  'leftFootIndex',
  'rightFootIndex',
];

export const POSE_CONNECTIONS = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 7],
  [0, 4],
  [4, 5],
  [5, 6],
  [6, 8],
  [9, 10],
  [11, 12],
  [11, 13],
  [13, 15],
  [15, 17],
  [15, 19],
  [15, 21],
  [17, 19],
  [12, 14],
  [14, 16],
  [16, 18],
  [16, 20],
  [16, 22],
  [18, 20],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [27, 29],
  [29, 31],
  [27, 31],
  [24, 26],
  [26, 28],
  [28, 30],
  [30, 32],
  [28, 32],
];

export function namePoseLandmarks(landmarks) {
  if (!landmarks?.length) return null;

  const named = {};

  POSE_LANDMARK_NAMES.forEach((name, index) => {
    named[name] = landmarks[index] ?? null;
  });

  return named;
}

export function averagePosePoints(points) {
  const validPoints = points.filter(Boolean);
  if (!validPoints.length) return null;

  const center = { x: 0, y: 0, z: 0 };

  validPoints.forEach((point) => {
    center.x += point.x;
    center.y += point.y;
    center.z += point.z;
  });

  center.x /= validPoints.length;
  center.y /= validPoints.length;
  center.z /= validPoints.length;

  return center;
}

export function mapPosePointToWorld(
  point,
  { xScale = 6, yScale = 4, zScale = 6, depthOffset = 0 } = {}
) {
  return new THREE.Vector3(
    (0.5 - point.x) * xScale,
    (0.5 - point.y) * yScale,
    -(point.z + depthOffset) * zScale
  );
}

export function mapPoseNormalizedOffsetToWorld(
  point,
  origin,
  { xScale = 6, yScale = 4, zScale = 6 } = {}
) {
  return new THREE.Vector3(
    (origin.x - point.x) * xScale,
    (origin.y - point.y) * yScale,
    -((point.z ?? 0) - (origin.z ?? 0)) * zScale
  );
}

export function mapPoseAnchorToWorld(
  point,
  { xScale = 6, yScale = 4, zScale = 6, depthOffset = 0 } = {}
) {
  return new THREE.Vector3(
    (0.5 - point.x) * xScale,
    (0.5 - point.y) * yScale,
    -depthOffset * zScale
  );
}

export function mapPoseWorldOffsetToWorld(
  point,
  { xScale = 6, yScale = 4, zScale = 6 } = {}
) {
  return new THREE.Vector3(
    -point.x * xScale,
    -point.y * yScale,
    -point.z * zScale
  );
}
