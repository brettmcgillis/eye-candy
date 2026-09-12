import {
  Fn,
  float,
  ivec2,
  mix,
  smoothstep,
  textureStore,
  vec2,
  vec4,
} from 'three/tsl';

import { readOnly, writeOnly } from '@utils/storageField';

import gridHelpers from './gridHelpers';

// The bed answering the water back. Transport capacity rises with how fast the
// flow is and how steeply the bed falls away under it, and the difference
// between that capacity and what the water is already carrying is what gets
// taken off the bed or dropped onto it. Sediment is advected with the same
// semi-Lagrangian carry the foam uses, so material scoured out of a riffle
// arrives in the pool below it rather than settling where it was lifted.
//
// This is Musgrave-style erosion over the shallow-water solve rather than a
// rain-and-droplet model: there is already a velocity field and a depth field,
// so the only thing missing was somewhere to keep the suspended load.
//
// Run once per frame, not once per substep. The bed moves in millimetres and
// the advection is unconditionally stable, so a substep of it would cost four
// passes to show nothing, and the rebase that follows it -- which is what
// keeps the water surface where it was while the ground moves out from under
// it -- would cost eight more.

// Below this the flow is standing still and everything it holds drops out,
// whatever the capacity formula says.
const STILL = 0.02;

export function createErosionPass({
  field,
  heights,
  res,
  sediment,
  uniforms,
  worldSize,
}) {
  const { bilinear, cell, clamped, coordOf, uvDrift, uvOf } = gridHelpers(
    res,
    worldSize
  );
  const heightRead = readOnly(heights[0]);
  const sedimentRead = readOnly(sediment[0]);
  const sedimentWrite = writeOnly(sediment[1]);

  return Fn(() => {
    const c = coordOf();
    const slot = field.element(c.y.mul(res).add(c.x));
    const bed = slot.x.toConst('bed');

    const state = heightRead.load(c).toConst('state');
    const depth = state.x.toConst('depth');
    const speed = state.yz.length().toConst('speed');

    // Neighbour beds are read while other invocations are writing theirs, so
    // this slope can be a step out of date. At millimetres of bed movement per
    // frame that is noise well under a texel of relief, and paying for a
    // second buffer to avoid it would buy nothing visible.
    const bedAt = (dx, dy) => {
      const nc = clamped(c.add(ivec2(dx, dy)));
      return field.element(nc.y.mul(res).add(nc.x)).x;
    };
    const tilt = vec2(
      bedAt(1, 0).sub(bedAt(-1, 0)),
      bedAt(0, 1).sub(bedAt(0, -1))
    )
      .length()
      .div(cell * 2)
      .toConst('tilt');

    const carried = bilinear(
      sedimentRead,
      uvOf(c).sub(uvDrift(state.yz).mul(uniforms.dt))
    ).x.toConst('carried');

    // Dry ground carries nothing, and a deep slow pool carries far less than
    // the same speed in a hand's depth of water over a bar.
    const wet = smoothstep(0, uniforms.wetDepth, depth).toConst('wet');
    const shallow = uniforms.carryDepth
      .div(depth.max(uniforms.carryDepth))
      .toConst('shallow');
    const capacity = uniforms.bedCarry
      .mul(speed.sub(STILL).max(0))
      .mul(tilt.max(uniforms.bedMinSlope))
      .mul(shallow)
      .mul(wet)
      .toConst('capacity');

    // The bake's facet detail doubles as a hardness map: the same ridged noise
    // that shades the rock decides which parts of it the water gets through
    // first, so a headland wears into ribs rather than melting evenly.
    const resist = mix(float(1), slot.y, uniforms.bedResist).toConst('resist');

    const deficit = capacity.sub(carried).toConst('deficit');
    const lifted = deficit
      .max(0)
      .mul(uniforms.bedErode)
      .mul(resist)
      .mul(uniforms.dt);
    const dropped = deficit
      .min(0)
      .negate()
      .mul(uniforms.bedDeposit)
      .mul(uniforms.dt);

    const exchange = lifted
      .sub(dropped)
      .clamp(
        uniforms.bedLimit.mul(uniforms.dt).negate(),
        uniforms.bedLimit.mul(uniforms.dt)
      )
      .toConst('exchange');

    textureStore(sedimentWrite, c, vec4(carried.add(exchange).max(0), 0, 0, 1));
    slot.assign(vec4(bed.sub(exchange), slot.y, bed, slot.w));
  })()
    .compute(res * res)
    .setName('Bed Erosion');
}

export function createSedimentRestorePass({ res, sediment, worldSize }) {
  const { coordOf } = gridHelpers(res, worldSize);
  const read = readOnly(sediment[1]);
  const write = writeOnly(sediment[0]);

  return Fn(() => {
    const c = coordOf();
    textureStore(write, c, read.load(c));
  })()
    .compute(res * res)
    .setName('Sediment Restore');
}
