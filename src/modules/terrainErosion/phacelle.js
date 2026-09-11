import { Fn, cos, float, floor, fract, sin, vec2, vec4 } from 'three/tsl';

import { TAU } from './constants';
import { hash2 } from './noise';

// Phacelle Noise, copyright (c) 2025 Rune Skovbo Johansen, MPL-2.0
// (https://mozilla.org/MPL/2.0/). A stripe pattern aligned with `normDir`,
// built by interpolating cosine and sine waves from 4x4 jittered cells so the
// stripes carry a continuous phase rather than a value. Returns the normalized
// cosine and sine in xy, and the side direction in zw — multiplying the sine by
// that direction gives the derivative of the cosine.
const phacelleNoise = Fn(([p, normDir, frequency, offset, normalization]) => {
  const sideDir = normDir.yx.mul(vec2(-1, 1)).mul(frequency).mul(TAU).toVar();
  const phase = offset.mul(TAU).toVar();

  const pInt = floor(p).toVar();
  const pFrac = fract(p).toVar();

  const phaseDir = vec2(0).toVar();
  const weightSum = float(0).toVar();

  // The 4x4 neighbourhood is fixed, so it unrolls into the graph rather than
  // running as a loop. Cells further out cannot contribute: the jitter is at
  // most half a unit, so the nearest point outside the block is 1.5 away,
  // where the weight function reaches zero.
  for (let i = -1; i <= 2; i += 1) {
    for (let j = -1; j <= 2; j += 1) {
      const gridOffset = vec2(i, j);
      const randomOffset = hash2(pInt.add(gridOffset)).mul(0.5);
      const fromCell = pFrac.sub(gridOffset).sub(randomOffset).toVar();

      const weight = fromCell
        .dot(fromCell)
        .mul(-2)
        .exp()
        .sub(0.01111)
        .max(0)
        .toVar();
      weightSum.addAssign(weight);

      const waveInput = fromCell.dot(sideDir).add(phase).toVar();
      phaseDir.addAssign(vec2(cos(waveInput), sin(waveInput)).mul(weight));
    }
  }

  const interpolated = phaseDir.div(weightSum).toVar();
  const magnitude = interpolated
    .dot(interpolated)
    .sqrt()
    .max(normalization.oneMinus())
    .toVar();

  return vec4(interpolated.div(magnitude), sideDir);
});

export default phacelleNoise;
