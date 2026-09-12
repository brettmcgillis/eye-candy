import { Fn, smoothstep, textureStore, vec4 } from 'three/tsl';

import { readOnly, writeOnly } from '@utils/storageField';

import gridHelpers from '../gridHelpers';

// Both brushes are the same shape: a radial falloff, a dome term that adds or
// removes at the centre, and a push term that takes from the trailing side of
// a drag and puts it on the leading side. Which of the two is live is decided
// on the CPU by zeroing the other's gain, so there is no mode branch in either
// kernel and no int uniform to keep in step with a Leva select.
function stroke(brush, world) {
  const offset = world.sub(brush.centre).toConst('offset');
  const distance = offset.length().toConst('distance');
  const falloff = smoothstep(0, brush.radius, distance)
    .oneMinus()
    .toConst('falloff');

  // Signed along the drag, so the same stroke digs behind the cursor and piles
  // in front of it -- material moving rather than material appearing.
  const travel = brush.drag.length().toConst('travel');
  const lobe = offset
    .div(distance.max(1e-4))
    .dot(brush.drag.div(travel.max(1e-4)))
    .toConst('lobe');

  return { falloff, lobe, travel };
}

// Sculpting the bed. The pre-stroke bed goes into .z on the way past, which is
// exactly what a rebake parks there, so the rebase pair that follows this
// solves the water back onto the new ground without a reflood -- raising a bar
// under a pool pushes the water off it instead of lifting a mound of water
// into the air with it.
export function createBedBrushPass({ brush, field, res, worldSize }) {
  const { coordOf, worldOf } = gridHelpers(res, worldSize);

  return Fn(() => {
    const c = coordOf();
    const slot = field.element(c.y.mul(res).add(c.x));
    const bed = slot.x.toConst('bed');
    const { falloff, lobe, travel } = stroke(brush, worldOf(c));

    const delta = falloff.mul(
      brush.domeGain.add(lobe.mul(travel).mul(brush.pushGain))
    );

    slot.assign(vec4(bed.add(delta), slot.y, bed, slot.w));
  })()
    .compute(res * res)
    .setName('Bed Brush');
}

// Pushing the water. Depth rather than velocity: velocity here is derived from
// the flux every height pass, so anything written into it is gone by the next
// substep, whereas a depth the brush has piled up is a surface gradient the
// pipe solve answers with flux of its own and keeps answering afterwards.
export function createWaterBrushPass({ brush, heights, res, worldSize }) {
  const { coordOf, worldOf } = gridHelpers(res, worldSize);
  const read = readOnly(heights[0]);
  const write = writeOnly(heights[1]);

  return Fn(() => {
    const c = coordOf();
    const state = read.load(c).toConst('state');
    const { falloff, lobe, travel } = stroke(brush, worldOf(c));

    const delta = falloff.mul(
      brush.waterLift.add(lobe.mul(travel).mul(brush.waterPush))
    );

    textureStore(
      write,
      c,
      vec4(state.x.add(delta).max(0), state.y, state.z, state.w)
    );
  })()
    .compute(res * res)
    .setName('Water Brush');
}
