import * as THREE from 'three/webgpu';

import { BEACONS, HEADLIGHTS } from './cruiser';

const TILT = -0.16;

// The light bar's four rotating beams: each beacon spins a red and a blue
// reflector back to back, the second beacon the other way and a quarter
// turn out of phase.
export const SIREN_BEAMS = BEACONS.flatMap((at, beacon) =>
  ['sirenRed', 'sirenBlue'].map((colorKey, side) => ({
    at,
    colorKey,
    phase: beacon * (Math.PI / 2) + side * Math.PI,
    spin: beacon === 0 ? 1 : -1,
  }))
);

export function sirenDirection(beam, time, speed, out) {
  const angle = beam.spin * time * speed * Math.PI * 2 + beam.phase;
  return out.set(Math.cos(angle), TILT, Math.sin(angle)).normalize();
}

// The alarm flashing the headlamps: on for `duty` of each period, with the
// quick rise and slower fall of a filament rather than a hard switch.
export function alarmLevel(time, rate, duty = 0.55) {
  if (rate <= 0) return 1;
  const period = 1 / rate;
  const into = time % period;
  const onFor = period * duty;
  if (into < onFor) return 1 - Math.exp(-into / 0.025);
  const peak = 1 - Math.exp(-onFor / 0.025);
  return peak * Math.exp(-(into - onFor) / 0.07);
}

// Each side's pair of lamps throws one beam ahead, angled a touch down and out.
export const HEADLIGHT_BEAMS = [
  {
    at: HEADLIGHTS.slice(0, 2)
      .reduce((s, p) => s.add(new THREE.Vector3(...p)), new THREE.Vector3())
      .multiplyScalar(0.5),
    dir: new THREE.Vector3(1, -0.1, -0.08).normalize(),
  },
  {
    at: HEADLIGHTS.slice(2)
      .reduce((s, p) => s.add(new THREE.Vector3(...p)), new THREE.Vector3())
      .multiplyScalar(0.5),
    dir: new THREE.Vector3(1, -0.1, 0.08).normalize(),
  },
];

export const BEAM_COUNT = SIREN_BEAMS.length + HEADLIGHT_BEAMS.length;
