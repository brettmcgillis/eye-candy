import * as THREE from 'three';

import {
  KEY_POSE_LANDMARKS,
  SHOULDER_LANDMARKS,
  WRIST_LANDMARKS,
  worldToGrid,
} from '../utils/trackingAttractors';
import { PRIORITY } from './attractorBus';

const POSE_COUNT = 33;
const ENERGY_EMA = 0.3;

function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

// Motion → sim, stillness as the reward (WS2). Body velocity is the expressive
// input: thrashing scatters and brightens the cloud (noise/speed up, cohesion
// down); going still lets the apparition crystallize. Asymmetric smoothing makes
// resolution feel earned — fast to agitate, slow to calm. Also produces per-hand
// impulse "comet" leads and an arms-up → levitation gravity delta.
export default function createMotionEnergy() {
  const prev = []; // prev[person] = Float32Array(POSE_COUNT * 3), world coords
  const valid = []; // valid[person] = bool
  const gravity = new THREE.Vector3();
  const configDelta = {
    gravity,
    noise: 0,
    speed: 0,
    restDensity: 0,
    stiffness: 0,
  };
  const impulsePool = [];
  const impulses = [];
  let impulseUsed = 0;
  const vScratch = new THREE.Vector3();

  let agitate = 0; // 0..1 smoothed agitation
  let bodyEnergy = 0; // smoothed mean landmark speed
  let comHeight = 0.5; // normalized 0 (low) .. 1 (high)

  function takeImpulse() {
    let a = impulsePool[impulseUsed];
    if (!a) {
      a = {
        position: new THREE.Vector3(),
        strength: 0,
        radius: 8,
        hue: -1,
        priority: PRIORITY.handImpulse,
      };
      impulsePool[impulseUsed] = a;
    }
    impulseUsed += 1;
    return a;
  }

  function update(tracking, dt, controls, options) {
    impulses.length = 0;
    impulseUsed = 0;

    const dtSafe = Math.max(dt, 1e-3);
    const worldGroups = tracking?.worldLandmarks ?? [];
    const imageGroups = tracking?.landmarks ?? [];
    const { gain = 1 } = options;

    let energyAccum = 0;
    let energyCount = 0;
    let comAccum = 0;
    let comCount = 0;
    let armRaiseAccum = 0;
    let armRaiseCount = 0;

    for (let person = 0; person < worldGroups.length; person += 1) {
      const landmarks = worldGroups[person];
      if (!landmarks?.length) {
        // eslint-disable-next-line no-continue
        continue;
      }

      let buffer = prev[person];
      if (!buffer) {
        buffer = new Float32Array(POSE_COUNT * 3);
        prev[person] = buffer;
        valid[person] = false;
      }
      const hadPrev = valid[person];

      const emitImpulse = hadPrev && controls.impulseGain > 0.001;

      // Per-landmark velocity → aggregate energy (and wrist comet impulses).
      // Velocity is read against the previous frame BEFORE the buffer is
      // overwritten, so wrists in the KEY set get a correct delta.
      for (let i = 0; i < KEY_POSE_LANDMARKS.length; i += 1) {
        const index = KEY_POSE_LANDMARKS[i];
        const landmark = landmarks[index];
        if (!landmark) {
          // eslint-disable-next-line no-continue
          continue;
        }
        const o = index * 3;
        if (hadPrev) {
          const dx = landmark.x - buffer[o];
          const dy = landmark.y - buffer[o + 1];
          const dz = landmark.z - buffer[o + 2];
          const speed = Math.sqrt(dx * dx + dy * dy + dz * dz) / dtSafe;
          energyAccum += speed;
          energyCount += 1;

          if (
            emitImpulse &&
            WRIST_LANDMARKS.includes(index) &&
            speed >= controls.impulseThreshold
          ) {
            const a = takeImpulse();
            worldToGrid(landmark, controls, a.position);
            // Lead the motion: offset ahead along grid-space velocity.
            vScratch.set(
              dx * controls.xScale,
              dy * controls.yScale,
              dz * controls.zScale
            );
            if (vScratch.lengthSq() > 1e-6) {
              vScratch.normalize().multiplyScalar(controls.impulseLead);
              a.position.add(vScratch);
            }
            a.strength =
              Math.min(speed * controls.impulseGain, controls.impulseMax) *
              gain;
            a.radius = controls.attractorRadius;
            a.hue = controls.perPersonHue
              ? (controls.hueBase + person * (controls.hueSpread ?? 0.18)) % 1
              : -1;
            impulses.push(a);
          }
        }
        buffer[o] = landmark.x;
        buffer[o + 1] = landmark.y;
        buffer[o + 2] = landmark.z;
      }
      valid[person] = true;

      // Centre-of-mass height + arm raise from normalized image coords.
      const image = imageGroups[person];
      if (image?.length) {
        let cy = 0;
        let cn = 0;
        SHOULDER_LANDMARKS.forEach((index) => {
          const lm = image[index];
          if (!lm) return;
          cy += lm.y;
          cn += 1;
        });
        if (cn > 0) {
          comAccum += 1 - cy / cn; // image y=0 is top → invert so up = high
          comCount += 1;
          const shoulderY = cy / cn;
          let wy = 0;
          let wn = 0;
          WRIST_LANDMARKS.forEach((index) => {
            const lm = image[index];
            if (!lm) return;
            wy += lm.y;
            wn += 1;
          });
          if (wn > 0) {
            // shoulderY - wristY > 0 when wrists are above shoulders.
            armRaiseAccum += shoulderY - wy / wn;
            armRaiseCount += 1;
          }
        }
      }
    }

    // Forget people who dropped out so stale prev frames don't fling impulses.
    for (let person = worldGroups.length; person < valid.length; person += 1) {
      valid[person] = false;
    }

    const rawEnergy = energyCount > 0 ? energyAccum / energyCount : 0;
    bodyEnergy += (rawEnergy - bodyEnergy) * ENERGY_EMA;
    if (comCount > 0) comHeight += (comAccum / comCount - comHeight) * 0.2;

    const target = clamp01(bodyEnergy * controls.motionSensitivity) * gain;
    const rate = target > agitate ? controls.agitateRate : controls.calmRate;
    agitate += (target - agitate) * clamp01(rate * dtSafe);

    configDelta.noise = agitate * controls.motionToNoise;
    configDelta.speed = agitate * controls.motionToSpeed;
    configDelta.restDensity = -agitate * controls.motionToCohesion;
    configDelta.stiffness = -agitate * controls.motionToCohesion * 2;

    const armRaise = armRaiseCount > 0 ? armRaiseAccum / armRaiseCount : 0;
    gravity.set(0, armRaise * controls.armsToGravity * gain, 0);

    return configDelta;
  }

  function getMusicInputs() {
    return { bodyEnergy, agitate, comHeight };
  }

  return { update, getMusicInputs, impulses };
}
