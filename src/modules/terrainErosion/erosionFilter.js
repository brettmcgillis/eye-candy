import { Loop, float, mix, vec3 } from 'three/tsl';

import { easeOut, powInv, safeNormalize, smoothStart } from './easing';
import phacelleNoise from './phacelle';

// Advanced Terrain Erosion Filter, copyright (c) 2025 Rune Skovbo Johansen,
// MPL-2.0 (https://mozilla.org/MPL/2.0/). Each octave lays a band of gullies
// along the slope accumulated so far and fades them towards `fadeTarget`
// wherever the terrain is flattening out, which is what keeps ridges and
// creases from being sanded away. Inlined rather than wrapped in Fn() so the
// four outputs come back as plain nodes instead of out-parameters.
export default function erosionFilter({
  p,
  heightAndSlope,
  fadeTarget,
  strength,
  gullyWeight,
  detail,
  rounding,
  onset,
  assumedSlope,
  scale,
  octaves,
  lacunarity,
  gain,
  cellScale,
  normalization,
}) {
  const input = vec3(heightAndSlope).toVar();
  const current = vec3(heightAndSlope).toVar();

  const octaveStrength = strength.mul(scale).toVar();
  const fade = fadeTarget.clamp(-1, 1).toVar();
  const freq = float(1).div(scale.mul(cellScale)).toVar();
  const slopeLength = current.yz.length().max(1e-10).toVar();

  const magnitude = float(0).toVar();
  const roundingMult = float(1).toVar();

  const roundingForInput = mix(
    rounding.y,
    rounding.x,
    fade.add(0.5).clamp(0, 1)
  ).mul(rounding.z);

  const combiMask = easeOut(
    smoothStart(slopeLength.mul(onset.x), roundingForInput.mul(onset.x))
  ).toVar();

  const ridgeMask = easeOut(slopeLength.mul(onset.z)).toVar();
  const ridgeFade = fadeTarget.clamp(-1, 1).toVar();

  // Gully directions follow an assumed slope rather than the real one, because
  // the eroded terrain ends up shaped quite differently from its input.
  const gullySlope = mix(
    current.yz,
    current.yz.div(slopeLength).mul(assumedSlope.x),
    assumedSlope.y
  ).toVar();

  Loop({ end: octaves, start: 0, type: 'int' }, () => {
    const phacelle = phacelleNoise(
      p.mul(freq),
      safeNormalize(gullySlope),
      cellScale,
      float(0.25),
      normalization
    ).toVar();

    // Negated because these are slope directions that point downhill, and
    // scaled by freq to undo the same factor applied to p.
    const derivative = phacelle.zw.mul(freq.negate()).toVar();
    const sloping = phacelle.y.abs().toVar();

    gullySlope.addAssign(
      phacelle.y.sign().mul(derivative).mul(octaveStrength).mul(gullyWeight)
    );

    const gullies = vec3(phacelle.x, phacelle.y.mul(derivative)).toVar();
    const faded = mix(
      vec3(fade, 0, 0),
      gullies.mul(gullyWeight),
      combiMask
    ).toVar();

    current.addAssign(faded.mul(octaveStrength));
    magnitude.addAssign(octaveStrength);
    fade.assign(faded.x);

    const roundingForOctave = mix(
      rounding.y,
      rounding.x,
      phacelle.x.add(0.5).clamp(0, 1)
    ).mul(roundingMult);

    combiMask.assign(
      powInv(combiMask, detail).mul(
        easeOut(
          smoothStart(sloping.mul(onset.y), roundingForOctave.mul(onset.y))
        )
      )
    );

    ridgeFade.assign(mix(ridgeFade, gullies.x, ridgeMask));
    ridgeMask.mulAssign(easeOut(sloping.mul(onset.w)));

    octaveStrength.mulAssign(gain);
    freq.mulAssign(lacunarity);
    roundingMult.mulAssign(rounding.w);
  });

  return {
    delta: current.sub(input),
    magnitude,
    ridgeMap: ridgeFade.mul(ridgeMask.oneMinus()),
    fade,
  };
}
