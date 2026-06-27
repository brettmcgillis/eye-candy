import * as THREE from 'three';

import { BODY_TRACKING_MODE } from '../../../../../../hooks/pose/useMediaPipeBodyTracking';

export const MAX_ATTRACTORS = 24;

const KEY_POSE_LANDMARKS = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
const KEY_HAND_LANDMARKS = [0, 5, 9, 13, 17];
const KEY_FACE_LANDMARKS = [1, 33, 61, 199, 263, 291];

export function buildAttractorsFromTracking(results, controls) {
  const worldGroups = results?.worldLandmarks ?? [];
  if (!worldGroups.length) return [];

  const attractors = [];
  for (let person = 0; person < worldGroups.length; person += 1) {
    const landmarks = worldGroups[person];
    if (!landmarks?.length) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const limit = Math.min(
      KEY_POSE_LANDMARKS.length,
      controls.landmarksPerPerson
    );
    for (let i = 0; i < limit; i += 1) {
      const landmark = landmarks[KEY_POSE_LANDMARKS[i]];
      if (!landmark) {
        // eslint-disable-next-line no-continue
        continue;
      }

      attractors.push({
        position: new THREE.Vector3(
          landmark.x * controls.xScale + 32,
          landmark.y * controls.yScale + controls.yOffset,
          landmark.z * controls.zScale + controls.zOffset
        ),
        strength: controls.baseStrength,
      });

      if (attractors.length >= MAX_ATTRACTORS) return attractors;
    }

    if (controls.trackingMode === BODY_TRACKING_MODE.holistic) {
      const leftHand = results?.leftHandWorldLandmarks?.[person] ?? [];
      const rightHand = results?.rightHandWorldLandmarks?.[person] ?? [];

      [leftHand, rightHand].forEach((hand) => {
        KEY_HAND_LANDMARKS.forEach((index) => {
          const landmark = hand[index];
          if (!landmark || attractors.length >= MAX_ATTRACTORS) return;

          attractors.push({
            position: new THREE.Vector3(
              landmark.x * controls.xScale + 32,
              landmark.y * controls.yScale + controls.yOffset,
              landmark.z * controls.zScale + controls.zOffset
            ),
            strength: controls.baseStrength * 1.1,
          });
        });
      });

      const faceLandmarks = results?.faceLandmarks?.[person] ?? [];
      KEY_FACE_LANDMARKS.forEach((index) => {
        const landmark = faceLandmarks[index];
        if (!landmark || attractors.length >= MAX_ATTRACTORS) return;

        attractors.push({
          position: new THREE.Vector3(
            (landmark.x - 0.5) * controls.xScale * 2 + 32,
            (0.5 - landmark.y) * Math.abs(controls.yScale) * 2 +
              controls.yOffset,
            landmark.z * controls.zScale * 40 + controls.zOffset
          ),
          strength: controls.baseStrength * 0.55,
        });
      });
    }
  }

  return attractors;
}

export function detectModeToggleGesture(results) {
  const landmarks = results?.landmarks?.[0];
  if (!landmarks?.length) return false;

  const nose = landmarks[0];
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];
  if (!nose || !leftWrist || !rightWrist) return false;

  return leftWrist.y < nose.y && rightWrist.y < nose.y;
}
