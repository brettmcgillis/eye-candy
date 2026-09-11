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
  CELL,
  GRAVITY,
  MIN_DEPTH,
  RESOLUTION,
  WAVE_MAKER_CELLS,
  WORLD_SIZE,
} from './constants';

const N = RESOLUTION;
const AREA = CELL * CELL;
const TAU = Math.PI * 2;

const coordOf = () =>
  ivec2(int(instanceIndex.mod(N)), int(instanceIndex.div(N)));
const clamped = (c) => ivec2(c.x.clamp(0, N - 1), c.y.clamp(0, N - 1));
const inside = (c) =>
  c.x
    .greaterThanEqual(0)
    .and(c.x.lessThan(N))
    .and(c.y.greaterThanEqual(0))
    .and(c.y.lessThan(N));

const bedAt = (bed, c) => {
  const cc = clamped(c);
  return bed.element(cc.y.mul(N).add(cc.x));
};

const worldXOf = (c) =>
  float(c.x)
    .div(N - 1)
    .sub(0.5)
    .mul(WORLD_SIZE);

// Driven by the solver's own `phase` uniform, never TSL's `time`: the time
// node is a render-group uniform and is not refreshed for compute passes, so
// a solver that reads it runs frozen while the materials around it animate.
//
// Two swell trains plus a slow group envelope, so sets arrive instead of a
// metronome. The along-shore terms are what stop every crest hitting the rocks
// as one straight line.
function swellSurface(uniforms, x) {
  const t = uniforms.phase;
  const w = float(TAU).div(uniforms.swellPeriod);
  const k = uniforms.swellSpread.mul(0.02);

  const wave = sin(t.mul(w).add(x.mul(k)))
    .add(
      sin(
        t
          .mul(w.mul(0.63))
          .sub(x.mul(k.mul(1.7)))
          .add(1.7)
      ).mul(0.6)
    )
    .add(
      sin(
        t
          .mul(w.mul(1.37))
          .add(x.mul(k.mul(0.4)))
          .add(4.1)
      ).mul(0.35)
    );

  const group = sin(t.mul(uniforms.swellGroupRate)).mul(0.35).add(0.65);
  return uniforms.seaLevel.add(wave.mul(uniforms.swellAmplitude).mul(group));
}

// Virtual-pipe shallow water (Mei/Decaudin/Neyret): each cell pushes flux to
// its four neighbours proportional to the surface-height difference, then the
// flux is scaled back so a cell can never drain more than it holds. That clamp
// is what makes wetting and drying over rock stable rather than explosive.
export function createFluxPass({ bed, flux, heights, read, uniforms, write }) {
  const heightRead = readOnly(heights[read]);
  const fluxRead = readOnly(flux[read]);
  const fluxWrite = writeOnly(flux[write]);

  return Fn(() => {
    const c = coordOf();
    const depth = heightRead.load(c).x.toConst('depth');
    const surface = bedAt(bed, c).add(depth).toConst('surface');
    const previous = fluxRead.load(c).toConst('previous');

    const outflow = (prior, dx, dy) => {
      const nc = clamped(c.add(ivec2(dx, dy)));
      const neighbour = bedAt(bed, nc).add(heightRead.load(nc).x);
      const drop = surface.sub(neighbour);
      return prior
        .mul(uniforms.damping)
        .add(
          uniforms.dt.mul(uniforms.pipeArea).mul(GRAVITY).mul(drop).div(CELL)
        )
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
        depth.mul(AREA).div(total.mul(uniforms.dt)).clamp(0, 1),
        float(1)
      );

    textureStore(fluxWrite, c, next.mul(scale));
  })().compute(N * N);
}

export function createHeightPass({
  bed,
  flux,
  heights,
  read,
  uniforms,
  write,
}) {
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
      .add(uniforms.dt.mul(inflow.sub(outflow)).div(AREA))
      .max(0)
      .toVar('next');

    const shoreward = float(1)
      .sub(smoothstep(0, WAVE_MAKER_CELLS, float(c.y)))
      .toConst('shoreward');
    const target = swellSurface(uniforms, worldXOf(c))
      .sub(bedAt(bed, c))
      .max(0);
    next.assign(
      mix(next, target, shoreward.mul(uniforms.swellDrive).clamp(0, 1))
    );

    const average = depth.add(next).mul(0.5).max(MIN_DEPTH).toConst('average');
    const dWx = left.y.sub(own.x).add(own.y).sub(right.x).mul(0.5);
    const dWz = bottom.z.sub(own.w).add(own.z).sub(top.w).mul(0.5);
    const velocity = vec2(dWx, dWz)
      .div(average.mul(CELL))
      .mul(uniforms.drag.oneMinus())
      .toConst('velocity');

    textureStore(heightWrite, c, vec4(next, velocity.x, velocity.y, 0));
  })().compute(N * N);
}

