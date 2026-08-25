import {
  Fn,
  float,
  max,
  min,
  step as stepNode,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { createPaperTexture } from './paper';
import { PIGMENT_SLOTS, kubelkaMunkReflectance } from './pigments';

// Curtis et al., "Computer-Generated Watercolor" (SIGGRAPH 1997) — the same
// model the reference this scene is chasing credits, and the same one this file
// used to implement one pass per step named in the paper. That version was
// faithful to the pseudocode's structure and unusably slow: 21 full-screen
// passes per step, 12 of them Jacobi pressure relaxation, measuring ~16ms of
// CPU submission before any GPU work at all.
//
// This is the same physics fused the way an interactive watercolour sim has to
// be written — three passes per step:
//
//   water      velocity, capillary spread, evaporation, wet mask
//   suspended  pigment carried by the fluid, minus what settles out of it
//   deposited  pigment bound to the paper, minus what lifts back off it
//
// Kubelka-Munk runs only where it is looked at, in the material's colour node,
// never inside the loop.
//
// Deliberate departures from the paper, each load-bearing:
//
//   No pressure projection. Curtis relaxes divergence to zero every step; that
//   iteration was the single largest cost here. Flow is driven directly by the
//   gradient of the wet-height field (saturation plus paper tooth), which
//   produces the same outward creep toward a wet edge.
//
//   Edge darkening from the local saturation gradient rather than from a
//   blurred copy of the wet mask. Same rim, no separable blur passes.
//
//   Velocities are staggered in collocated storage — a cell's u is the flux
//   through its right face. Treating them as truly collocated decouples odd and
//   even cells, and the checkerboard that follows reads as a diagonal hatch
//   across the whole blot.

const DEFAULT_PARAMS = {
  capillary: 0.14,
  drag: 0.06,
  edgeStrength: 0.9,
  evaporation: 0.0015,
  flow: 0.34,
  maxConcentration: 1.6,
  sharpness: 0,
  suspendedTint: 0.55,
  timeStep: 0.4,
  wetThreshold: 0.02,
};

function createField(resolution) {
  const options = {
    depthBuffer: false,
    magFilter: THREE.NearestFilter,
    minFilter: THREE.NearestFilter,
    type: THREE.HalfFloatType,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
  };
  const read = new THREE.RenderTarget(resolution, resolution, options);
  const write = new THREE.RenderTarget(resolution, resolution, options);
  // One sampler node per field, repointed on swap. A graph built against
  // `read.texture` keeps sampling that exact texture, so after the first swap a
  // pass would read the very target it is writing — which WebGPU rejects.
  const node = texture(read.texture);

  return {
    node,
    read,
    write,
    swap() {
      const previous = this.read;
      this.read = this.write;
      this.write = previous;
      node.value = this.read.texture;
    },
  };
}

export default function createWatercolorSim({
  paperGrain = 0.5,
  params = {},
  renderer,
  resolution = 512,
  seed = 0,
} = {}) {
  const settings = { ...DEFAULT_PARAMS, ...params };
  const texel = 1 / resolution;

  const water = createField(resolution);
  const suspended = createField(resolution);
  const deposited = createField(resolution);
  const splatTarget = new THREE.RenderTarget(resolution, resolution, {
    depthBuffer: false,
    magFilter: THREE.NearestFilter,
    minFilter: THREE.NearestFilter,
    type: THREE.HalfFloatType,
  });

  const paperTexture = createPaperTexture({
    grain: paperGrain,
    resolution,
    seed,
  });

  const uniforms = {
    absorption: Array.from({ length: PIGMENT_SLOTS }, () =>
      uniform(new THREE.Vector3(0.5, 0.5, 0.5))
    ),
    capillary: uniform(settings.capillary),
    density: Array.from({ length: PIGMENT_SLOTS }, () => uniform(0.8)),
    drag: uniform(settings.drag),
    edgeStrength: uniform(settings.edgeStrength),
    evaporation: uniform(settings.evaporation),
    flow: uniform(settings.flow),
    granulation: Array.from({ length: PIGMENT_SLOTS }, () => uniform(0.4)),
    maxConcentration: uniform(settings.maxConcentration),
    paperColor: uniform(new THREE.Vector3(0.96, 0.945, 0.91)),
    scattering: Array.from({ length: PIGMENT_SLOTS }, () =>
      uniform(new THREE.Vector3(1, 1, 1))
    ),
    sharpness: uniform(settings.sharpness),
    // 1 only on the step that follows a brush flush, so a deposit is absorbed
    // exactly once instead of being re-added on every step after it.
    splatGain: uniform(0),
    staining: Array.from({ length: PIGMENT_SLOTS }, () => uniform(0.6)),
    suspendedTint: uniform(settings.suspendedTint),
    timeStep: uniform(settings.timeStep),
    wetThreshold: uniform(settings.wetThreshold),
  };

  const paperNode = texture(paperTexture);
  const splatNode = texture(splatTarget.texture);

  const offset = (dx, dy) => vec2(dx * texel, dy * texel);
  // Clamped to texel centres so a neighbour lookup at the border samples the
  // edge cell instead of wrapping to the far side of the paper.
  const at = (field, dx, dy) =>
    field.node.sample(
      uv()
        .add(offset(dx, dy))
        .clamp(texel * 0.5, 1 - texel * 0.5)
    );
  const sample = (field) => field.node.sample(uv());
  const ceiling = () =>
    vec4(
      uniforms.maxConcentration,
      uniforms.maxConcentration,
      uniforms.maxConcentration,
      uniforms.maxConcentration
    );

  const quad = new THREE.QuadMesh(new THREE.NodeMaterial());
  const materials = [];

  // transparent + NoBlending, never opaque: an opaque NodeMaterial forces the
  // output alpha to 1, and every field here carries real data in its fourth
  // channel — the wet mask for water, the fourth pigment for the others.
  function pass(colorNode) {
    const material = new THREE.NodeMaterial();
    material.colorNode = colorNode;
    material.blending = THREE.NoBlending;
    material.depthTest = false;
    material.depthWrite = false;
    material.transparent = true;
    materials.push(material);
    return material;
  }

  function run(material, target) {
    quad.material = material;
    renderer.setRenderTarget(target);
    quad.render(renderer);
  }

  const clearMaterial = pass(vec4(0, 0, 0, 0));

  // What the last brush flush delivered to this cell, or nothing once absorbed.
  const splatHere = () => splatNode.sample(uv()).mul(uniforms.splatGain);

  // --- pass 1: water ------------------------------------------------------
  // (u, v, saturation, wetMask). Flow follows the gradient of saturation plus
  // paper tooth, so fluid creeps from where it is wet toward where it is dry —
  // the outward drift Curtis gets from relaxing pressure and blurring the mask,
  // at a handful of fetches instead of fourteen passes.
  const waterPass = pass(
    Fn(() => {
      const here = sample(water);
      const left = at(water, -1, 0);
      const right = at(water, 1, 0);
      const below = at(water, 0, -1);
      const above = at(water, 0, 1);
      const paper = paperNode.sample(uv());

      const landed = splatHere();
      const delivered = landed.x.add(landed.y).add(landed.z).add(landed.w);

      // Absorb what the brush delivered, exchange with the neighbours up to
      // this cell's capacity, and lose a little to the air.
      const soaked = max(here.z, stepNode(1e-5, delivered).mul(paper.y));
      const neighbourMean = left.z
        .add(right.z)
        .add(below.z)
        .add(above.z)
        .mul(0.25);
      const spread = neighbourMean
        .sub(soaked)
        .mul(uniforms.capillary)
        .mul(min(paper.y.sub(soaked).max(0).add(0.25), 1));
      const saturation = soaked
        .add(spread)
        .sub(uniforms.evaporation)
        .clamp(0, 1);

      // Wet height: saturation carried over the paper's own tooth.
      const height = (cell) => cell.z.add(paper.x.mul(0.06));
      const slopeX = height(left).sub(height(right)).mul(0.5);
      const slopeY = height(below).sub(height(above)).mul(0.5);

      const inside = stepNode(uniforms.wetThreshold, saturation);
      const velocityU = here.x
        .add(slopeX.mul(uniforms.flow).mul(uniforms.timeStep))
        .mul(float(1).sub(uniforms.drag))
        .mul(inside)
        .clamp(-0.9, 0.9);
      const velocityV = here.y
        .add(slopeY.mul(uniforms.flow).mul(uniforms.timeStep))
        .mul(float(1).sub(uniforms.drag))
        .mul(inside)
        .clamp(-0.9, 0.9);

      return vec4(velocityU, velocityV, saturation, inside);
    })()
  );

  // Pigment leaving suspension for the paper, and lifting back off it. Both
  // pigment passes compute this identically from the same pre-update state, so
  // whichever runs second still sees the values the first one read.
  function transferDeltas() {
    const paper = paperNode.sample(uv());
    const carried = sample(suspended);
    const settled = sample(deposited);
    const flow = sample(water);
    const wet = flow.w;
    const wetness = flow.z;
    // Settled pigment only lifts where the water is actually moving. Gating
    // lift on wetness alone bleeds a finished blot back into suspension at
    // ~10% a step, so it peaks around step three and has faded by step twenty —
    // paint that dissolves itself as it dries.
    const agitation = flow.x.abs().add(flow.y.abs()).clamp(0, 1);

    const down = [];
    const up = [];
    for (let slot = 0; slot < PIGMENT_SLOTS; slot += 1) {
      const granulation = uniforms.granulation[slot];
      const density = uniforms.density[slot];
      const staining = uniforms.staining[slot];
      const g = carried.element(slot);
      const d = settled.element(slot);

      // Pigment settles faster the drier the cell is, so the last place to
      // hold water keeps the least paint and the rim keeps the most — the dark
      // edge a real wash dries into.
      const drying = float(1).add(
        float(1).sub(wetness).mul(uniforms.edgeStrength)
      );
      const rawDown = g
        .mul(float(1).sub(paper.x.mul(granulation)))
        .mul(density)
        .mul(drying)
        .mul(uniforms.timeStep);
      const rawUp = d
        .mul(float(1).add(paper.x.sub(1).mul(granulation)))
        .mul(density)
        .div(staining.max(1e-3))
        .mul(uniforms.timeStep)
        .mul(wet)
        .mul(agitation);

      down.push(min(rawDown.max(0), g));
      up.push(min(rawUp.max(0), d));
    }
    return { down: vec4(...down), up: vec4(...up) };
  }

  // --- pass 2: suspended pigment -----------------------------------------
  // Donor-cell advection read as a gather. Velocities are face-centred: a
  // cell's u is the flux through its *right* face, so the exchange with the
  // right neighbour is governed by this cell's own u, and the exchange with the
  // left neighbour by the left cell's u. Reading the right neighbour's u for
  // the right face — the obvious-looking thing — pairs each face with the wrong
  // velocity and the scheme stops conserving pigment: a blot builds to full
  // strength within three steps and then bleeds away to nothing by step twenty.
  const suspendedPass = pass(
    Fn(() => {
      const here = sample(water);
      const left = at(water, -1, 0);
      const below = at(water, 0, -1);

      const current = sample(suspended);
      const dt = uniforms.timeStep;

      // Each face contributes one outflow (paid by this cell) and one inflow
      // (paid by the neighbour), so every gram that leaves one cell arrives in
      // another.
      const outRight = max(0, here.x).mul(dt);
      const outLeft = max(0, left.x.negate()).mul(dt);
      const outUp = max(0, here.y).mul(dt);
      const outDown = max(0, below.y.negate()).mul(dt);
      const outflow = outRight.add(outLeft).add(outUp).add(outDown).clamp(0, 1);

      const gain = at(suspended, 1, 0)
        .mul(max(0, here.x.negate()).mul(dt))
        .add(at(suspended, -1, 0).mul(max(0, left.x).mul(dt)))
        .add(at(suspended, 0, 1).mul(max(0, here.y.negate()).mul(dt)))
        .add(at(suspended, 0, -1).mul(max(0, below.y).mul(dt)));

      const moved = current
        .sub(current.mul(outflow))
        .add(gain)
        .add(splatHere())
        .sub(transferDeltas().down);

      return moved.clamp(vec4(0, 0, 0, 0), ceiling());
    })()
  );

  // --- pass 3: deposited pigment -----------------------------------------
  const depositedPass = pass(
    Fn(() => {
      const { down, up } = transferDeltas();
      return sample(deposited)
        .add(down)
        .sub(up)
        .clamp(vec4(0, 0, 0, 0), ceiling());
    })()
  );

  // --- output -------------------------------------------------------------
  // Deposited pigment is paint dried onto the fibres; suspended pigment is
  // still in the water above it and reads lighter, so it counts at a fraction
  // of its thickness rather than not at all.
  //
  // `sharpness` steepens the pigment's edge. A pure fluid result is soft
  // everywhere, which reads as airbrush; ink has a soft interior and a decided
  // boundary — the same thing the dev tool's classic pattern gets by
  // thresholding its noise field.
  function thickness() {
    const settled = sample(deposited);
    const carried = sample(suspended);
    const raw = settled.add(carried.mul(uniforms.suspendedTint));
    return raw
      .mul(float(1).add(uniforms.sharpness.mul(3)))
      .clamp(vec4(0, 0, 0, 0), ceiling());
  }

  const reflectanceNode = Fn(() => {
    const paper = paperNode.sample(uv());
    const paperShade = uniforms.paperColor.mul(paper.x.mul(0.15).add(0.9));
    return kubelkaMunkReflectance(thickness(), uniforms, vec3(paperShade));
  });

  const coverageNode = Fn(() => {
    const total = thickness();
    return total.x.add(total.y).add(total.z).add(total.w);
  });

  const fields = [water, suspended, deposited];

  function reset() {
    fields.forEach((field) => {
      run(clearMaterial, field.write);
      field.swap();
      run(clearMaterial, field.write);
      field.swap();
    });
    renderer.setRenderTarget(splatTarget);
    renderer.clear();
    renderer.setRenderTarget(null);
  }

  // Three passes, and the render target is left bound until the step is
  // finished — unbinding between passes measured at ~0.2ms each, which is most
  // of a frame's budget once it is paid twenty-odd times.
  function step() {
    run(waterPass, water.write);
    water.swap();

    run(suspendedPass, suspended.write);
    run(depositedPass, deposited.write);
    suspended.swap();
    deposited.swap();

    renderer.setRenderTarget(null);
    uniforms.splatGain.value = 0;
  }

  // The brush has drawn into the splat target; let the next step take it up.
  function absorbSplat() {
    uniforms.splatGain.value = 1;
  }

  function setPigments(pigments) {
    pigments.slice(0, PIGMENT_SLOTS).forEach((paint, slot) => {
      uniforms.absorption[slot].value.set(...paint.absorption);
      uniforms.scattering[slot].value.set(...paint.scattering);
      uniforms.density[slot].value = paint.density;
      uniforms.granulation[slot].value = paint.granulation;
      uniforms.staining[slot].value = paint.staining;
    });
  }

  function setPaperColor(color) {
    uniforms.paperColor.value.set(color.r, color.g, color.b);
  }

  function setParams(next = {}) {
    Object.assign(settings, next);
    Object.entries(next).forEach(([key, value]) => {
      const target = uniforms[key];
      if (target && typeof value === 'number') target.value = value;
    });
  }

  function dispose() {
    fields.forEach((field) => {
      field.read.dispose();
      field.write.dispose();
    });
    splatTarget.dispose();
    paperTexture.dispose();
    materials.forEach((material) => material.dispose());
  }

  return {
    absorbSplat,
    coverageNode,
    dispose,
    fields: { deposited, suspended, water },
    reflectanceNode,
    reset,
    resolution,
    setPaperColor,
    setParams,
    setPigments,
    splatTarget,
    step,
  };
}
