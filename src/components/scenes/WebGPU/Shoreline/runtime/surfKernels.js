/* eslint-disable camelcase */
import {
  Fn,
  float,
  floor,
  instanceIndex,
  int,
  ivec2,
  mix,
  mx_noise_float,
  sin,
  smoothstep,
  textureStore,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';

import { readOnly, writeOnly } from '@utils/storageField';

import {
  GRAVITY,
  MIN_DEPTH,
  SPEED_LIMIT,
  VELOCITY_FLOOR,
  WAVE_MAKER_CELLS,
  WORLD_SIZE,
} from './constants';

const TAU = Math.PI * 2;
const TRAIN_SUM = 1 + 0.55 + 0.3;

// The bed the previous bake wrote, parked in .z of the coast buffer.
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

// Everything below is parameterised on the grid size rather than reading a
// module constant, because the solver resolution is a scene control: changing
// it rebuilds these kernels instead of reinterpreting a fixed one.
function gridHelpers(res) {
  const cell = WORLD_SIZE / res;

  const coordOf = () =>
    ivec2(int(instanceIndex.mod(res)), int(instanceIndex.div(res)));
  const clamped = (c) => ivec2(c.x.clamp(0, res - 1), c.y.clamp(0, res - 1));
  const inside = (c) =>
    c.x
      .greaterThanEqual(0)
      .and(c.x.lessThan(res))
      .and(c.y.greaterThanEqual(0))
      .and(c.y.lessThan(res));

  const bedAt = (field, c) => {
    const cc = clamped(c);
    return field.element(cc.y.mul(res).add(cc.x)).x;
  };

  // Row 0 is the deep edge at +z, so world z runs backwards through the grid.
  const worldOf = (c) =>
    vec2(
      float(c.x)
        .div(res - 1)
        .sub(0.5)
        .mul(WORLD_SIZE),
      float(0.5)
        .sub(float(c.y).div(res - 1))
        .mul(WORLD_SIZE)
    );

  const uvOf = (c) => vec2(c).add(0.5).div(res);

  // Velocity is stored in world space so the grains can use it unchanged.
  // Walking a uv back along it therefore has to flip z, which is the one place
  // that sign lives.
  const uvDrift = (velocity) =>
    vec2(velocity.x, velocity.y.negate()).div(WORLD_SIZE);

  const bilinear = (source, uv) => {
    const p = uv.mul(res).sub(0.5);
    const base = ivec2(floor(p));
    const f = p.sub(floor(p));
    const at = (dx, dy) => source.load(clamped(base.add(ivec2(dx, dy))));
    return mix(mix(at(0, 0), at(1, 0), f.x), mix(at(0, 1), at(1, 1), f.x), f.y);
  };

  return {
    bedAt,
    bilinear,
    cell,
    clamped,
    coordOf,
    inside,
    uvDrift,
    uvOf,
    worldOf,
  };
}

// Driven by the solver's own `phase` uniform, never TSL's `time`: the time
// node is a render-group uniform and is not refreshed for compute passes, so a
// solver that reads it runs frozen while the materials around it animate.
//
// Three trains plus a group envelope, so sets arrive instead of a metronome.
// `swellKx` is the along-shore wavenumber, which is what makes crests reach the
// rock at an angle and peel along it rather than landing as one flat line.
function swellSurface(uniforms, worldX) {
  const t = uniforms.phase;
  const w = float(TAU).div(uniforms.swellPeriod);
  const k = uniforms.swellKx;

  const train = sin(t.mul(w).add(worldX.mul(k)))
    .add(
      sin(
        t
          .mul(w.mul(0.61))
          .add(worldX.mul(k.mul(-1.6)))
          .add(1.7)
      ).mul(0.55)
    )
    .add(
      sin(
        t
          .mul(w.mul(1.43))
          .add(worldX.mul(k.mul(0.45)))
          .add(4.1)
      ).mul(0.3)
    );

  const group = sin(t.mul(uniforms.swellGroupRate)).mul(0.32).add(0.68);
  // Normalised by the sum of the three amplitudes, so Amplitude is the wave
  // height it says it is. Unnormalised the three trains stacked to 1.85x and
  // the maker was emitting a wave taller than the water it stood in.
  return uniforms.seaLevel.add(
    train.mul(uniforms.swellAmplitude).mul(group).div(TRAIN_SUM)
  );
}

// Curl of a scalar noise potential: divergence-free in the plane, so it stirs
// and folds the surface without inventing water. This is the small-scale
// churn the pipe solve cannot resolve -- its cells are 12cm and the eddies
// that tear foam into filigree are finer than that.
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
  write,
}) {
  const { bedAt, cell, clamped, coordOf } = gridHelpers(res);
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
      // sqrt(pipeArea * g / cell): no depth term at all. The waves then neither
      // slow nor steepen nor grow as they shoal, which measured as a surface
      // swing that FELL from 1.70m offshore to 0.66m at the break. Nothing can
      // crash when the shelf is taking energy out of the wave.
      //
      // Scaled by depth instead, the celerity is sqrt(pipeArea * g * h), which
      // is the shallow-water wave speed. Waves slow and stand up over the reef,
      // which is what puts a bore front on the rock. The larger of the two
      // depths is what keeps a wetting front moving onto dry ground.
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
export function createHeightPass({
  field,
  flux,
  heights,
  read,
  res,
  uniforms,
  write,
}) {
  const {
    bedAt,
    bilinear,
    cell,
    clamped,
    coordOf,
    inside,
    uvDrift,
    uvOf,
    worldOf,
  } = gridHelpers(res);
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

    const maker = float(1)
      .sub(smoothstep(0, WAVE_MAKER_CELLS, float(c.y)))
      .toConst('maker');
    const world = worldOf(c).toConst('world');
    const target = swellSurface(uniforms, world.x).sub(bedAt(field, c)).max(0);
    next.assign(mix(next, target, maker.mul(uniforms.swellDrive).clamp(0, 1)));

    const average = depth.add(next).mul(0.5).max(MIN_DEPTH).toConst('average');
    const dGridX = left.y.sub(own.x).add(own.y).sub(right.x).mul(0.5);
    const dGridY = bottom.z.sub(own.w).add(own.z).sub(top.w).mul(0.5);
    // Flux over depth, so a cell holding a millimetre of water reports a
    // singularity: this measured 44 m/s along the waterline before the floor
    // and the cap went in.
    const floored = average.max(VELOCITY_FLOOR).toConst('floored');
    const velocity = vec2(dGridX, dGridY.negate())
      .div(floored.mul(cell))
      .mul(uniforms.drag.oneMinus())
      .toVar('velocity');
    const speed = velocity.length().max(1e-6).toVar('speed');
    velocity.mulAssign(speed.min(SPEED_LIMIT).div(speed));

    // Froude number: above 1 the flow outruns the wave that would carry it
    // away, which is the condition for a hydraulic jump -- a bore face.
    const froude = velocity.length().div(floored.mul(GRAVITY).sqrt());
    const surface = bedAt(field, c).add(next);
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

    // Only aerated water gets stirred, so calm sea stays glassy and the
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
// those bands into the reticulated lace the reference has. It is PetriDish's
// expansive solver's anti-diffusion: boosting the difference between a texel
// and its neighbourhood drives fronts apart instead of letting them relax.
//
// Three things keep that from degenerating into a one-texel dither, which is
// exactly what it did without them:
//
//  - the boost is measured against a WIDE blur, so the scale it amplifies is
//    the lace scale rather than the grid;
//  - the field is smoothed against a NARROW blur first, so there is no
//    texel-scale energy left for the boost to find;
//  - the advection is read at a sub-texel jitter, so the operator is not
//    perfectly grid-aligned frame after frame. Without this the dominant
//    shoreward flow blurs along z and the boost answers with stripes along x.
//
// Both rates are per second and multiplied by dt, so the look does not change
// when the substep count does -- substeps are a stability knob, not an art
// one, and coupling the pattern to them made them one control.
export function createFoamPass({ foam, heights, read, res, uniforms, write }) {
  const { bilinear, clamped, coordOf, uvDrift, uvOf, worldOf } =
    gridHelpers(res);
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
// moved -- drag the sea stack slider and a two metre mound of water appears
// over each stack and then explodes outward. What has to be preserved across a
// rebake is the surface, not the column, so this reads the previous bed out of
// the coast buffer's .z (the caller parks it there before uploading) and
// solves for the depth that leaves the surface where it was.
//
// Two passes because a storage texture cannot be read and written in one: the
// correction lands in the spare half, and the copy puts it back in the half
// everything else binds.
export function createRebasePass({ field, heights, res }) {
  const { bedAt, coordOf } = gridHelpers(res);
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

export function createRestorePass({ heights, res }) {
  const { coordOf } = gridHelpers(res);
  const readHalf = readOnly(heights[1]);
  const writeHalf = writeOnly(heights[0]);

  return Fn(() => {
    const c = coordOf();
    textureStore(writeHalf, c, readHalf.load(c));
  })().compute(res * res);
}

export function createFloodPass({
  field,
  flux,
  foam,
  heights,
  index,
  res,
  uniforms,
}) {
  const { bedAt, coordOf } = gridHelpers(res);
  const heightWrite = writeOnly(heights[index]);
  const fluxWrite = writeOnly(flux[index]);
  const foamWrite = writeOnly(foam[index]);

  return Fn(() => {
    const c = coordOf();
    const depth = uniforms.seaLevel.sub(bedAt(field, c)).max(0);
    textureStore(heightWrite, c, vec4(depth, 0, 0, 0));
    textureStore(fluxWrite, c, vec4(0));
    textureStore(foamWrite, c, vec4(0, 0, 0, 1));
  })().compute(res * res);
}
