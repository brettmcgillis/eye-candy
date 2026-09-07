import * as THREE from 'three';

// mrange drives the three 4D rotation planes off one clock at incommensurate
// rates, which is why the slice never repeats. Kept on the CPU so manual mode
// is the same three angles held still rather than a second code path.
const RATES = [Math.sqrt(0.5), Math.sqrt(0.4), Math.sqrt(0.3)];
const SPEED = 0.1;

const scratch = new THREE.Vector3();

export function sliceRotation({ animate, manual, time }) {
  if (!animate) return scratch.set(manual[0], manual[1], manual[2]);

  const tm = SPEED * time;
  return scratch.set(tm * RATES[0], tm * RATES[1], tm * RATES[2]);
}

export default sliceRotation;
