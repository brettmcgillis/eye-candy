import { instancedArray, uniform, vec2 } from 'three/tsl';

import createFieldTexture from '@utils/storageField';

import { createBedBrushPass, createWaterBrushPass } from './brush/brushKernels';
import { REFLOOD_PAIRS, WARMUP_PAIRS, WARMUP_PER_FRAME } from './constants';
import { createErosionPass, createSedimentRestorePass } from './morphology';
import {
  createFloodPass,
  createFluxPass,
  createFoamPass,
  createHeightPass,
  createRebasePass,
  createRestorePass,
} from './waterKernels';

function buildUniforms() {
  return {
    aerationBirth: uniform(2.4),
    aerationDecay: uniform(0.7),
    breakHigh: uniform(0.75),
    breakLow: uniform(0.2),
    breakWeight: uniform(1.3),
    churnEvolve: uniform(0.35),
    churnScale: uniform(0.5),
    churnStrength: uniform(1.6),
    friction: uniform(0.12),
    drag: uniform(0.02),
    dt: uniform(1 / 240),
    foamAdvect: uniform(1),
    foamAging: uniform(0.5),
    foamBirth: uniform(2.2),
    foamDecay: uniform(0.45),
    foamGrain: uniform(0.6),
    foamGrainScale: uniform(1.4),
    foamJitter: uniform(1),
    foamReaction: uniform(22),
    foamSink: uniform(0.6),
    foamSinkDepth: uniform(1.6),
    foamSmooth: uniform(34),
    foamSpread: uniform(2, 'int'),
    bedCarry: uniform(0.6),
    bedDeposit: uniform(1.2),
    bedErode: uniform(0.8),
    bedLimit: uniform(0.25),
    bedMinSlope: uniform(0.02),
    bedResist: uniform(0.5),
    carryDepth: uniform(0.5),
    phase: uniform(0),
    pipeArea: uniform(1),
    restLevel: uniform(0),
    shallowDepth: uniform(1.4),
    steepWeight: uniform(1.5),
    wetDepth: uniform(0.08),
  };
}

const FLAT_SURFACE = ({ uniforms }) => uniforms.restLevel;

// Shallow water, aeration and foam over one baked bed. The three fields are
// separate textures but one pipeline: depth feeds aeration, aeration feeds
// foam, and the velocity the depth pass derives is what carries both of them
// and, downstream of here, the grains.
//
// A scene supplies a `driver`, which is everything about the water that is not
// the solve: the uniforms its own controls move, the boundary that puts water
// into the domain (`force`), and the surface the domain is flooded to at rest
// (`restSurface`). A wave maker at a deep edge and a stream inflow with an
// outfall below it are the same kernel with different drivers.
export default class WaterSolver {
  constructor({ driver, field, resolution, worldSize }) {
    this.driver = driver;
    this.res = resolution;
    this.field = instancedArray(field, 'vec4').setName('shallowWaterBed');

    const size = () => createFieldTexture(resolution, resolution);
    this.heights = [size(), size()];
    this.flux = [size(), size()];
    this.foam = [size(), size()];
    // Suspended load. Its own pair rather than a spare channel of the foam
    // texture: foam is advected with the foam's own jitter and spread, and
    // sediment has no business inheriting either.
    this.sediment = [size(), size()];

    this.uniforms = buildUniforms();

    const shared = {
      field: this.field,
      flux: this.flux,
      foam: this.foam,
      heights: this.heights,
      res: resolution,
      sediment: this.sediment,
      uniforms: this.uniforms,
      worldSize,
    };

    // Substeps run as 0 -> 1 -> 0 pairs so the settled half is always index 0.
    // The grain kernel binds those textures once and never rebinds.
    this.pipelines = [0, 1].map((read) => {
      const write = 1 - read;
      const stage = { ...shared, read, write };
      return [
        createFluxPass(stage),
        createHeightPass({ ...stage, force: driver.force }),
        createFoamPass(stage),
      ];
    });

    this.floodPasses = [0, 1].map((index) =>
      createFloodPass({
        ...shared,
        index,
        restSurface: driver.restSurface || FLAT_SURFACE,
      })
    );
    this.rebasePass = createRebasePass({
      field: this.field,
      heights: this.heights,
      res: resolution,
      worldSize,
    });
    this.restorePass = createRestorePass({
      heights: this.heights,
      res: resolution,
      worldSize,
    });

    // One stroke's worth of brush, shared by both kernels. Whether the stroke
    // is a dome or a push, and whether it lands on the bed or on the water, is
    // all carried in which of the four gains is non-zero.
    this.brush = {
      centre: uniform(vec2(0, 0)),
      domeGain: uniform(0),
      drag: uniform(vec2(0, 0)),
      pushGain: uniform(0),
      radius: uniform(2),
      waterLift: uniform(0),
      waterPush: uniform(0),
    };
    const brushStage = { brush: this.brush, res: resolution, worldSize };
    this.bedBrushPass = createBedBrushPass({
      ...brushStage,
      field: this.field,
    });
    this.waterBrushPass = createWaterBrushPass({
      ...brushStage,
      heights: this.heights,
    });

    this.erosionPasses = [
      createErosionPass({
        field: this.field,
        heights: this.heights,
        res: resolution,
        sediment: this.sediment,
        uniforms: this.uniforms,
        worldSize,
      }),
      createSedimentRestorePass({
        res: resolution,
        sediment: this.sediment,
        worldSize,
      }),
    ];

    this.flooded = false;
    this.warmup = WARMUP_PAIRS;
  }

  get heightTexture() {
    return this.heights[0];
  }

  get foamTexture() {
    return this.foam[0];
  }

