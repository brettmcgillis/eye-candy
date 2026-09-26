import {
  Fn,
  PI,
  abs,
  attribute,
  clamp,
  float,
  floor,
  instanceIndex,
  max,
  mix,
  normalGeometry,
  positionGeometry,
  pow,
  sin,
  smoothstep,
  time,
  varyingProperty,
  vec3,
} from 'three/tsl';

import { BEAD_BLOCK } from '@modules/fauna';

import {
  slotNodes,
  standardMaterial,
  toViewNormal,
  toWorld,
} from './creatureNodes';

function rowPopulation(slot, s) {
  const row = floor(clamp(s, 0, 0.999).mul(8));
  const pick = (v, i) => row.equal(i).select(v, float(0));

  return pick(slot.rowsA.x, 0)
    .add(pick(slot.rowsA.y, 1))
    .add(pick(slot.rowsA.z, 2))
    .add(pick(slot.rowsA.w, 3))
    .add(pick(slot.rowsB.x, 4))
    .add(pick(slot.rowsB.y, 5))
    .add(pick(slot.rowsB.z, 6))
    .add(pick(slot.rowsB.w, 7));
}

function swimBody(slot, s, side, phase) {
  const [length, width, fin, freq] = ['x', 'y', 'z', 'w'].map(
    (c) => slot.swimA[c]
  );
  const head = slot.swimB.x;
  const tail = slot.swimB.y;
  const undulate = slot.swimB.z;
  const spineX = sin(s.mul(5).sub(phase.mul(3)))
    .mul(undulate)
    .mul(0.12)
    .mul(s);
  const bodyWidth = width.mul(sin(s.mul(0.9).add(0.08).mul(PI)));
  const finEnvelope = pow(sin(clamp(s.sub(0.3).div(0.5), 0, 1).mul(PI)), 3);
  const finSpread = finEnvelope
    .mul(fin)
    .mul(
      sin(phase.mul(4).add(s.mul(16)))
        .mul(0.4)
        .add(0.6)
    )
    .mul(sin(s.mul(freq)))
    .mul(rowPopulation(slot, s).mul(0.65).add(0.35));
  const headSpread = smoothstep(0, 0.35, s)
    .oneMinus()
    .mul(head)
    .mul(sin(s.mul(8).add(1.2)));
  const tailSpread = sin(s.mul(32))
    .mul(tail)
    .mul(smoothstep(0.75, 1, s));
  const spread = bodyWidth.add(finSpread).add(headSpread).add(tailSpread);

  return {
    position: vec3(
      spineX.add(side.mul(spread)),
      abs(spread)
        .mul(0.35)
        .mul(sin(s.mul(freq).mul(0.5).add(phase))),
      float(0.5).sub(s).mul(length)
    ),
    radius: width
      .mul(0.35)
      .mul(sin(s.mul(PI)))
      .add(0.03),
    tail: vec3(
      sin(float(5).sub(phase.mul(3)))
        .mul(undulate)
        .mul(0.12),
      0,
      length.mul(-0.5)
    ),
  };
}

function tentacle(slot, u, strand, count, phase, swimTail) {
  const swimmer = slot.body.x.greaterThan(1.5);
  const reach = slot.body.z;
  const wave = slot.body.w.mul(0.09).add(0.03);
  const across = count.greaterThan(1.5).select(
    strand
      .sub(1)
      .div(max(count.sub(1), 1))
      .mul(2)
      .sub(1),
    float(0)
  );
  const base = swimmer.select(swimTail, vec3(across.mul(0.3), 0.72, -0.18));
  const sway = sin(u.mul(6).sub(time.mul(3)).sub(phase).add(strand.mul(2.5)))
    .mul(wave)
    .mul(u);
  const droop = swimmer.select(
    sway.mul(0.4),
    u.mul(reach).mul(-0.35).add(sway.mul(0.5))
  );

  return {
    position: base.add(
      vec3(
        across.mul(u).mul(reach).mul(0.22).add(sway),
        droop,
        u.mul(reach).negate()
      )
    ),
    radius: u.mul(-0.6).add(1).mul(0.036),
  };
}

export default function createBeadMaterial(store, u) {
  const material = standardMaterial(u);
  const color = varyingProperty('vec3', 'vBeadColor');
  const normal = varyingProperty('vec3', 'vBeadNormal');
  const rough = varyingProperty('float', 'vBeadRough');

  material.positionNode = Fn(() => {
    const slot = slotNodes(store, instanceIndex.div(BEAD_BLOCK));
    const info = attribute('bInfo', 'vec4');
    const t = info.x;
    const isBody = info.z.lessThan(0.5);
    const visible = t.greaterThanEqual(0).select(float(1), float(0));
    const phase = slot.motion.y.mul(1.2).add(time.mul(0.7)).add(slot.motion.w);
    const body = swimBody(slot, t, info.y, phase);
    const arm = tentacle(slot, t, info.z, info.w, phase, body.tail);
    const center = isBody.select(body.position, arm.position);
    const radius = isBody.select(body.radius, arm.radius);

    color.assign(
      isBody.select(
        mix(slot.base.rgb, slot.accent.rgb, smoothstep(0.2, 1, t)),
        mix(slot.accent.rgb, slot.base.rgb, t)
      )
    );
    normal.assign(toViewNormal(normalGeometry, slot));
    rough.assign(slot.base.w);

    return toWorld(center.add(positionGeometry.mul(radius)).mul(visible), slot);
  })();
  material.colorNode = color;
  material.normalNode = normal;
  material.roughnessNode = rough.mul(u.roughness).clamp(0.05, 1);

  return material;
}
