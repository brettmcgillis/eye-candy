import { mix, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { collectStamps, createSplatBrush } from './deposition';
import { pigmentsFromStyles } from './pigments';
import createWatercolorSim from './watercolorSim';

// The whole ink layer as one object: the sim, the brush that feeds it, and the
// sheet of paper it renders onto. Both renderers drive this identically — the
// scene calls `advance` from useFrame, the headless capture calls it in a loop
// before reading pixels — so a still and the live scene are the same paint.

export const PAPER_ORIENTATIONS = ['vertical', 'horizontal'];

const DEFAULT_PAPER_COLOR = '#f4f1e8';

export default function createInkPaper({
  brushSize = 0.22,
  depositionMode = 'brush',
  orientation = 'vertical',
  paperColor = DEFAULT_PAPER_COLOR,
  paperGrain = 0.5,
  paperOffset = 0,
  paperSize = 20,
  renderer,
  resolution = 512,
  seed = 0,
  showPaper = true,
  simParams = {},
  strength = 0.55,
} = {}) {
  const sim = createWatercolorSim({
    paperGrain,
    params: simParams,
    renderer,
    resolution,
    seed,
  });
  const brush = createSplatBrush({ renderer, sim });

  // Unit plane scaled to size rather than a sized geometry: paper size is a
  // slider, and rebuilding a BufferGeometry per drag frame is pure waste.
  const geometry = new THREE.PlaneGeometry(1, 1);
  const material = new THREE.MeshBasicNodeMaterial({
    side: THREE.DoubleSide,
    transparent: true,
  });

  const state = {
    brushSize,
    depositionMode,
    orientation,
    paperOffset,
    paperSize,
    strength,
  };
  // A uniform rather than two different graphs: toggling the sheet off has to
  // work live, and swapping colorNode would rebuild the material's pipeline.
  const hidePaper = uniform(showPaper ? 0 : 1);

  material.colorNode = sim.reflectanceNode();
  // With the sheet hidden the paper's own alpha drops out and only pigment
  // remains, so an ink test can sit inside a Lines test without a white
  // rectangle cutting through it.
  material.opacityNode = mix(
    1,
    sim.coverageNode().mul(3).clamp(0, 1),
    hidePaper
  );
  material.toneMapped = false;

  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;

  // Vertical is the plane's own XY, so a point's (x, y) lands where the Lines
  // renderer would have drawn it. Horizontal rotates +90 about X, which maps
  // local +y onto world +z — that direction, not -90, is what keeps the paper's
  // v axis pointing the same way the deposition code projects onto.
  function applyTransform() {
    mesh.scale.setScalar(state.paperSize);
    if (state.orientation === 'horizontal') {
      mesh.rotation.set(Math.PI / 2, 0, 0);
      mesh.position.set(0, state.paperOffset, 0);
    } else {
      mesh.rotation.set(0, 0, 0);
      mesh.position.set(0, 0, state.paperOffset);
    }
  }
  applyTransform();

  sim.setPaperColor(new THREE.Color(paperColor));

  // Brush mode only deposits what grew since the last call, so the paint
  // arrives with the stroke. The other two modes deposit the whole trajectory
  // in one call and then let the fluid layer do the rest, so they are driven by
  // a fingerprint change rather than by growth.
  const depositedTo = new Map();
  let lastFingerprint = null;

  function deposit({ bundles, force = false, scale, styles }) {
    // Every input that changes where or how much paint lands belongs in the
    // fingerprint. Keyed on deposition mode alone, the one-shot modes deposited
    // once and then ignored brush size, pigment strength, paper size and
    // orientation forever — the settings appeared to do nothing at all.
    const settings = [
      state.depositionMode,
      state.brushSize,
      state.strength,
      state.paperSize,
      state.orientation,
    ].join(',');
    const fingerprint = `${settings}:${bundles
      .map(
        (bundle) =>
          `${bundle.id}.${bundle.seed}.${bundle.structuralFingerprint}`
      )
      .join('|')}`;

    if (force || fingerprint !== lastFingerprint) {
      lastFingerprint = fingerprint;
      depositedTo.clear();
      if (state.depositionMode !== 'brush') {
        sim.reset();
      }
    }

    const oneShot = state.depositionMode !== 'brush';
    let total = 0;

    bundles.forEach((bundle, index) => {
      const already = depositedTo.get(bundle.id) ?? 0;
      if (oneShot && already > 0) return;
      const toStep = bundle.grownSteps;
      if (!oneShot && toStep <= already) return;

      total += collectStamps({
        brushSize: state.brushSize,
        bundles: [bundle],
        fromStep: oneShot ? 0 : Math.max(0, already - 1),
        mode: state.depositionMode,
        orientation: state.orientation,
        out: brush.positions.subarray(total * 4),
        outMask: brush.mask.subarray(total * 4),
        paperSize: state.paperSize,
        scale,
        strength: state.strength,
        styles: [styles[index] ?? {}],
        toStep,
      });
      depositedTo.set(bundle.id, toStep);
    });

    if (total > 0) brush.flush(total);
  }

  return {
    // One call per frame: lay down whatever new paint is owed, then run the
    // fluid sim forward. `steps` above 1 is how the headless capture settles a
    // blot that the scene would have taken hundreds of frames to reach.
    advance({ bundles, force, scale, steps = 1, styles }) {
      if (bundles?.length) {
        sim.setPigments(pigmentsFromStyles(styles ?? []));
        deposit({ bundles, force, scale, styles: styles ?? [] });
      }
      for (let i = 0; i < steps; i += 1) sim.step();
    },

    dispose() {
      brush.dispose();
      sim.dispose();
      geometry.dispose();
      material.dispose();
    },

    mesh,

    reset() {
      sim.reset();
      depositedTo.clear();
      lastFingerprint = null;
    },

    setOrientation(nextOrientation, nextOffset) {
      state.orientation = nextOrientation;
      state.paperOffset = nextOffset;
      applyTransform();
    },

    setPaperColor(color) {
      sim.setPaperColor(new THREE.Color(color));
    },

    setShowPaper(next) {
      hidePaper.value = next ? 0 : 1;
    },

    setState(next = {}) {
      Object.assign(state, next);
      if (next.simParams) sim.setParams(next.simParams);
      if (next.paperSize !== undefined) applyTransform();
    },

    sim,
  };
}