// Foam is its own advected field rather than a shading trick: it is born where
// the flow is breaking or the surface is steep, carried by the water's own
// velocity, and pushed sideways by curl noise so the streaks tear into the
// filigree the reference footage has.
export function createFoamPass({ bed, foam, heights, read, uniforms, write }) {
  const heightRead = readOnly(heights[write]);
  const foamRead = readOnly(foam[read]);
  const foamWrite = writeOnly(foam[write]);

  const sampleFoam = (uv) => {
    const p = uv.mul(N).sub(0.5);
    const base = ivec2(floor(p));
    const f = p.sub(floor(p));
    const at = (dx, dy) => foamRead.load(clamped(base.add(ivec2(dx, dy)))).x;
    return mix(mix(at(0, 0), at(1, 0), f.x), mix(at(0, 1), at(1, 1), f.x), f.y);
  };

  return Fn(() => {
    const c = coordOf();
    const state = heightRead.load(c).toConst('state');
    const depth = state.x.toConst('depth');
    const velocity = state.yz.toConst('velocity');
    const uv = vec2(c).add(0.5).div(N).toConst('uv');

    const noiseAt = vec3(
      uv.mul(uniforms.foamNoiseScale),
      uniforms.phase.mul(0.12)
    );
    const jitter = vec2(
      mx_noise_float(noiseAt),
      mx_noise_float(noiseAt.add(vec3(11.3, 7.7, 3.1)))
    ).mul(uniforms.foamNoise);

    const previous = uv.sub(
      velocity
        .add(jitter)
        .mul(uniforms.dt)
        .mul(uniforms.foamAdvect)
        .div(WORLD_SIZE)
    );
    const carried = sampleFoam(previous).toConst('carried');

    const speed = velocity.length();
    const froude = speed.div(depth.max(MIN_DEPTH).mul(GRAVITY).sqrt());
    const breaking = smoothstep(uniforms.breakLow, uniforms.breakHigh, froude);

    const surface = bedAt(bed, c).add(depth);
    const stepX = c.add(ivec2(1, 0));
    const stepZ = c.add(ivec2(0, 1));
    const steepness = vec2(
      bedAt(bed, stepX)
        .add(heightRead.load(clamped(stepX)).x)
        .sub(surface),
      bedAt(bed, stepZ)
        .add(heightRead.load(clamped(stepZ)).x)
        .sub(surface)
    )
      .length()
      .div(CELL);

    const shallow = float(1)
      .sub(smoothstep(0, uniforms.shallowDepth, depth))
      .mul(0.7)
      .add(0.3);
    const born = breaking
      .mul(uniforms.breakWeight)
      .add(steepness.mul(uniforms.steepWeight))
      .mul(shallow)
      .mul(uniforms.foamBirth);

    const wet = smoothstep(0, uniforms.wetDepth, depth);
    const next = carried
      .mul(uniforms.foamDecay.mul(uniforms.dt).oneMinus().max(0))
      .add(born.mul(uniforms.dt))
      .mul(wet)
      .clamp(0, 1);

    textureStore(foamWrite, c, vec4(next, 0, 0, 1));
  })().compute(N * N);
}

export function createFloodPass({ bed, flux, foam, heights, index, uniforms }) {
  const heightWrite = writeOnly(heights[index]);
  const fluxWrite = writeOnly(flux[index]);
  const foamWrite = writeOnly(foam[index]);

  return Fn(() => {
    const c = coordOf();
    const depth = uniforms.seaLevel.sub(bedAt(bed, c)).max(0);
    textureStore(heightWrite, c, vec4(depth, 0, 0, 0));
    textureStore(fluxWrite, c, vec4(0));
    textureStore(foamWrite, c, vec4(0, 0, 0, 1));
  })().compute(N * N);
}
