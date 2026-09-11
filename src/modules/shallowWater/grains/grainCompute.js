import {
  Fn,
  If,
  float,
  floor,
  hash,
  instanceIndex,
  ivec2,
  mix,
  select,
  sin,
  smoothstep,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';

import { readOnly } from '@utils/storageField';

import { WORLD_SIZE } from './constants';
import { grainAge } from './grainCycle';

const TAU = Math.PI * 2;

// Ground goes wet the instant water touches it and dries slowly afterwards, so
// only the drying half is worth a control.
const WET_PICKUP = 16;

// How fast the wet-or-dry read follows the water, as opposed to how fast the
// ground dries out afterwards. Asymmetric on purpose: water arriving has to
// register at once, or a grain the foam has just covered spends a beat still
// rendering as dark sand, which is its own artifact. Water leaving is held
// back so that ground uncovered for only a few frames -- a reef top breaking
// the surface inside the surf zone -- never gets far enough to read as sand.
const WET_COVER = 22;
const WET_REVEAL = 2;

// Grains live in world space and the fields live on a grid, so everything in
// here goes through one conversion. Cell (i, j) sits at the world point the
// CPU bake wrote it from, which is what keeps the grains registered to the
// coastline they were sorted against.
function samplers(field, res) {
  const clamped = (c) => ivec2(c.x.clamp(0, res - 1), c.y.clamp(0, res - 1));

  const cellOf = (world) =>
    vec2(
      world.x
        .div(WORLD_SIZE)
        .add(0.5)
        .mul(res - 1),
      world.y
        .div(WORLD_SIZE)
        .negate()
        .add(0.5)
        .mul(res - 1)
    );

  const fieldAt = (c) => {
    const cc = clamped(c);
    return field.element(cc.y.mul(res).add(cc.x));
  };

  const bilinear = (load, cell) => {
    const base = ivec2(floor(cell));
    const f = cell.sub(floor(cell));
    const at = (dx, dy) => load(clamped(base.add(ivec2(dx, dy))));
    return mix(mix(at(0, 0), at(1, 0), f.x), mix(at(0, 1), at(1, 1), f.x), f.y);
  };

  // Central differences on the baked bed, in metres per metre. Nearest-texel
  // rather than bilinear: this only steers how a rock grain lies, and four
  // extra buffer reads is already the expensive half of the rock branch.
  const bedSlope = (cell) => {
    const base = ivec2(floor(cell));
    const at = (dx, dy) => fieldAt(base.add(ivec2(dx, dy))).x;
    const step = (WORLD_SIZE / (res - 1)) * 2;
    return vec2(at(1, 0).sub(at(-1, 0)), at(0, -1).sub(at(0, 1))).div(step);
  };

  return { bedSlope, bilinear, cellOf, fieldAt };
}

export function createGrainSeed({ buffers, count, field, res }) {
  const { cellOf, fieldAt } = samplers(field, res);

  return Fn(() => {
    const home = buffers.home.element(instanceIndex);
    const ground = fieldAt(ivec2(cellOf(home.xy).add(0.5)));

    buffers.state
      .element(instanceIndex)
      .assign(vec4(home.x, ground.x, home.y, 0));
    buffers.motion.element(instanceIndex).assign(vec4(0, 0, 0, 0));
    buffers.look.element(instanceIndex).assign(vec4(ground.x, ground.y, 0, 0));
    buffers.skin.element(instanceIndex).assign(vec4(0, 0, 0, 0));
  })()
    .compute(count)
    .setName('Shoreline Grain Seed');
}

// One kernel, two populations. Rock grains are pinned to the baked bed and
// only ever restate what the water is doing to them; water grains are carried
// by the solver's velocity and sprung back to where they belong. Everything
// the material needs is written out here, so the vertex stage does no sampling
// of its own -- at half a million grains the difference is three texture
// fetches per grain against twenty-four times that per frame.
export default function createGrainCompute({
  buffers,
  count,
  field,
  foamTexture,
  heightTexture,
  res,
  uniforms,
}) {
  const { bedSlope, bilinear, cellOf, fieldAt } = samplers(field, res);
  const water = readOnly(heightTexture);
  const foam = readOnly(foamTexture);

  return Fn(() => {
    const home = buffers.home.element(instanceIndex);
    const state = buffers.state.element(instanceIndex);
    const motion = buffers.motion.element(instanceIndex);
    const look = buffers.look.element(instanceIndex);
    const skin = buffers.skin.element(instanceIndex);

    const seed = home.z;
    const isRock = home.w.greaterThan(0.75);
    const position = state.xyz.toVar('position');
    const velocity = motion.xy.toVar('velocity');

    // Rock samples where it lives; water samples where it has drifted to.
    const cell = cellOf(select(isRock, home.xy, position.xz)).toVar('cell');
    const surf = bilinear((c) => water.load(c), cell).toVar('surf');
    const lace = bilinear((c) => foam.load(c), cell).toVar('lace');
    const bed = bilinear((c) => fieldAt(c), cell).toVar('bed');

    const depth = surf.x.toVar('depth');
    const ground = bed.x.toVar('ground');
    const aeration = surf.w;
    const tip = vec2(0).toVar('tip');
    const shade = bed.y.toVar('shade');

    If(isRock, () => {
      // Buried by a per-grain amount so the rock is a packed crust with a
      // broken surface, not one sheet of cubes at a single height.
      const jag = shade.sub(0.5).mul(uniforms.rockJag);
      const burial = hash(seed.mul(131071).add(3.1)).mul(uniforms.rockDepth);
      position.assign(vec3(home.x, ground.add(jag).sub(burial), home.y));
      velocity.assign(vec2(0));
      // Lying along the bed slope is what makes the crust read as one faceted
      // mass following the relief instead of scattered confetti.
      tip.assign(bedSlope(cell).mul(uniforms.rockTip));
    }).Else(() => {
      velocity.assign(
        mix(
          velocity,
          surf.yz.mul(uniforms.flowGain),
          uniforms.grainResponse.mul(uniforms.dt).clamp(0, 1)
        )
      );

      // Free advection. A spring back to a home position was the first thing
      // tried here and it is what made the field read as a level meter rather
      // than as water: it capped horizontal travel at the drift limit while
      // the vertical kept following the full depth swing, so every grain bobbed
      // far more than it moved. Grains now simply go where the water goes.
      const carried = position.xz
        .add(velocity.mul(uniforms.dt))
        .toVar('carried');

      // Water cannot climb a dry rock. Every field here is sampled where the
      // grain already is, so without this check a grain advects into a dry
      // cell and only finds out next frame -- at which point it snaps up onto
      // the rock surface and takes the colour of wet stone. That is the black
      // grain that pops in above the foam for a few frames and then vanishes
      // when the flow or the recycle takes it away again.
      const standing = ground.add(depth).toVar('standing');
      const ahead = bilinear((c) => fieldAt(c), cellOf(carried)).x;
      If(ahead.greaterThan(standing), () => {
        carried.assign(position.xz);
        velocity.assign(vec2(0));
      });

      // Leaving the domain is not a reason to go home. The fade is tied to the
      // grain's own cycle, so a grain sent home part way through its life
      // arrives at whatever size it happened to be -- which is a grain popping
      // into frame out of nothing. Parked against the edge instead, it stays
      // out of shot until its cycle turns over on its own.
      const half = WORLD_SIZE * 0.5;
      position.x.assign(carried.x.clamp(-half, half));
      position.z.assign(carried.y.clamp(-half, half));

      // Even cover is bought back with a staggered lifetime. Each grain runs
      // its own cycle, offset by its seed, and returns home when the cycle
      // turns over -- the one moment the material has faded it to nothing, so
      // the teleport is never seen.
      const wrapped = grainAge(seed, uniforms).lessThan(
        grainAge(seed, uniforms, uniforms.dt)
      );
      If(wrapped, () => {
        position.assign(vec3(home.x, ground.add(depth), home.y));
        velocity.assign(vec2(0));
      });

      const bob = sin(uniforms.phase.mul(uniforms.churnRate).add(seed.mul(TAU)))
        .mul(aeration)
        .mul(uniforms.churnLift);
      const target = ground
        .add(depth)
        .add(bob)
        .add(lace.x.mul(uniforms.foamLift));
      position.y.assign(
        mix(
          position.y,
          target,
          uniforms.grainSettle.mul(uniforms.dt).clamp(0, 1)
        )
      );

      // Tipped downstream, so a grain in a running bore leans the way the
      // water is going.
      tip.assign(velocity.mul(uniforms.flowTip));
      // Rock has no use for foam freshness and water has no use for the rock
      // facet noise, so the two share a channel.
      shade.assign(lace.y);
    });

    // Foam sticks to the grain rather than being resampled from under it.
    // Reading the field at the grain's current position made the bed a screen
    // showing a pattern: a grain that moved simply recoloured to match its new
    // cell, so horizontal travel was invisible however fast it was. Picking the
    // foam up on contact and releasing it slowly is what makes a grain that ran
    // through a breaking front stay white while the water carries it, which is
    // the whole of seeing the wave move.
    // Asymmetric, not a running maximum. Taking the max and holding it made
    // every grain that had ever touched foam stay white, which washed the lace
    // out into one solid band -- the exact pattern the scene exists to show.
    // A fast attack and a slower release keeps a grain's whiteness travelling
    // with it while still letting it converge back to what is under it.
    const charge = motion.z.toVar('charge');
    const rate = select(
      lace.x.greaterThan(charge),
      uniforms.foamPickup,
      uniforms.foamMemory
    );
    charge.assign(mix(charge, lace.x, rate.mul(uniforms.dt).clamp(0, 1)));

    // How wet this patch of ground is, with memory. Without it wetness is a
    // function of how deep the water is right now, so the moment a wave pulls
    // back the shore looks exactly as it did before the wave arrived and the
    // recede is invisible. Wet on contact, drying over seconds, is what leaves
    // a dark band behind a retreating wave that fades from the high mark down.
    const submerged = smoothstep(0, uniforms.wetDepth, depth);
    const wetness = skin.x.toVar('wetness');
    const soak = select(
      submerged.greaterThan(wetness),
      float(WET_PICKUP),
      uniforms.shoreDrying
    );
    wetness.assign(mix(wetness, submerged, soak.mul(uniforms.dt).clamp(0, 1)));

    // Submersion itself, smoothed over about an eighth of a second. Raw, it
    // crosses the wet-depth threshold several times a second in the swash, and
    // it decides both how big a grain is and whether it reads as water or as
    // sand -- so the raw signal showed up as grains snapping between small and
    // bright and large and dark from one frame to the next.
    const settled = skin.y.toVar('settled');
    const cover = select(
      submerged.greaterThan(settled),
      float(WET_COVER),
      float(WET_REVEAL)
    );
    settled.assign(mix(settled, submerged, cover.mul(uniforms.dt).clamp(0, 1)));

    skin.assign(vec4(wetness, settled, 0, 0));

    state.assign(vec4(position, depth));
    motion.assign(vec4(velocity, select(isRock, lace.x, charge), aeration));
    look.assign(vec4(ground, shade, tip.x, tip.y));
  })()
    .compute(count)
    .setName('Shoreline Grains');
}
