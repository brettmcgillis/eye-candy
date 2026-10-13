/* eslint-disable import/no-extraneous-dependencies */
import {
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/trucheterieBlob/renderOptions.mjs';
import {
  createParseCli,
  encodeFrame as encode,
  overlayFor,
  withRenderer,
} from './generatorCli.mjs';
import { createHeadlessRenderer, loadThree } from './headlessWebgpu.mjs';
import loadModules from './loadModules.mjs';
import { withResolvedDesign } from './trucheterieDesigns.mjs';

// Barrels only — see docs/flora-pipeline.md, the arrangement this mirrors.
const ENTRIES = {
  blob: '/src/modules/trucheterieBlob/index.js',
  look: '/src/modules/trucheterieBlobRender/index.js',
  palettes: '/src/utils/gradientPalette.js',
};

// three must see the stubbed browser globals before any module that imports
// it is evaluated, so the renderer bootstrap runs first.
export async function loadKernel() {
  const { THREE, TSL } = await loadThree();
  const loaded = await loadModules(Object.values(ENTRIES));
  const pick = (name) => loaded[ENTRIES[name]];
  return {
    THREE,
    TSL,
    blob: pick('blob'),
    look: pick('look'),
    paletteNames: pick('palettes').PALETTE_NAMES,
  };
}

export const parseCli = createParseCli({
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
});

export function assertPalette(kernel, { options, typed }) {
  const names = ['None', ...kernel.paletteNames];
  if (typed.has('blobPalette') && !names.includes(options.blobPalette)) {
    throw new Error(
      `unknown palette "${options.blobPalette}". ${kernel.paletteNames.length} names are available in src/utils/gradients.json, plus "None".`
    );
  }
}

export function rollArgs(kernel, { options, typed }) {
  const scene = new Set(kernel.blob.SCENE_KEYS);
  return {
    base: options.base ? kernel.blob.configFrom(options.base) : {},
    keep: String(options.keep ?? '')
      .split(',')
      .map((facet) => facet.trim())
      .filter(Boolean),
    paletteNames: kernel.paletteNames,
    pinned: withResolvedDesign(
      kernel.blob,
      Object.fromEntries(
        [...typed]
          .filter((key) => scene.has(key))
          .map((key) => [kernel.blob.sceneNameFor(key), options[key]])
      )
    ),
    seeds: {
      palette: options.paletteSeed ?? undefined,
      structure: options.structureSeed ?? undefined,
    },
  };
}

// What a job at `index` draws: one rolled field.
export function fieldAt(kernel, { index, options, roll }) {
  const { blob } = kernel;
  const baseSeed = options.blobSeed ?? blob.randomSeed();
  const seed =
    options.blobSeed == null ? baseSeed : blob.seedFor(baseSeed, index);
  return { config: blob.rollBlobConfig(seed, roll), seed };
}

export function sidecarFor({ config, options }) {
  const render = { ...options, base: undefined };
  return { preset: config, render };
}

// The same field a capturer's setField would build, for the one caller
// (the still CLI's SVG export) that needs the field data itself rather than
// a rendered frame.
export function buildField(kernel, config) {
  return kernel.blob.fieldFromConfig(config);
}

function laneOptions(config, phase = 0) {
  return {
    exact: config.blobPaletteExact,
    fallback: config.bgColor,
    mode: config.blobLaneMode,
    monoColor: config.blobMonoColor,
    monochrome: config.blobMonochrome,
    palette: config.blobPalette,
    pathDiv: config.blobPathsPerUnit,
    phase,
    seed: config.blobSeed,
    shuffleSeed: config.blobPaletteShuffle,
  };
}

// The vector twin of a capture: the same background, lane colours, strokes
// and pen weight, through the same tone curve — see
// @modules/trucheterieBlob/renderSvg.js. `svgFill` off leaves only the
// (occlusion-clipped) stroke layer, for a plotter.
export function renderSvg(kernel, field, config, options) {
  const { look } = kernel;
  const lanes = look.resolveLaneColors(field.cells, laneOptions(config));
  const { penHalfWidth } = look.penGeometry(field.gridSize);
  return kernel.blob.renderBlobSvg(field, {
    background:
      options.svgFill && !options.transparentBackground
        ? look.acesFilmicHex(config.sceneBgColor)
        : null,
    height: options.height,
    laneBreaks: (cell, slot, lane) => look.laneBreaks(lanes, cell, slot, lane),
    laneColor: options.svgFill
      ? (cell, slot, lane, u) =>
          look.acesFilmic(look.laneColorAt(lanes, cell, slot, lane, u))
      : null,
    margin: options.margin,
    pathDiv: config.blobPathsPerUnit,
    penWidth: penHalfWidth * 2 * field.cellSize * options.svgStroke,
    planeRotation: config.planeRotation,
    showStrokes: config.blobShowStrokes,
    strokeColor: look.acesFilmicHex(config.strokeColor),
    width: options.width,
  });
}

export const encodeFrame = (frame, format, options = {}) =>
  encode(frame, format, overlayFor('trucheterie.svg', options));

// One renderer per output size, reused across frames. The field is flat and
// unlit, so this needs no lighting rig and no perspective camera: an
// orthographic camera framed to the drawn bounds is the whole "shot". It
// renders through a RenderPipeline because only the pipeline's output node
// applies the tone mapping and sRGB encode the scene's canvas gets — a plain
// render into the readback target stores linear values.
export async function createBlobCapturer(kernel, { height, width }) {
  const { THREE, TSL, look } = kernel;

  const headless = await createHeadlessRenderer({
    configure(renderer) {
      /* eslint-disable no-param-reassign */
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      /* eslint-enable no-param-reassign */
    },
    height,
    width,
  });

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  const post = new THREE.RenderPipeline(headless.renderer);
  post.outputNode = TSL.pass(scene, camera);
  const geometry = new THREE.PlaneGeometry(1, 1);
  const laneTextures = look.createLaneTextures();
  const uniforms = look.createBlobUniforms('#141414');
  const material = look.createBlobMaterial(uniforms, laneTextures);
  let mesh = null;
  let current = null;

  // An InstancedMesh's instance-matrix buffer is sized once, at construction,
  // for the count it is given — mirroring why the R3F scene keys its
  // `<instancedMesh>` on `field.count` (its `args`) rather than mutating
  // `.count` on a fixed-capacity instance.
  function meshFor(capacity) {
    if (mesh && mesh.instanceMatrix.count >= capacity) return mesh;
    if (mesh) scene.remove(mesh);
    mesh = new THREE.InstancedMesh(geometry, material, capacity);
    mesh.frustumCulled = false;
    scene.add(mesh);
    return mesh;
  }

  function frameCamera(bounds, margin) {
    const halfW = Math.max(1e-3, (bounds.max[0] - bounds.min[0]) / 2);
    const halfH = Math.max(1e-3, (bounds.max[1] - bounds.min[1]) / 2);
    const centerX = (bounds.max[0] + bounds.min[0]) / 2;
    const centerY = (bounds.max[1] + bounds.min[1]) / 2;
    const aspect = width / height;
    const half = Math.max(halfW / aspect, halfH) * (1 + margin);

    camera.left = -half * aspect;
    camera.right = half * aspect;
    camera.top = half;
    camera.bottom = -half;
    camera.position.set(centerX, centerY, 10);
    camera.lookAt(centerX, centerY, 0);
    camera.updateProjectionMatrix();
  }

  return {
    // `config` is a scene-keyed field config (renderOptions.mjs SCENE_KEYS).
    setField(config) {
      const field = kernel.blob.fieldFromConfig(config);
      const laneInfo = look.fillLaneTextures(
        laneTextures,
        field.cells,
        laneOptions(config)
      );
      const { quadMargin } = look.syncBlobUniforms(uniforms, {
        blobCanvasSize: config.blobCanvasSize,
        config,
        field,
        laneInfo,
      });
      look.ATTRIBUTES.forEach(([name]) => geometry.deleteAttribute(name));
      const capacity = Math.max(field.count, 1);
      const activeMesh = meshFor(capacity);
      activeMesh.count = capacity;
      look.applyFieldToMesh(activeMesh, field, quadMargin);
      activeMesh.rotation.z = ((config.planeRotation ?? 0) * Math.PI) / 180;
      activeMesh.updateMatrixWorld(true);
      current = { config, field };
      return look.fieldBounds(field, config.planeRotation ?? 0);
    },

    // A video's per-frame reveal, 0 (nothing) to 1 (fully grown). No field
    // rebuild — just the one uniform the shader gates rings against.
    setGrowth(value) {
      uniforms.growthU.value = value;
    },

    // A video's per-frame palette drift: refills the lane-colour lookup with
    // a continuously advancing phase, holding the field's geometry still.
    // Cheap enough to call every frame (see palette.js's `phase`).
    setPalettePhase(phase) {
      if (!current) return;
      const { config, field } = current;
      if (config.blobLaneMode === 'Spectrum') {
        uniforms.spectrumPhaseU.value = phase;
        return;
      }
      look.fillLaneTextures(
        laneTextures,
        field.cells,
        laneOptions(config, phase)
      );
    },

    async capture({ backgroundColor, bounds, margin, transparentBackground }) {
      frameCamera(bounds, margin);
      headless.renderer.setClearColor(
        new THREE.Color(backgroundColor),
        transparentBackground ? 0 : 1
      );
      return headless.readFrame(() => post.render());
    },

    dispose() {
      post.dispose();
      geometry.dispose();
      material.dispose();
      look.disposeLaneTextures(laneTextures);
      headless.dispose();
    },
  };
}

export const withCapturer = (kernel, options, work) =>
  withRenderer(
    options,
    () =>
      createBlobCapturer(kernel, {
        height: options.height * options.pixelRatio,
        width: options.width * options.pixelRatio,
      }),
    work
  );
