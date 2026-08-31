import * as THREE from 'three/webgpu';

import { DEFAULT_TONAL_GAP, pigmentsFromStyles } from './pigments';
import createWatercolorSim from './watercolorSim';

// The whole ink layer as one object: the pattern field, the watercolour sim it
// drives, and the quad it lands on. Both renderers drive this identically — the
// scene calls `advance` from useFrame, the headless capture calls it in a loop
// before reading pixels — so a still and the live scene are the same paint.
//
// The ink is the pattern. It used to also stamp the test's trajectories onto a
// sheet of paper, which meant the blot was competing with a white card and with
// the Lines layer for the same shapes. Trajectories are the Lines layer's job;
// this draws the blot, transparently, over whatever is behind it.

export const PAPER_ORIENTATIONS = ['vertical', 'horizontal'];

export default function createInkPaper({
  orientation = 'vertical',
  paperGrain = 0.5,
  paperOffset = 0,
  paperSize = 20,
  renderer,
  resolution = 512,
  seed = 0,
  settleOnReset = 90,
  simParams = {},
  tonalGap = DEFAULT_TONAL_GAP,
} = {}) {
  // The pattern evolves with time. The scene advances this clock by real
  // elapsed seconds; a still pins it, so `--seed` stays reproducible.
  let patternClock = 0;
  let patternSpeed = 1;
  const sim = createWatercolorSim({
    paperGrain,
    params: simParams,
    renderer,
    resolution,
    seed,
  });

  // Unit plane scaled to size rather than a sized geometry: paper size is a
  // slider, and rebuilding a BufferGeometry per drag frame is pure waste.
  const geometry = new THREE.PlaneGeometry(1, 1);
  const material = new THREE.MeshBasicNodeMaterial({
    side: THREE.DoubleSide,
    transparent: true,
    // Depth is written per fragment regardless of alpha, and this is one large
    // quad that is mostly empty — so writing depth lays an invisible occluder
    // across the whole paper, and any stroke drawn afterwards behind it is
    // discarded. Three's back-to-front sorting hides that most of the time,
    // which is exactly what makes it a nasty one: it only appears once the
    // sheet is moved in front of part of the test, or the sort order shifts.
    //
    // Tested against, though, so strokes genuinely in front of the sheet still
    // occlude it. TestStrokes keeps depthWrite on for the opposite reason —
    // strokes are thin geometry with no large empty region, and writing depth
    // is what stops them blending into mush.
    depthWrite: false,
    depthTest: true,
  });

  const state = { orientation, paperOffset, paperSize, tonalGap };

  material.colorNode = sim.reflectanceNode();
  // Alpha is the pigment's own coverage and nothing else. There is no sheet, so
  // where no paint landed the layer is simply not there and the scene shows
  // through.
  material.opacityNode = sim.coverageNode().mul(3).clamp(0, 1);
  material.toneMapped = false;

  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;

  // Vertical is the plane's own XY, so a point's (x, y) lands where the Lines
  // renderer would have drawn it. Horizontal rotates +90 about X, which maps
  // local +y onto world +z — that direction, not -90, is what keeps the paper's
  // v axis pointing the same way the pattern is laid out.
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

  // Clear every field before anything can render. A render target that has
  // never been written has no GPU texture at all, and sampling it gives
  // undefined contents — which reads as fully saturated pigment across the
  // whole sheet, so the first frames show solid ink colour that then drains
  // away as the sim corrects itself.
  sim.reset();

  // Set whenever the fields are cleared, so the next advance can settle them
  // before anyone sees them.
  let needsSettle = true;

  return {
    // One call per frame: advance the pattern's clock, rebuild the field, then
    // run the fluid sim forward. `steps` above 1 is how the headless capture
    // settles a blot that the scene would have taken hundreds of frames to
    // reach.
    advance({ delta = 0, steps = 1, styles } = {}) {
      if (styles) sim.setPigments(pigmentsFromStyles(styles, state.tonalGap));
      patternClock += delta * patternSpeed;
      // Once per frame, not per step: the pattern is five octaves of noise and
      // the sim reads it as a texture.
      sim.updatePattern(patternClock);

      // A freshly cleared field needs to reach its steady state before it is
      // shown. Left to run at the scene's couple of steps per frame it spends
      // roughly ten seconds visibly draining from a flooded sheet down to the
      // blot the pattern actually asks for, which reads as the ink and
      // background colours being swapped.
      const catchUp = needsSettle ? settleOnReset : 0;
      needsSettle = false;
      for (let i = 0; i < steps + catchUp; i += 1) sim.step();
    },

    // For the headless renderer, which has no frame clock.
    setPatternTime(time) {
      patternClock = time;
    },

    // 0 freezes the pattern where it stands; the field stops evolving but still
    // drives flow and wash.
    setPatternSpeed(speed) {
      patternSpeed = speed;
    },

    dispose() {
      sim.dispose();
      geometry.dispose();
      material.dispose();
    },

    mesh,

    reset() {
      sim.reset();
      needsSettle = true;
    },

    // Everything about a sim except its resolution can be re-pointed at a new
    // test, which is what lets a batch or a video keep one sim alive across
    // every frame instead of paying for its render targets, its compiled
    // pipelines and its paper grain again per capture.
    setPaper(next) {
      sim.setPaper(next);
    },

    setOrientation(nextOrientation, nextOffset) {
      state.orientation = nextOrientation;
      state.paperOffset = nextOffset;
      applyTransform();
    },

    setBackdropColor(color) {
      sim.setBackdropColor(new THREE.Color(color));
    },

    setState(next = {}) {
      Object.assign(state, next);
      if (next.simParams) sim.setParams(next.simParams);
      if (next.paperSize !== undefined) applyTransform();
    },

    sim,
  };
}