  // A new bed under the running water. The field buffer's .z must already hold
  // the bed this water was last solved against; see createRebasePass for why
  // the surface rather than the depth is what gets preserved.
  rebake(renderer, field) {
    this.field.value.array.set(field);
    this.field.value.needsUpdate = true;
    renderer.compute(this.rebasePass);
    renderer.compute(this.restorePass);
  }

  // One brush stroke. The bed half runs the same rebase the rebake does, so
  // the water is re-seated on the ground the stroke just moved; the water half
  // only has to be copied back out of the spare half, because a storage
  // texture cannot be read and written in the same pass.
  //
  // The CPU's copy of the bed is deliberately NOT updated. It is the bake, and
  // the next time a terrain control moves it is uploaded whole and the
  // sculpting is gone -- which is the behaviour a terrain slider has to have.
  sculpt(renderer, brush) {
    const u = this.brush;
    u.centre.value.set(brush.x, brush.z);
    u.drag.value.set(brush.dx, brush.dz);
    u.radius.value = brush.radius;
    u.domeGain.value = brush.domeGain;
    u.pushGain.value = brush.pushGain;
    u.waterLift.value = brush.waterLift;
    u.waterPush.value = brush.waterPush;

    if (brush.domeGain !== 0 || brush.pushGain !== 0) {
      renderer.compute(this.bedBrushPass);
      renderer.compute(this.rebasePass);
      renderer.compute(this.restorePass);
    }
    if (brush.waterLift !== 0 || brush.waterPush !== 0) {
      renderer.compute(this.waterBrushPass);
      renderer.compute(this.restorePass);
    }
  }

  flood(renderer, pairs = WARMUP_PAIRS) {
    this.floodPasses.forEach((pass) => renderer.compute(pass));
    this.flooded = true;
    this.warmup = pairs;
  }

  // A new bed whose REST SURFACE has moved, which is a different question from
  // a new bed under the same one. Rebasing preserves the surface that was
  // there, and on a reach that is the wrong answer: change the gradient and
  // the datum tilts, so preserving the old surface leaves the upper reach dry
  // and the lower reach ponded, with no warm-up left to dig itself out. That
  // is a scene that has stopped rather than a scene that is settling.
  //
  // Reflooding reseats the whole domain on the new surface and re-arms the
  // warm-up, so the reach is running again within a second.
  reflood(renderer, field) {
    this.field.value.array.set(field);
    this.field.value.needsUpdate = true;
    this.flood(renderer, REFLOOD_PAIRS);
  }

  update(config) {
    const u = this.uniforms;
    u.aerationBirth.value = config.aerationBirth;
    u.aerationDecay.value = config.aerationDecay;
    u.breakHigh.value = Math.max(config.breakLow + 0.05, config.breakHigh);
    u.breakLow.value = config.breakLow;
    u.breakWeight.value = config.breakWeight;
    u.churnEvolve.value = config.churnEvolve;
    u.churnScale.value = config.churnScale;
    u.churnStrength.value = config.churnStrength;
    u.friction.value = config.friction;
    u.drag.value = config.bedDrag;
    u.foamAdvect.value = config.foamAdvect;
    u.foamAging.value = config.foamAging;
    u.foamBirth.value = config.foamBirth;
    u.foamDecay.value = config.foamDecay;
    u.foamGrain.value = config.foamGrain;
    u.foamGrainScale.value = config.foamGrainScale;
    u.foamJitter.value = config.foamJitter;
    u.foamReaction.value = config.foamReaction;
    u.foamSink.value = config.foamSink;
    u.foamSinkDepth.value = config.foamSinkDepth;
    u.foamSmooth.value = config.foamSmooth;
    u.foamSpread.value = Math.max(1, Math.round(config.foamSpread));
    u.pipeArea.value = config.pipeArea;
    u.shallowDepth.value = config.shallowDepth;
    u.steepWeight.value = config.steepWeight;
    u.wetDepth.value = config.wetDepth;
    u.bedCarry.value = config.bedCarry;
    u.bedDeposit.value = config.bedDeposit;
    u.bedErode.value = config.bedErode;
    u.bedLimit.value = config.bedLimit;
    u.bedResist.value = config.bedResist;
    u.carryDepth.value = config.carryDepth;

    this.driver.update(config, u);
  }

  step(renderer, delta, config) {
    if (!this.flooded) this.flood(renderer);

    const pairs = Math.max(1, Math.round(config.substeps / 2));
    const scaled = Math.min(delta, 1 / 30) * config.timeScale;
    this.uniforms.dt.value = scaled / (pairs * 2);

    // The warm-up is spread over the first frames rather than burned in one
    // blocking burst: the scene has to open on water that is already running,
    // and a 900-pair flood done at once is a visible stall on the first frame.
    const extra = Math.min(this.warmup, WARMUP_PER_FRAME);
    this.warmup -= extra;
    const total = pairs + extra;
    this.uniforms.phase.value += (scaled * total) / pairs;

    for (let i = 0; i < total; i += 1) {
      renderer.compute(this.pipelines[0]);
      renderer.compute(this.pipelines[1]);
    }
  }

  // The bed answering the water back, once per frame. `dt` is the solver's own
  // substep at this point, which is far too small to move a bed by: erosion is
  // given the whole frame it actually gets to act over, scaled by the same
  // Time Scale everything else answers to.
  erode(renderer, delta, config) {
    this.uniforms.dt.value = Math.min(delta, 1 / 30) * config.timeScale;
    renderer.compute(this.erosionPasses[0]);
    renderer.compute(this.erosionPasses[1]);
    renderer.compute(this.rebasePass);
    renderer.compute(this.restorePass);
  }

  dispose() {
    [...this.heights, ...this.flux, ...this.foam, ...this.sediment].forEach(
      (texture) => texture.dispose()
    );
  }
}
