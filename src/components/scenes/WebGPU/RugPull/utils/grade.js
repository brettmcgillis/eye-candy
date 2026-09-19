import { clamp, floor, mix, select } from 'three/tsl';

export default function grade(u, col) {
  const raw = clamp(col, 0, 1).toVar();
  const layered = mix(u.palette0, u.palette1, raw.x).toVar();
  layered.assign(mix(layered, u.palette2, raw.y));
  layered.assign(mix(layered, u.palette3, raw.z));

  const out = mix(raw, layered, u.paletteMix).toVar();
  const posterized = floor(out.mul(u.inkSteps).add(0.5)).div(u.inkSteps);
  out.assign(select(u.inkSteps.greaterThan(0.5), posterized, out));

  return out.pow(u.gamma);
}
