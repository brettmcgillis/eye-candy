import * as THREE from 'three';

import {
  BODY_TRACKING_MODE,
  CORE_OUTLINE_LANDMARKS,
  HIP_LANDMARKS,
  KEY_FACE_LANDMARKS,
  KEY_HAND_LANDMARKS,
  KEY_POSE_LANDMARKS,
  SHOULDER_LANDMARKS,
  faceToGrid,
  worldToGrid,
} from '../utils/trackingAttractors';
import { PRIORITY } from './attractorBus';

function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// MediaPipe → signed body field (WS1). The body does two opposite things at
// once: attract along the outline/skeleton, repel from a derived core point, so
// particles trace your silhouette while the torso hollows out — you read as a
// glowing outline, not a blob.
//
// `fieldBlend` ∈ [-1, 1] drives fieldMode:
//   +1 = positive (form you), -1 = negative (carve a void), 0..auto in between.
// `gain` ramps the whole field for presence envelopes.
// Per-person hue (optional) gives each viewer a colour they "own"; fields from
// nearby people naturally bridge as particles blend the two hues.
export default function createViewerSource() {
  const pool = [];
  const out = [];
  let used = 0;
  const scratch = new THREE.Vector3();

  function take(priority) {
    let a = pool[used];
    if (!a) {
      a = {
        position: new THREE.Vector3(),
        strength: 0,
        radius: 8,
        hue: -1,
        priority: 0,
      };
      pool[used] = a;
    }
    used += 1;
    a.priority = priority;
    return a;
  }

  function personHue(person, controls) {
    if (!controls.perPersonHue) return -1;
    const spread = controls.hueSpread ?? 0.18;
    return (controls.hueBase + person * spread) % 1;
  }

  function build(tracking, controls, options) {
    out.length = 0;
    used = 0;

    const worldGroups = tracking?.worldLandmarks ?? [];
    if (!worldGroups.length) return out;

    const { gain = 1, fieldBlend = 1 } = options;
    if (gain <= 0.001) return out;

    const posWeight = clamp01((fieldBlend + 1) / 2);
    // Positive: outline attracts, core repels. Negative: outline mildly repels
    // (body carves a hole in a dense field), core off.
    const outlineCoeff =
      lerp(
        -0.6 * controls.outlineStrength,
        controls.outlineStrength,
        posWeight
      ) * gain;
    const coreCoeff = lerp(0, -controls.coreRepelStrength, posWeight) * gain;

    const poseLimit = Math.min(
      KEY_POSE_LANDMARKS.length,
      controls.landmarksPerPerson
    );

    for (let person = 0; person < worldGroups.length; person += 1) {
      const landmarks = worldGroups[person];
      if (!landmarks?.length) {
        // eslint-disable-next-line no-continue
        continue;
      }
      const hue = personHue(person, controls);

      for (let i = 0; i < poseLimit; i += 1) {
        const index = KEY_POSE_LANDMARKS[i];
        const landmark = landmarks[index];
        if (!landmark) {
          // eslint-disable-next-line no-continue
          continue;
        }
        const a = take(
          CORE_OUTLINE_LANDMARKS.has(index)
            ? PRIORITY.outlineCore
            : PRIORITY.outlineLimb
        );
        worldToGrid(landmark, controls, a.position);
        a.strength = outlineCoeff;
        a.radius = controls.attractorRadius;
        a.hue = hue;
        out.push(a);
      }

      // Derived core-repel point at centre of mass (avg shoulders + hips).
      if (Math.abs(coreCoeff) > 0.001) {
        let cx = 0;
        let cy = 0;
        let cz = 0;
        let n = 0;
        [...SHOULDER_LANDMARKS, ...HIP_LANDMARKS].forEach((index) => {
          const landmark = landmarks[index];
          if (!landmark) return;
          worldToGrid(landmark, controls, scratch);
          cx += scratch.x;
          cy += scratch.y;
          cz += scratch.z;
          n += 1;
        });
        if (n > 0) {
          const a = take(PRIORITY.coreRepel);
          a.position.set(cx / n, cy / n, cz / n);
          a.strength = coreCoeff;
          a.radius = controls.coreRepelRadius;
          a.hue = -1;
          out.push(a);
        }
      }

      if (controls.trackingMode === BODY_TRACKING_MODE.holistic) {
        const leftHand = tracking?.leftHandWorldLandmarks?.[person] ?? [];
        const rightHand = tracking?.rightHandWorldLandmarks?.[person] ?? [];
        [leftHand, rightHand].forEach((hand) => {
          KEY_HAND_LANDMARKS.forEach((index) => {
            const landmark = hand[index];
            if (!landmark) return;
            const a = take(PRIORITY.hand);
            worldToGrid(landmark, controls, a.position);
            a.strength = outlineCoeff * 1.1;
            a.radius = controls.attractorRadius;
            a.hue = hue;
            out.push(a);
          });
        });

        const faceLandmarks = tracking?.faceLandmarks?.[person] ?? [];
        KEY_FACE_LANDMARKS.forEach((index) => {
          const landmark = faceLandmarks[index];
          if (!landmark) return;
          const a = take(PRIORITY.face);
          faceToGrid(landmark, controls, a.position);
          a.strength = outlineCoeff * 0.55;
          a.radius = controls.attractorRadius;
          a.hue = hue;
          out.push(a);
        });
      }
    }

    return out;
  }

  return { build };
}
