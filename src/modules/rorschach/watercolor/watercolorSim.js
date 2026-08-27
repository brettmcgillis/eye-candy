import {
  Fn,
  float,
  luminance,
  max,
  min,
  mix,
  smoothstep,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { createPaperTexture } from './paper';
import { computeField } from './patternField';
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

// Gain on the (Softness-normalised) pattern gradient driving water velocity.
const PATTERN_PUSH_GAIN = 6;

const DEFAULT_PARAMS = {
  capillary: 0.14,
  drag: 0.06,
  edgeStrength: 0.9,
  evaporation: 0.0015,
  flow: 0.34,
  maxConcentration: 1.6,
  // 0 disables the ink's own bloom entirely; see reflectanceNode.
  bloomEnabled: 0,
  // 1 restricts the glow to pigment from emissive bundles, as the Lines layer
  // does; 0 glows the whole blot.
  bloomEmissiveOnly: 1,
  bloomStrength: 0.4,
  // Matched to the scene's own bloom threshold so the ink can be lifted to a
  // known distance past it.
  bloomThreshold: 1,
  // 0 drives it from pigment thickness, 1 from wetness.
  bloomSource: 0,
  cellAmount: 0,
  cellReveal: 0.5,
  cellRevealScale: 3,
  cellFlatten: 1,
  cellScale: 24,
  cellSymmetry: 1,
  patternDeposit: 0,
  patternFade: 0.08,
  patternDetails: 5,
  patternFlow: 0,
  patternScale: 1,
  patternSeed: 0,
  patternSharpness: 0.0026,
  patternSoftness: 0.04,
  paletteMix: 1,
  paletteScale: 1.5,
  paletteSymmetry: 1,
  patternSymmetry: 0,
  patternThreshold: 0.5,
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
    cellAmount: uniform(settings.cellAmount),
    cellReveal: uniform(settings.cellReveal),
    cellRevealScale: uniform(settings.cellRevealScale),
    cellFlatten: uniform(settings.cellFlatten),
    cellScale: uniform(settings.cellScale),
    cellSymmetry: uniform(settings.cellSymmetry),
    density: Array.from({ length: PIGMENT_SLOTS }, () => uniform(0.8)),
    // Per pigment, mirroring the Lines layer's per-bundle emissive flag.
    emissive: Array.from({ length: PIGMENT_SLOTS }, () => uniform(0)),
    emissiveGain: Array.from({ length: PIGMENT_SLOTS }, () => uniform(0)),
    drag: uniform(settings.drag),
    edgeStrength: uniform(settings.edgeStrength),
    evaporation: uniform(settings.evaporation),
    flow: uniform(settings.flow),
    granulation: Array.from({ length: PIGMENT_SLOTS }, () => uniform(0.4)),
    bloomEmissiveOnly: uniform(settings.bloomEmissiveOnly),
    bloomEnabled: uniform(settings.bloomEnabled),
    bloomSource: uniform(settings.bloomSource),
    bloomStrength: uniform(settings.bloomStrength),
    bloomThreshold: uniform(settings.bloomThreshold),
    maxConcentration: uniform(settings.maxConcentration),
    // What the ink is optically sitting on. There is no sheet of paper any
    // more — the blot is composited straight onto whatever the scene or the
    // still renders behind it, which is the only substrate Kubelka-Munk needs.
    backdropColor: uniform(new THREE.Vector3(0.1, 0.1, 0.1)),
    patternDeposit: uniform(settings.patternDeposit),
    patternFade: uniform(settings.patternFade),
    patternDetails: uniform(settings.patternDetails),
    patternFlow: uniform(settings.patternFlow),
    patternScale: uniform(settings.patternScale),
    patternSeed: uniform(settings.patternSeed),
    patternSharpness: uniform(settings.patternSharpness),
    patternSoftness: uniform(settings.patternSoftness),
    paletteMix: uniform(settings.paletteMix),
    paletteScale: uniform(settings.paletteScale),
    paletteSymmetry: uniform(settings.paletteSymmetry),
    patternSymmetry: uniform(settings.patternSymmetry),
    patternThreshold: uniform(settings.patternThreshold),
    patternTime: uniform(0),
    scattering: Array.from({ length: PIGMENT_SLOTS }, () =>
      uniform(new THREE.Vector3(1, 1, 1))
    ),
    sharpness: uniform(settings.sharpness),
    staining: Array.from({ length: PIGMENT_SLOTS }, () => uniform(0.6)),
    suspendedTint: uniform(settings.suspendedTint),
    timeStep: uniform(settings.timeStep),
    wetThreshold: uniform(settings.wetThreshold),
  };

  const paperNode = texture(paperTexture);

  // The classic pattern is five octaves of gradient noise — far too expensive
  // to evaluate per neighbour tap inside the sim passes. It is baked into its
  // own target once per *frame* instead, and the sim reads it as a texture, so
  // a step stays three passes no matter how many steps a frame runs.
  const patternTarget = new THREE.RenderTarget(resolution, resolution, {
    depthBuffer: false,
    magFilter: THREE.LinearFilter,
    minFilter: THREE.LinearFilter,
    type: THREE.HalfFloatType,
  });
  const patternTexture = texture(patternTarget.texture);

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
  // x is the soft field the sim's physics reads — not the thresholded blot,
  // which is a step function at any usable Sharpness and gives the fluid
  // nothing to work with. y is which palette pigment is being painted with
  // here, baked alongside it for the same reason: once per frame, never per
  // step.
  const patternPass = pass(
    Fn(() => {
      const field = computeField(uv(), uniforms);
      return vec4(field.wash, field.palette, 0, 1);
    })()
  );

  const patternAt = (dx, dy) =>
    patternTexture.sample(
      uv()
        .add(offset(dx, dy))
        .clamp(texel * 0.5, 1 - texel * 0.5)
    ).x;

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

      // Exchange with the neighbours up to this cell's capacity, and lose a
      // little to the air. Nothing else adds water: the pattern is the only
      // source now, through `alive` below, which is what makes Pattern Flow the
      // wetness knob — at 0 the sheet is dry and the wash lands as the pattern's
      // own hard edge, and as it rises the same blot bleeds.
      const soaked = here.z;
      const neighbourMean = left.z
        .add(right.z)
        .add(below.z)
        .add(above.z)
        .mul(0.25);
      const spread = neighbourMean
        .sub(soaked)
        .mul(uniforms.capillary)
        .mul(min(paper.y.sub(soaked).max(0).add(0.25), 1));
      // The pattern keeps the sheet wet where it is strong, which is what stops
      // a finished blot from drying into a still image — the "forever wet"
      // behaviour. At patternFlow 0 this term vanishes entirely.
      const pattern = patternTexture.sample(uv()).x;
      const alive = pattern.mul(uniforms.patternFlow);
      const saturation = max(
        soaked.add(spread).sub(uniforms.evaporation),
        alive.mul(0.75)
      ).clamp(0, 1);

      // Wet height: saturation carried over the paper's own tooth.
      const height = (cell) => cell.z.add(paper.x.mul(0.06));
      const slopeX = height(left).sub(height(right)).mul(0.5);
      const slopeY = height(below).sub(height(above)).mul(0.5);

      // Pattern gradient as a velocity source: the field breathes in place, so
      // the ink it pushes drifts and re-pools instead of settling once.
      //
      // Scaled by Softness, because the gradient's magnitude goes as 1 / the
      // ramp width — without this the push means something different at every
      // Softness setting. The bare gain used to be 8, which was survivable only
      // because the field it read was thresholded to a step: the gradient was
      // zero everywhere except one cell, so the term almost never fired. Handed
      // the soft field it fires everywhere along the blot's edge, drove the
      // velocity straight into its ±0.9 clamp, and formed a shock at the
      // convergence contour within three steps — the bright wire that traced
      // the blot. Normalising makes the push scale-free and keeps it well
      // inside the clamp.
      const patternPush = uniforms.patternSoftness.mul(PATTERN_PUSH_GAIN);
      const patternX = patternAt(-1, 0)
        .sub(patternAt(1, 0))
        .mul(0.5)
        .mul(uniforms.patternFlow)
        .mul(patternPush);
      const patternY = patternAt(0, -1)
        .sub(patternAt(0, 1))
        .mul(0.5)
        .mul(uniforms.patternFlow)
        .mul(patternPush);

      // Ramped, never a hard step. As a `step()` this snapped velocity to zero
      // at the wet boundary, and the advection scheme is conservative: the last
      // wet cell kept receiving pigment from its wet neighbours while its dry
      // neighbours could pass none of it on, so pigment piled up there. It read
      // as a crisp one-pixel bright line tracing the wet contour right through
      // the middle of the wash. Fading the mask out over a few cells lets the
      // flux taper instead of stopping dead, which is also what water does.
      const inside = smoothstep(0, uniforms.wetThreshold.mul(3), saturation);
      const velocityU = here.x
        .add(patternX.mul(uniforms.timeStep))
        .add(slopeX.mul(uniforms.flow).mul(uniforms.timeStep))
        .mul(float(1).sub(uniforms.drag))
        .mul(inside)
        .clamp(-0.9, 0.9);
      const velocityV = here.y
        .add(patternY.mul(uniforms.timeStep))
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
    //
    // Measured over the neighbourhood, not at the point. |u| + |v| passes
    // through zero along every stagnation contour, so a point sample made a
    // knife-thin line where lift stopped while it continued on both sides;
    // paint accumulated in that one cell and drew a crisp bright wire across
    // the wash — measurably ~80% above its neighbours. A cell sitting still
    // between two moving neighbours is still being agitated by them, so the
    // mean over the five taps is both the fix and the more honest reading.
    const speed = (cell) => cell.x.abs().add(cell.y.abs());
    const agitation = speed(flow)
      .add(speed(at(water, 1, 0)))
      .add(speed(at(water, -1, 0)))
      .add(speed(at(water, 0, 1)))
      .add(speed(at(water, 0, -1)))
      .mul(0.2)
      .clamp(0, 1);

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

  // The pattern as a *source*, not as a target.
  //
  // This used to be a per-cell servo: measure `pattern - (suspended +
  // deposited)` here and correct it every step, draining both layers when the
  // cell held more than the pattern asked for. It held the sheet exactly to the
  // pattern's silhouette, which meant it undid the fluid sim's entire job.
  // Pigment the water carried past the pattern's edge was removed the moment it
  // arrived, so there was no bleed; pigment the water carried *out* of a cell
  // was topped straight back up, so there was no pooling, no granulation and no
  // dried rim. Flow could be run to 1.0 and the picture did not change — a flat
  // two-tone silhouette either way.
  //
  // Supply and reclamation are separate jobs and are separated here:
  //
  //   supply  the pattern feeds wet pigment into *suspension* only, so the
  //           paint has to travel through the fluid to reach the paper. That
  //           trip is where bleed, edge darkening and granulation come from.
  //
  //   decay   every cell loses a fixed *fraction* of its pigment per step,
  //           wherever it sits. Uniform, so it cannot encode the pattern's
  //           shape and cannot flatten what the fluid did.
  //
  // Decay still solves what the drain was there for. The pattern evolves, so an
  // add-only wash paints the union of every position it has drifted through and
  // fills to a solid mass in about ten seconds; a fractional decay gives paint
  // a finite lifetime, so old positions fade while the current one is
  // re-supplied. Note a still has no drift problem at all — it pins the clock —
  // which is why low Pattern Fade plus a long `--inkSettle` is the deep,
  // heavily bled still, and the live scene wants more.
  //
  // The rates are chosen so `inkPatternWash` keeps its old meaning. Per step a
  // cell decays by `fade * dt` and gains `pattern * wash * maxConcentration *
  // fade * dt`, so the steady state is exactly `pattern * wash *
  // maxConcentration` — the servo's old target — reached rather than enforced.
  // Fade therefore sets how much history the sheet keeps, not how dark it gets.
  // How the wash is split across the four pigments, from the palette field
  // baked into the pattern target's z channel.
  //
  // Overlapping linear tents centred on 0, 1/3, 2/3 and 1. At that spacing and
  // width they are a partition of unity — the weights sum to exactly 1 for any
  // t in range — which is what keeps total pigment, and so the blot's density,
  // independent of which colour a region happens to land on. Weights that did
  // not sum to 1 would read as the palette field modulating opacity, a
  // brightness stain over the whole picture that no control could remove.
  //
  // Where two tents overlap the sim carries both pigments in the same cell, and
  // Kubelka-Munk mixes them subtractively in the colour node — actual paint
  // blending, not a lerp between two swatches.
  function paletteWeights() {
    const t = patternTexture.sample(uv()).y;
    const tent = (centre) =>
      float(1).sub(t.sub(centre).abs().mul(3)).clamp(0, 1);

    return mix(
      // Pigment 0 alone: the monochrome behaviour, and what Palette Spread 0
      // returns to.
      vec4(1, 0, 0, 0),
      vec4(tent(0), tent(1 / 3), tent(2 / 3), tent(1)),
      uniforms.paletteMix
    );
  }

  function washSupply() {
    const amount = patternTexture
      .sample(uv())
      .x.mul(uniforms.patternDeposit)
      .mul(uniforms.maxConcentration)
      .mul(uniforms.patternFade)
      .mul(uniforms.timeStep);

    return paletteWeights().mul(amount);
  }

  // Applied to both pigment layers, so paint that has already settled onto the
  // paper is reclaimed at the same rate as paint still in the water. Sparing
  // the deposited layer looks like the obvious kindness and is what the old
  // drain learned the hard way not to do: pigment settles out of suspension
  // within a few steps, so anything that only touches suspended pigment finds
  // nothing left to take and the sheet fills anyway.
  const washKeep = () =>
    float(1).sub(uniforms.patternFade.mul(uniforms.timeStep)).clamp(0, 1);

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
        .mul(washKeep())
        .sub(current.mul(outflow))
        .add(gain)
        .add(washSupply())
        .sub(transferDeltas().down);

      return moved.clamp(vec4(0, 0, 0, 0), ceiling());
    })()
  );

  // --- pass 3: deposited pigment -----------------------------------------
  const depositedPass = pass(
    Fn(() => {
      const { down, up } = transferDeltas();
      return sample(deposited)
        .mul(washKeep())
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

  // Kubelka-Munk returns a *reflectance* — the fraction of light coming back —
  // so it is bounded at 1 by construction and can never cross the scene's bloom
  // threshold, which sits just above what a non-emissive stroke reaches. That
  // is the only reason ink never bloomed: the pass was always willing, the
  // values simply could not get there.
  //
  // Pushed past 1 the same way TestStrokes does it for emissive bundles — a
  // multiply on an untonemapped colour node — so ink and lines glow
  // independently against the one shared threshold instead of fighting over it.
  // Lowering that threshold would have worked too, and would have bloomed every
  // stroke in the scene along with the ink.
  //
  // Weighted, never flat: a uniform multiply is a brightness slider and washes
  // the blot out. `bloomSource` crossfades what drives it —
  //
  //   thickness  dense cores glow, thin bled edges stay matte. Follows the
  //              painting, and works whatever the water is doing.
  //   wetness    still-wet paint glows and dried paint goes matte, which reads
  //              as the blot being alive where it is wet. Free, since the sim
  //              already tracks saturation — but it needs Pattern Flow above 0
  //              to have anything to glow.
  const bloomWeight = (total) => {
    const density = total.x
      .add(total.y)
      .add(total.z)
      .add(total.w)
      .div(uniforms.maxConcentration)
      .clamp(0, 1);
    return mix(density, sample(water).z, uniforms.bloomSource);
  };

  // Lifted to a target *luminance*, not multiplied by a flat gain.
  //
  // BloomNode thresholds on `luminance(rgb)`, and the coefficients are
  // 0.2126/0.7152/0.0722 — so what blooms depends on hue as much as on how hard
  // it is pushed. At the same intensity 5, green reaches luminance 3.58 and
  // blooms hard, red reaches 1.06 and only just clears a threshold of 1, and
  // blue reaches 0.36 and never blooms at all. A flat multiply inherits that
  // whole bias: on a dark blue palette the ink would simply refuse to glow
  // while a pale one glowed easily, at identical settings.
  //
  // Solving for the gain that puts luminance `bloomStrength` above the
  // threshold makes the control mean the same thing for every pigment, so a
  // palette glows evenly instead of by hue. `bloomEnabled` folds into the
  // weight so that at 0 the target is the colour's own luminance and the gain
  // is exactly 1 — otherwise "off" would still lift dim ink up to the
  // threshold.
  // How much of the paint sitting in this cell came from an emissive bundle,
  // and how hard that bundle is driven. Mass-weighted, so a cell holding mostly
  // non-emissive pigment barely glows even if a trace of an emissive one
  // drifted into it.
  //
  // This is what makes the ink agree with the Lines layer. Without it the whole
  // blot lights up the moment Ink Bloom is switched on, while the strokes
  // beside it glow only for the one bundle marked emissive — the same palette
  // behaving under two different rules in one frame.
  function emissiveShare(total) {
    const mass = total.x.add(total.y).add(total.z).add(total.w).max(1e-4);
    let flagged = float(0);
    let driven = float(0);
    for (let slot = 0; slot < PIGMENT_SLOTS; slot += 1) {
      flagged = flagged.add(total.element(slot).mul(uniforms.emissive[slot]));
      driven = driven.add(total.element(slot).mul(uniforms.emissiveGain[slot]));
    }
    return { gain: driven.div(mass), mask: flagged.div(mass).clamp(0, 1) };
  }

  const reflectanceNode = Fn(() => {
    const total = thickness();
    const base = kubelkaMunkReflectance(
      total,
      uniforms,
      vec3(uniforms.backdropColor)
    );

    const share = emissiveShare(total);
    // At Emissive Only 0 the mask is 1 and the gain 1, which is the whole blot
    // glowing by `bloomStrength` alone — the behaviour before bundles had any
    // say in it.
    const mask = mix(float(1), share.mask, uniforms.bloomEmissiveOnly);
    const gain = mix(float(1), share.gain, uniforms.bloomEmissiveOnly);

    const lum = luminance(base).max(1e-4);
    const amount = bloomWeight(total).mul(mask).mul(uniforms.bloomEnabled);
    const target = mix(
      lum,
      uniforms.bloomThreshold.add(uniforms.bloomStrength.mul(gain)),
      amount
    );
    return base.mul(target.div(lum).max(1));
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
    // The pattern target too: updatePattern early-returns while flow and wash
    // are both 0, which is the state the sim is constructed in before the
    // scene's effects push the real values. Any pass sampling it before its
    // first write reads undefined contents — the same trap as the fields.
    renderer.setRenderTarget(patternTarget);
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
  }

  // Rebuilt once per frame by the caller. `time` is passed in rather than read
  // from a clock so a still can pin it to the seed and stay reproducible.
  // Unconditional: the pattern is the ink's only source now, and the debug
  // contour reads this target even when nothing is flowing or washing.
  function updatePattern(time) {
    uniforms.patternTime.value = time;
    run(patternPass, patternTarget);
    renderer.setRenderTarget(null);
  }

  function setPigments(pigments) {
    pigments.slice(0, PIGMENT_SLOTS).forEach((paint, slot) => {
      uniforms.emissive[slot].value = paint.emissive ?? 0;
      uniforms.emissiveGain[slot].value = paint.emissiveGain ?? 0;
      uniforms.absorption[slot].value.set(...paint.absorption);
      uniforms.scattering[slot].value.set(...paint.scattering);
      uniforms.density[slot].value = paint.density;
      uniforms.granulation[slot].value = paint.granulation;
      uniforms.staining[slot].value = paint.staining;
    });
  }

  function setBackdropColor(color) {
    uniforms.backdropColor.value.set(color.r, color.g, color.b);
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
    patternTarget.dispose();
    paperTexture.dispose();
    materials.forEach((material) => material.dispose());
  }

  return {
    coverageNode,
    dispose,
    fields: { deposited, suspended, water },
    reflectanceNode,
    reset,
    resolution,
    setBackdropColor,
    setParams,
    setPigments,
    step,
    updatePattern,
  };
}
