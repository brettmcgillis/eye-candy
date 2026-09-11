import { instancedArray, uniform } from 'three/tsl';

import createFieldTexture from '@utils/storageField';

import { WARMUP_PAIRS, WARMUP_PER_FRAME } from './constants';
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

    this.uniforms = buildUniforms();

    const shared = {
      field: this.field,
      flux: this.flux,
      foam: this.foam,
      heights: this.heights,
      res: resolution,
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
    this.rebasePasses = [
      createRebasePass({
        field: this.field,
        heights: this.heights,
        res: resolution,
        worldSize,
      }),
      createRestorePass({ heights: this.heights, res: resolution, worldSize }),
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
    this.rebasePasses.forEach((pass) => renderer.compute(pass));
  }

  flood(renderer) {
    this.floodPasses.forEach((pass) => renderer.compute(pass));
    this.flooded = true;
    this.warmup = WARMUP_PAIRS;
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

  dispose() {
    [...this.heights, ...this.flux, ...this.foam].forEach((texture) =>
      texture.dispose()
    );
  }
}
