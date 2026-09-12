/* eslint-disable camelcase */
import {
  Fn,
  float,
  ivec2,
  mix,
  mx_noise_float,
  smoothstep,
  textureStore,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';

import { readOnly, writeOnly } from '@utils/storageField';

import { GRAVITY, MIN_DEPTH, SPEED_LIMIT, VELOCITY_FLOOR } from './constants';
import gridHelpers from './gridHelpers';

// The bed the previous bake wrote, parked in .z of the field buffer.
const fieldPrevious = (field, c, res) => {
  const x = c.x.clamp(0, res - 1);
  const y = c.y.clamp(0, res - 1);
  return field.element(y.mul(res).add(x)).z;
};

// Separable Gaussians applied as their 2D outer product in one pass. Giving
// each its own dispatch would need a fourth storage texture bound to the foam
// step, and this field is small enough that the taps are the cheaper trade.
// The wide one is spread-scaled and sets the lace scale; the narrow one is
// always one texel and only exists to take the grid noise out.
const WIDE_BLUR = [1, 4, 6, 4, 1];
const NARROW_BLUR = [1, 2, 1];

// Curl of a scalar noise potential: divergence-free in the plane, so it stirs
// and folds the surface without inventing water. This is the small-scale
// churn the pipe solve cannot resolve -- its cells are centimetres and the
// eddies that tear foam into filigree are finer than that.
function curlAt(point, phase) {
  const e = 0.35;
  const at = (offset) => mx_noise_float(vec3(point.add(offset), phase));
  return vec2(
    at(vec2(0, e)).sub(at(vec2(0, e).negate())),
    at(vec2(e, 0).negate()).sub(at(vec2(e, 0)))
  ).div(e * 2);
}

// Virtual-pipe shallow water (Mei/Decaudin/Neyret): each cell pushes flux to
// its four neighbours proportional to the surface-height difference, then the
// flux is scaled back so a cell can never drain more than it holds. That clamp
// is what makes wetting and drying over rock stable rather than explosive.
export function createFluxPass({
  field,
  flux,
  heights,
  read,
  res,
  uniforms,
  worldSize,
  write,
}) {
  const { bedAt, cell, clamped, coordOf } = gridHelpers(res, worldSize);
  const footprint = cell * cell;
  const heightRead = readOnly(heights[read]);
  const fluxRead = readOnly(flux[read]);
  const fluxWrite = writeOnly(flux[write]);

  return Fn(() => {
    const c = coordOf();
    const depth = heightRead.load(c).x.toConst('depth');
    const surface = bedAt(field, c).add(depth).toConst('surface');
    const previous = fluxRead.load(c).toConst('previous');

    const outflow = (prior, dx, dy) => {
      const nc = clamped(c.add(ivec2(dx, dy)));
      const neighbourDepth = heightRead.load(nc).x;
      const neighbour = bedAt(field, nc).add(neighbourDepth);
      const drop = surface.sub(neighbour);

      // The pipe's cross-section is the water column it actually cuts through.
      // Holding it constant -- which is how this started, and how most
      // virtual-pipe implementations write it -- makes the scheme's celerity
      // sqrt(pipeArea * g / cell): no depth term at all. Waves then neither
      // slow nor steepen nor grow as they shoal, which measured as a surface
      // swing that FELL from 1.70m offshore to 0.66m at the break. Nothing can
      // crash when the shelf is taking energy out of the wave.
      //
      // Scaled by depth instead, the celerity is sqrt(pipeArea * g * h), which
      // is the shallow-water wave speed. Water slows and stands up where the
      // bed rises, which is what puts a bore front on a shelf and a standing
      // wave over a riffle. The larger of the two depths is what keeps a
      // wetting front moving onto dry ground.
      const column = depth.max(neighbourDepth).max(MIN_DEPTH);
      const area = column.mul(cell).mul(uniforms.pipeArea);

      // Friction as a rate per second rather than a factor per substep, so the
      // substep count stays a stability knob instead of quietly being a
      // damping one.
      return prior
        .mul(uniforms.friction.mul(uniforms.dt).oneMinus().max(0))
        .add(uniforms.dt.mul(area).mul(GRAVITY).mul(drop).div(cell))
        .max(0);
    };

    const next = vec4(
      outflow(previous.x, -1, 0),
      outflow(previous.y, 1, 0),
      outflow(previous.z, 0, 1),
      outflow(previous.w, 0, -1)
    ).toVar('next');

    const total = next.x.add(next.y).add(next.z).add(next.w).toConst('total');
    const scale = total
      .greaterThan(1e-8)
      .select(
        depth.mul(footprint).div(total.mul(uniforms.dt)).clamp(0, 1),
        float(1)
      );

    textureStore(fluxWrite, c, next.mul(scale));
  })().compute(res * res);
}

// Depth from the flux divergence, then the two things every other pass reads
// off it: a world-space velocity, and an aeration field. Aeration is the
// memory of having broken -- born where the flow goes supercritical or the
// surface stands up, then carried along and decaying -- and it is what makes
// whitewater persist behind a bore instead of existing only at the crest.
//
// `force` is the scene's boundary: it is handed the freshly integrated depth
// and returns vec2(target depth, weight), which is how a wave maker at the
// deep edge and an inflow-plus-outfall pair on a stream are the same kernel.
export function createHeightPass({
  field,
  flux,
  force,
  heights,
  read,
  res,
  uniforms,
  worldSize,
  write,
}) {
  const {
    bedAt,
    bilinear,
    cell,
    clamped,
    coordOf,
    fieldAt,
    inside,
    uvDrift,
    uvOf,
    worldOf,
  } = gridHelpers(res, worldSize);
  const footprint = cell * cell;
  const heightRead = readOnly(heights[read]);
  const fluxRead = readOnly(flux[write]);
  const heightWrite = writeOnly(heights[write]);

  return Fn(() => {
    const c = coordOf();
    const depth = heightRead.load(c).x.toConst('depth');
    const own = fluxRead.load(c).toConst('own');

    const neighbourFlux = (dx, dy) => {
      const nc = c.add(ivec2(dx, dy));
      return inside(nc).select(fluxRead.load(clamped(nc)), vec4(0));
    };
    const left = neighbourFlux(-1, 0).toConst('left');
    const right = neighbourFlux(1, 0).toConst('right');
    const top = neighbourFlux(0, 1).toConst('top');
    const bottom = neighbourFlux(0, -1).toConst('bottom');

    const inflow = left.y.add(right.x).add(top.w).add(bottom.z);
    const outflow = own.x.add(own.y).add(own.z).add(own.w);
    const next = depth
      .add(uniforms.dt.mul(inflow.sub(outflow)).div(footprint))
      .max(0)
      .toVar('next');

    const world = worldOf(c).toConst('world');
    const bed = bedAt(field, c).toConst('bed');
    const driven = force({
      bed,
      cell: fieldAt(field, c),
      coord: c,
      depth: next,
      res,
      uniforms,
      world,
    });
    next.assign(mix(next, driven.x.max(0), driven.y.clamp(0, 1)));

    const average = depth.add(next).mul(0.5).max(MIN_DEPTH).toConst('average');
    const dGridX = left.y.sub(own.x).add(own.y).sub(right.x).mul(0.5);
    const dGridY = bottom.z.sub(own.w).add(own.z).sub(top.w).mul(0.5);
    // Flux over depth, so a cell holding a millimetre of water reports a
    // singularity: this measured 44 m/s along a waterline before the floor
    // and the cap went in.
    const floored = average.max(VELOCITY_FLOOR).toConst('floored');
    const velocity = vec2(dGridX, dGridY.negate())
      .div(floored.mul(cell))
      .mul(uniforms.drag.oneMinus())
      .toVar('velocity');
    const speed = velocity.length().max(1e-6).toVar('speed');
    velocity.mulAssign(speed.min(SPEED_LIMIT).div(speed));

    // Froude number: above 1 the flow outruns the wave that would carry it
    // away, which is the condition for a hydraulic jump -- a bore face, or the
    // standing white water at the tail of a riffle.
    const froude = velocity.length().div(floored.mul(GRAVITY).sqrt());
    const surface = bed.add(next);
    const surfaceAt = (dx, dy) => {
      const nc = clamped(c.add(ivec2(dx, dy)));
      return bedAt(field, nc).add(heightRead.load(nc).x);
    };
    const steepness = vec2(
      surfaceAt(1, 0).sub(surface),
      surfaceAt(0, 1).sub(surface)
    )
      .length()
      .div(cell);

    const shallowness = float(1)
      .sub(smoothstep(0, uniforms.shallowDepth, next))
      .toConst('shallowness');
    // Gated on wetness, not just multiplied by it at the end. Dry rock has a
    // steep "surface" -- it is the bed -- and an unbounded Froude number, so
    // ungated this term aerated the entire headland and then advected that
    // into the water, which saturated the aeration field everywhere.
    const wet = smoothstep(0, uniforms.wetDepth, next).toConst('wet');
    const breaking = smoothstep(uniforms.breakLow, uniforms.breakHigh, froude)
      .mul(uniforms.breakWeight)
      .add(steepness.mul(uniforms.steepWeight))
      .mul(mix(float(0.3), float(1), shallowness))
      .mul(wet)
      .toConst('breaking');

    const uv = uvOf(c);
    const carried = bilinear(
      heightRead,
      uv.sub(uvDrift(velocity).mul(uniforms.dt))
    ).w;
    const aeration = carried
      .mul(uniforms.aerationDecay.mul(uniforms.dt).oneMinus().max(0))
      .add(breaking.mul(uniforms.aerationBirth).mul(uniforms.dt))
      .clamp(0, 1)
      .toConst('aeration');

    // Only aerated water gets stirred, so calm water stays glassy and the
    // whitewater is the part that churns.
    const swirl = curlAt(
      world.mul(uniforms.churnScale),
      uniforms.phase.mul(uniforms.churnEvolve)
    ).mul(aeration.mul(uniforms.churnStrength));
    velocity.addAssign(swirl.mul(wet));

    textureStore(heightWrite, c, vec4(next, velocity.x, velocity.y, aeration));
  })().compute(res * res);
}

// Foam is a field carried by the water, not a shading trick on top of it.
// Advection alone smears it into soft bands; the reaction term is what turns
// those bands into reticulated lace. It is PetriDish's expansive solver's
// anti-diffusion: boosting the difference between a texel and its
// neighbourhood drives fronts apart instead of letting them relax.
//
// Three things keep that from degenerating into a one-texel dither, which is
// exactly what it did without them:
//
//  - the boost is measured against a WIDE blur, so the scale it amplifies is
//    the lace scale rather than the grid;
//  - the field is smoothed against a NARROW blur first, so there is no
//    texel-scale energy left for the boost to find;
//  - the advection is read at a sub-texel jitter, so the operator is not
//    perfectly grid-aligned frame after frame. Without this a dominant flow
//    direction blurs along its axis and the boost answers with stripes across
//    it.
//
// Both rates are per second and multiplied by dt, so the look does not change
// when the substep count does -- substeps are a stability knob, not an art
// one, and coupling the pattern to them made them one control.
export function createFoamPass({
  foam,
  heights,
  read,
  res,
  uniforms,
  worldSize,
  write,
}) {
  const { bilinear, clamped, coordOf, uvDrift, uvOf, worldOf } = gridHelpers(
    res,
    worldSize
  );
  const heightRead = readOnly(heights[write]);
  const foamRead = readOnly(foam[read]);
  const foamWrite = writeOnly(foam[write]);

  const blurAt = (c, weights, spread) => {
    const half = (weights.length - 1) / 2;
    const total = weights.reduce((a, b) => a + b, 0) ** 2;
    let sum = float(0);
    for (let y = -half; y <= half; y += 1) {
      for (let x = -half; x <= half; x += 1) {
        const weight = (weights[x + half] * weights[y + half]) / total;
        const offset = spread === 1 ? ivec2(x, y) : ivec2(x, y).mul(spread);
        sum = sum.add(foamRead.load(clamped(c.add(offset))).x.mul(weight));
      }
    }
    return sum;
  };

  // Sin-fract hash on normalised coordinates, salted per frame.
  const rand = (uv, salt) =>
    uv.x
      .mul(127.1)
      .add(uv.y.mul(311.7))
      .add(salt)
      .sin()
      .mul(43758.5453123)
      .fract();

  return Fn(() => {
    const c = coordOf();
    const state = heightRead.load(c).toConst('state');
    const depth = state.x.toConst('depth');
    const velocity = state.yz.toConst('velocity');
    const aeration = state.w.toConst('aeration');
    const uv = uvOf(c);

    const jitter = vec2(
      rand(uv, uniforms.phase),
      rand(uv, uniforms.phase.add(19.19))
    )
      .sub(0.5)
      .mul(uniforms.foamJitter)
      .div(res);
    const carried = bilinear(
      foamRead,
      uv
        .sub(uvDrift(velocity).mul(uniforms.dt).mul(uniforms.foamAdvect))
        .add(jitter)
    ).toConst('carried');

    const narrow = blurAt(c, NARROW_BLUR, 1).toConst('narrow');
    const wide = blurAt(c, WIDE_BLUR, uniforms.foamSpread).toConst('wide');

    const smoothed = mix(
      carried.x,
      narrow,
      uniforms.foamSmooth.mul(uniforms.dt).clamp(0, 1)
    ).toConst('smoothed');
    const sharpened = smoothed
      .add(smoothed.sub(wide).mul(uniforms.foamReaction.mul(uniforms.dt)))
      .toConst('sharpened');

    // Grain in the birth term rather than in the shading: fed through the
    // reaction it becomes structure, whereas a noise multiply on the output
    // would only speckle a smooth mask.
    const grain = mx_noise_float(
      vec3(worldOf(c).mul(uniforms.foamGrainScale), uniforms.phase.mul(0.3))
    )
      .mul(0.5)
      .add(0.5);
    const born = aeration
      .mul(mix(float(1).sub(uniforms.foamGrain), float(1), grain))
      .mul(uniforms.foamBirth)
      .toConst('born');

    // Foam cannot exist on dry rock, and it thins where the water gets deep
    // enough for the bubbles to be dragged under.
    const wet = smoothstep(0, uniforms.wetDepth, depth);
    const drowned = float(1).sub(
      smoothstep(
        uniforms.foamSinkDepth,
        uniforms.foamSinkDepth.mul(2.5),
        depth
      ).mul(uniforms.foamSink)
    );
    const next = sharpened
      .mul(uniforms.foamDecay.mul(uniforms.dt).oneMinus().max(0))
      .add(born.mul(uniforms.dt))
      .mul(wet)
      .mul(drowned)
      .clamp(0, 1)
      .toConst('next');

    // Freshness rides along with the foam and ages as it goes, so a bore's
    // leading edge stays white while the lace behind it greys off.
    const freshness = carried.y
      .mul(uniforms.foamAging.mul(uniforms.dt).oneMinus().max(0))
      .max(born.mul(uniforms.dt).mul(6).clamp(0, 1))
      .mul(wet)
      .clamp(0, 1);

    textureStore(foamWrite, c, vec4(next, freshness, 0, 1));
  })().compute(res * res);
}

// Reseating the water on a bed that has just changed shape.
//
// Depth is measured up from the bed, so re-uploading a new bed under an
// unchanged depth field moves the whole water SURFACE by however much the bed
// moved -- drag a rock slider and a two metre mound of water appears over each
// rock and then explodes outward. What has to be preserved across a rebake is
// the surface, not the column, so this reads the previous bed out of the field
// buffer's .z (the caller parks it there before uploading) and solves for the
// depth that leaves the surface where it was.
//
// Two passes because a storage texture cannot be read and written in one: the
// correction lands in the spare half, and the copy puts it back in the half
// everything else binds.
export function createRebasePass({ field, heights, res, worldSize }) {
  const { bedAt, coordOf } = gridHelpers(res, worldSize);
  const readHalf = readOnly(heights[0]);
  const writeHalf = writeOnly(heights[1]);

  return Fn(() => {
    const c = coordOf();
    const state = readHalf.load(c).toConst('state');
    const previousBed = fieldPrevious(field, c, res);
    const surface = previousBed.add(state.x);
    const depth = surface.sub(bedAt(field, c)).max(0);
    textureStore(writeHalf, c, vec4(depth, state.y, state.z, state.w));
  })().compute(res * res);
}

export function createRestorePass({ heights, res, worldSize }) {
  const { coordOf } = gridHelpers(res, worldSize);
  const readHalf = readOnly(heights[1]);
  const writeHalf = writeOnly(heights[0]);

  return Fn(() => {
    const c = coordOf();
    textureStore(writeHalf, c, readHalf.load(c));
  })().compute(res * res);
}

// The still surface the domain is filled to before the first substep. A coast
// floods to one flat sea level; a stream has to fill to a surface that follows
// its own bed downhill, which is what the baked reference in .w is for.
export function createFloodPass({
  field,
  flux,
  foam,
  heights,
  index,
  res,
  restSurface,
  sediment,
  uniforms,
  worldSize,
}) {
  const { bedAt, coordOf, fieldAt } = gridHelpers(res, worldSize);
  const heightWrite = writeOnly(heights[index]);
  const fluxWrite = writeOnly(flux[index]);
  const foamWrite = writeOnly(foam[index]);
  const sedimentWrite = writeOnly(sediment[index]);

  return Fn(() => {
    const c = coordOf();
    const surface = restSurface({
      cell: fieldAt(field, c),
      coord: c,
      uniforms,
    });
    const depth = surface.sub(bedAt(field, c)).max(0);
    textureStore(heightWrite, c, vec4(depth, 0, 0, 0));
    textureStore(fluxWrite, c, vec4(0));
    textureStore(foamWrite, c, vec4(0, 0, 0, 1));
    textureStore(sedimentWrite, c, vec4(0, 0, 0, 1));
  })().compute(res * res);
}
