import {
  atan,
  clamp,
  cos,
  float,
  instanceIndex,
  int,
  ivec2,
  max,
  mix,
  round,
  select,
  sin,
  smoothstep,
  textureLoad,
  vec2,
  vec4,
} from 'three/tsl';

import { sectorMask, strokeMask } from './blobArcs';
import { growthMask } from './growth';
import { triangleCorner, triangleDistance, triangleUp } from './triangleArcs';

function fullFan(q, edge, size, pitch) {
  const corner = edge.mod(3).round();
  const up = triangleUp(edge);
  const center = triangleCorner(corner, up.greaterThan(0.5), size);
  const rel = q.sub(center);
  const count = size
    .mul(pitch)
    .mul(select(edge.div(6).floor().mod(2).greaterThan(0.5), 0.75, 0.5))
    .floor()
    .add(1)
    .min(
      size
        .mul(pitch)
        .mul(Math.sqrt(3) / 2)
        .add(0.5)
        .floor()
    )
    .max(1);
  const d = rel.length();
  const k = clamp(round(d.mul(pitch).sub(0.5)), 0, count.sub(1));
  const start = corner.mul((Math.PI * 2) / 3).add(up.mul(Math.PI / 3));
  const middle = start.add(Math.PI / 6);
  const angle = atan(
    rel.y.mul(cos(middle)).sub(rel.x.mul(sin(middle))),
    rel.x.mul(cos(middle)).add(rel.y.mul(sin(middle)))
  );
  const along = angle
    .div(Math.PI / 3)
    .add(0.5)
    .clamp(0, 1);
  return {
    d,
    dBand: d.sub(k.add(0.5).div(pitch)).abs(),
    aaField: d,
    lane: d.mul(pitch).add(0.5).floor().clamp(0, count.sub(1)),
    lanes: count,
    rMax: count.sub(0.5).div(pitch),
    along,
    sweep: along.sub(0.5).abs().mul(2),
  };
}

function laneColor(family, row, slot, u) {
  const {
    laneTextures: tex,
    maxLanesU,
    spectrumU,
    spectrumBlendU,
    spectrumPhaseU,
    stopCountU,
  } = u;
  const coord = ivec2(
    int(family.lane.add(float(slot).mul(maxLanesU))),
    int(row)
  );
  const flat = textureLoad(tex.colors, coord).rgb;
  const part = textureLoad(tex.along, coord);
  const position = part.w
    .add(part.x.add(part.y.mul(family.along)).mul(part.z).mul(stopCountU))
    .add(spectrumPhaseU);
  const wrapped = position.sub(
    position.div(stopCountU).floor().mul(stopCountU)
  );
  const index = wrapped.floor();
  const next = index.add(1).mod(stopCountU);
  const spectrum = mix(
    textureLoad(tex.stops, ivec2(int(index), 0)).rgb,
    textureLoad(tex.stops, ivec2(int(next), 0)).rgb,
    wrapped.sub(index).mul(spectrumBlendU)
  );
  return mix(flat, spectrum, spectrumU);
}

export default function capColor(q, u, delay) {
  const {
    laneTextures: tex,
    pathDivU: pitch,
    growthU,
    penHalfWidthU,
    showStrokesU,
    strokeColorU,
  } = u;
  const index = int(instanceIndex);
  const a = textureLoad(tex.caps, ivec2(0, index));
  const b = textureLoad(tex.caps, ivec2(1, index));
  const axes = textureLoad(tex.caps, ivec2(2, index));
  const n = a.x.mul(pitch).round();
  const odd = n.mod(2).greaterThan(0.5);
  const phase = select(odd, 1, 0.5);
  const count = n.mul(0.5).floor().max(1);
  const rMax = count.sub(1).add(phase).div(pitch);
  const d = q.length();
  const k = clamp(round(d.mul(pitch).sub(phase)), 0, count.sub(1));
  const outNormal = vec2(axes.y, axes.x.negate());
  const outward = q.dot(outNormal);
  const tangent = q.dot(axes.xy);
  const stem = vec2(
    tangent,
    max(outward.negate(), outward.sub(pitch.reciprocal())).max(0)
  ).length();
  const dBand = select(
    odd,
    d.sub(k.add(phase).div(pitch)).abs().min(stem),
    d.sub(k.add(phase).div(pitch)).abs()
  );
  const angle = atan(outward, tangent.negate()).clamp(0, Math.PI);
  const returns = {
    d,
    aaField: d,
    dBand,
    lane: d.mul(pitch).sub(phase).floor().add(1).clamp(0, count.sub(1)),
    lanes: count,
    rMax,
    along: angle.div(Math.PI),
    sweep: angle
      .sub(Math.PI / 2)
      .abs()
      .div(Math.PI / 2),
  };
  const hq = q.add(b.zw);
  const top = fullFan(hq, a.y, a.x, pitch);
  const middle = fullFan(hq, a.z, a.x, pitch);
  const bottom = fullFan(hq, a.w, a.x, pitch);
  const outsideTop = select(top.d.greaterThan(top.rMax), 1, 0);
  const outsideMiddle = select(middle.d.greaterThan(middle.rMax), 1, 0);
  const topInk = strokeMask(top.aaField, top.dBand, penHalfWidthU).mul(
    growthMask(top, growthU, delay)
  );
  const midInk = strokeMask(middle.aaField, middle.dBand, penHalfWidthU)
    .mul(outsideTop)
    .mul(growthMask(middle, growthU, delay));
  const bottomInk = strokeMask(bottom.aaField, bottom.dBand, penHalfWidthU)
    .mul(outsideTop)
    .mul(outsideMiddle)
    .mul(growthMask(bottom, growthU, delay));
  const hostInk = topInk.max(midInk).max(bottomInk);
  const hostColor = mix(
    laneColor(top, b.x, 0, u),
    mix(
      laneColor(middle, b.x, 1, u),
      laneColor(bottom, b.y, 0, u),
      outsideMiddle
    ),
    outsideTop
  );
  const returnInk = strokeMask(d, dBand, penHalfWidthU).mul(
    growthMask(returns, growthU, delay)
  );
  const outerInk = strokeMask(d, d.sub(rMax).abs(), penHalfWidthU).mul(
    growthMask({ ...returns, lane: count.sub(1) }, growthU, delay)
  );
  const outside = select(outward.greaterThanEqual(0), 1, 0);
  const toHost = triangleDistance(hq, a.x, a.y);
  const inHost = smoothstep(toHost.fwidth(), 0, toHost).max(axes.z);
  const rim = outerInk.mul(outside.max(axes.z));
  const ink = mix(hostInk.mul(inHost), returnInk, outside)
    .max(rim)
    .mul(showStrokesU);
  const fill = mix(hostColor, laneColor(returns, index, 0, u), outside);
  const hostGrown = mix(
    growthMask(top, growthU, delay),
    mix(
      growthMask(middle, growthU, delay),
      growthMask(bottom, growthU, delay),
      outsideMiddle
    ),
    outsideTop
  );
  const alpha = sectorMask(d, rMax)
    .mul(
      mix(hostGrown.mul(inHost), growthMask(returns, growthU, delay), outside)
    )
    .max(rim.mul(showStrokesU));
  return vec4(mix(fill, strokeColorU, ink), alpha);
}
