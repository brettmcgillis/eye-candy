/* eslint-disable import/no-extraneous-dependencies */
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

import {
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/trucheterieBlob/renderOptions.mjs';
import { parseArgs, providedKeys } from './cliArgs.mjs';
import { createHeadlessRenderer, loadThree } from './headlessWebgpu.mjs';
import loadModules, { REPO_ROOT } from './loadModules.mjs';
import overlayLayer from './overlayLayer.mjs';
import { runStage } from './progress.mjs';

export { REPO_ROOT };

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

export async function readJsonOption(value) {
  if (value == null || typeof value !== 'string') return value;
  if (/^\s*[[{]/u.test(value)) return JSON.parse(value);
  return JSON.parse(await readFile(value, 'utf8'));
}

// A typed flag is a pin; the set is read before defaults are merged.
export async function parseCli(kind, argv) {
  const args = parseArgs(argv, defaultsFor(kind));
  if (args.help) return { help: true };
  const raw = { ...args };
  await Promise.all(
    Object.entries(RENDER_OPTIONS)
      .filter(([, spec]) => spec.type === 'json')
      .map(async ([key]) => {
        raw[key] = await readJsonOption(args[key]);
      })
  );
  return {
    options: normalizeOptions(kind, raw),
    typed: providedKeys(args),
  };
}

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
    pinned: Object.fromEntries(
      [...typed]
        .filter((key) => scene.has(key))
        .map((key) => [kernel.blob.sceneNameFor(key), options[key]])
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
  return kernel.blob.buildBlobField({
    canvasSize: config.blobCanvasSize,
    connectivity: config.blobConnectivity,
    distributionCount: config.blobDistribution,
    gridSize: config.blobGridSize,
    holes: config.blobHoles,
    meatballs: config.blobMeatballs,
    oneFill: config.blobOneFill,
    seed: config.blobSeed,
    sizeFunction: config.blobSizeFunction,
  });
}

// The vector twin of a capture: plottable stroke centrelines, no fill, no
// palette — see @modules/trucheterieBlob/renderSvg.js.
export function renderSvg(kernel, field, config, options) {
  return kernel.blob.renderBlobSvg(field, {
    height: options.height,
    margin: options.margin,
    pathDiv: config.blobPathsPerUnit,
    planeRotation: config.planeRotation,
    strokeColor: config.strokeColor,
    strokeWidth: options.svgStroke,
    width: options.width,
  });
}

// `options` carries the overlay settings; the chrome is composited onto the
// raw pixels so a frame is encoded exactly once.
export async function encodeFrame(frame, format, options = {}) {
  let image = sharp(frame.data, {
    raw: { channels: 4, height: frame.height, width: frame.width },
  });
  if (options.overlay) {
    image = image.composite([
      {
        input: await overlayLayer({
          height: frame.height,
          icon: 'trucheterie.svg',
          ig: options.ig === 'none' ? null : options.ig,
          version: options.version,
          viewport: options.viewport,
          width: frame.width,
        }),
      },
    ]);
  }
  if (format === 'raw') return image.ensureAlpha().raw().toBuffer();
  if (format === 'webp') return image.webp({ lossless: true }).toBuffer();
  return image.png().toBuffer();
}

// One renderer per output size, reused across frames. The field is flat and
// unlit, so this needs no lighting rig and no perspective camera: an
// orthographic camera framed to the drawn bounds is the whole "shot".
export async function createBlobCapturer(kernel, { height, width }) {
  const { THREE, look } = kernel;

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
  const geometry = new THREE.PlaneGeometry(1, 1);
  const laneTexture = look.createLaneTexture();
  const uniforms = look.createBlobUniforms('#141414');
  const material = look.createBlobMaterial(uniforms, laneTexture);
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

    camera.left = centerX - half * aspect;
    camera.right = centerX + half * aspect;
    camera.top = centerY + half;
    camera.bottom = centerY - half;
    camera.position.set(centerX, centerY, 10);
    camera.lookAt(centerX, centerY, 0);
    camera.updateProjectionMatrix();
  }

  return {
    // `config` is a scene-keyed field config (renderOptions.mjs SCENE_KEYS).
    setField(config) {
      const field = kernel.blob.buildBlobField({
        canvasSize: config.blobCanvasSize,
        connectivity: config.blobConnectivity,
        distributionCount: config.blobDistribution,
        gridSize: config.blobGridSize,
        holes: config.blobHoles,
        meatballs: config.blobMeatballs,
        oneFill: config.blobOneFill,
        seed: config.blobSeed,
        sizeFunction: config.blobSizeFunction,
      });
      const laneInfo = look.fillLaneTexture(laneTexture, field.cells, {
        exact: config.blobPaletteExact,
        fallback: config.bgColor,
        mode: config.blobLaneMode,
        monoColor: config.blobMonoColor,
        monochrome: config.blobMonochrome,
        palette: config.blobPalette,
        pathDiv: config.blobPathsPerUnit,
        seed: config.blobSeed,
        shuffleSeed: config.blobPaletteShuffle,
      });
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
      return look.fieldBounds(field);
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
      look.fillLaneTexture(laneTexture, field.cells, {
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
      });
    },

    async capture({ backgroundColor, bounds, margin, transparentBackground }) {
      frameCamera(bounds, margin);
      headless.renderer.setClearColor(
        new THREE.Color(backgroundColor),
        transparentBackground ? 0 : 1
      );
      return headless.readFrame(() => headless.renderer.render(scene, camera));
    },

    dispose() {
      geometry.dispose();
      material.dispose();
      laneTexture.dispose();
      headless.dispose();
    },
  };
}

export async function withCapturer(kernel, options, work) {
  const capturer = await runStage(
    `initializing WebGPU renderer (${options.width * options.pixelRatio}x${
      options.height * options.pixelRatio
    })`,
    () =>
      createBlobCapturer(kernel, {
        height: options.height * options.pixelRatio,
        width: options.width * options.pixelRatio,
      })
  );
  try {
    return await work(capturer);
  } finally {
    capturer.dispose();
  }
}
