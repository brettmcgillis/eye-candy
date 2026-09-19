import {
  If,
  abs,
  clamp,
  cos,
  float,
  floor,
  max,
  mix,
  select,
  sin,
  smoothstep,
  vec2,
  vec3,
} from 'three/tsl';

import { hash13, hash31 } from './shared';

const MAX_COUNT = 12;
const THIN = 0.1;
const GLOW = 0.01;
const DELAY = 10;
const CELL = 4;
const ANGLE = 3.1415 / 4;
const COS = Math.cos(ANGLE);
const SIN = Math.sin(ANGLE);

export default function funkyMotherboardCarpet({
  fragCoord,
  resolution,
  tile,
  time,
}) {
  const uv = fragCoord.div(resolution);
  const p = fragCoord.mul(2).sub(resolution).mul(2).div(resolution.y).toVar();
  const tileCell = vec2(
    tile.sub(floor(tile.div(CELL)).mul(CELL)),
    floor(tile.div(CELL))
  );
  const cell = select(tile.lessThan(0), floor(uv.mul(CELL)), tileCell).div(
    CELL
  );

  const seed = hash13(vec3(cell, floor(time.div(DELAY))))
    .mul(196)
    .toVar();
  const rng = hash31(seed).toVar();
  const rng2 = hash31(seed.add(1096)).toVar();
  const size = mix(0.01, 0.2, rng2.z);
  const range = mix(vec2(0.2), vec2(0.8), rng.xy);
  const rangeY = mix(0.1, 0.2, rng.z);
  const fallOff = mix(1.1, 1.2, rng2.x);
  const count = floor(mix(4, 12, rng2.y)).toVar();

  const a = float(1).toVar();
  const color = vec3(0).toVar();

  for (let index = 0; index < MAX_COUNT; index += 1) {
    If(float(index).lessThan(count), () => {
      p.assign(abs(p).sub(range.mul(a)));
      p.assign(
        vec2(p.x.mul(COS).sub(p.y.mul(SIN)), p.x.mul(SIN).add(p.y.mul(COS)))
      );
      p.y.assign(abs(p.y).sub(rangeY));

      const dist = max(
        abs(p.x).add(a.mul(sin(float(6.28 * index).div(count)))),
        p.y.sub(size)
      ).toVar();
      color.addAssign(smoothstep(0, THIN, dist).oneMinus().mul(GLOW).div(dist));
      a.divAssign(fallOff);
    });
  }

  color.assign(clamp(color, 0, 1));
  color.mulAssign(
    cos(vec3(1, 2, 3).mul(5).add(p.x.mul(10)))
      .mul(0.5)
      .add(0.5)
  );
  color.addAssign(float(0.04).div(abs(sin(p.y.mul(12).add(time)))));

  return color;
}
