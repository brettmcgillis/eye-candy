import { BODY_TRACKING_MODE } from '../../../../../../hooks/pose/useMediaPipeBodyTracking';

// Hard ceiling on attractor slots in the sim (must match MlsMpmSimulator
// maxAttractors). The g2p kernel loops over every slot per particle, so this is
// a real GPU cost — keep it tight and let attractorBus evict by priority.
export const MAX_ATTRACTORS = 24;

// Pose-landmark indices we feed the field, in priority order: outline +
// skeleton. nose / shoulders / hips read as the "core" of the silhouette.
export const KEY_POSE_LANDMARKS = [
  0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28,
];
export const CORE_OUTLINE_LANDMARKS = new Set([0, 11, 12, 23, 24]);
export const SHOULDER_LANDMARKS = [11, 12];
export const HIP_LANDMARKS = [23, 24];
export const WRIST_LANDMARKS = [15, 16];
export const KEY_HAND_LANDMARKS = [0, 5, 9, 13, 17];
export const KEY_FACE_LANDMARKS = [1, 33, 61, 199, 263, 291];

export { BODY_TRACKING_MODE };

// MediaPipe world landmark → sim grid space (grid is 64³, centred on 32).
// Writes into `out` to avoid per-frame allocation. Returns `out`.
export function worldToGrid(landmark, controls, out) {
  out.set(
    landmark.x * controls.xScale + 32,
    landmark.y * controls.yScale + controls.yOffset,
    landmark.z * controls.zScale + controls.zOffset
  );
  return out;
}

// Holistic face landmarks use normalized image coords, so they map differently.
export function faceToGrid(landmark, controls, out) {
  out.set(
    (landmark.x - 0.5) * controls.xScale * 2 + 32,
    (0.5 - landmark.y) * Math.abs(controls.yScale) * 2 + controls.yOffset,
    landmark.z * controls.zScale * 40 + controls.zOffset
  );
  return out;
}

// "Both wrists above the nose" — toggles the global attract/repel polarity.
export function detectModeToggleGesture(results) {
  const landmarks = results?.landmarks?.[0];
  if (!landmarks?.length) return false;

  const nose = landmarks[0];
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];
  if (!nose || !leftWrist || !rightWrist) return false;

  return leftWrist.y < nose.y && rightWrist.y < nose.y;
}
