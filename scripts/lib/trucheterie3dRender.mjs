/* eslint-disable import/no-extraneous-dependencies */
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

import {
  RENDER_OPTIONS,
  SCENE_KEYS,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/trucheterie3d/renderOptions.mjs';
import { parseArgs, providedKeys } from './cliArgs.mjs';
import { createHeadlessRenderer, loadThree } from './headlessWebgpu.mjs';
import loadModules, { REPO_ROOT } from './loadModules.mjs';
import { runStage } from './progress.mjs';

export { REPO_ROOT };

// Barrels only — see docs/trucheterie3d-pipeline.md.
const ENTRIES = {
  lights: '/src/modules/lightingRig/index.js',
  look: '/src/modules/trucheterie3dRender/index.js',
  tubes: '/src/modules/trucheterie3d/index.js',
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
    lights: pick('lights'),
    look: pick('look'),
    tubes: pick('tubes'),
  };
}

async function readJsonOption(value) {
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
  return { options: normalizeOptions(kind, raw), typed: providedKeys(args) };
}

export function assertPalette(kernel, { options, typed }) {
  const names = kernel.look.PALETTE_NAMES;
  if (typed.has('blobPalette') && !names.includes(options.blobPalette)) {
    throw new Error(
      `unknown palette "${options.blobPalette}". ${names.length} names are available in src/utils/gradients.json, plus "None".`
    );
  }
}

export function rollArgs(kernel, { options, typed }) {
  const scene = new Set(SCENE_KEYS);
  return {
    base: options.base ? kernel.tubes.configFrom(options.base) : {},
    keep: String(options.keep ?? '')
      .split(',')
      .map((facet) => facet.trim())
      .filter(Boolean),
    paletteNames: kernel.look.PALETTE_NAMES.filter((name) => name !== 'None'),
    pinned: Object.fromEntries(
      [...typed]
        .filter((key) => scene.has(key))
        .map((key) => [key, options[key]])
    ),
  };
}

// What a batch draws at `index`: seeds follow seed, seed-1, seed-2….
export function fieldAt(kernel, { baseSeed, index, roll }) {
  const { tubes } = kernel;
  const name = tubes.seedFor(baseSeed, index);
  const config = tubes.rollTubeConfig(name, roll);
  const field = tubes.buildField(config);
  return { config, field, name, tubes: tubes.buildTubes(field, config) };
}

export function sidecarFor({ config, name, options, tubes: built }) {
  return {
    name,
    preset: config,
    render: { ...options, base: undefined },
    stats: built.stats,
  };
}

// One renderer per output size, reused across fields and frames. Mirrors the
// scene: ACES through a RenderPipeline (only its output node applies the
// tone curve and sRGB encode), soft shadows, the rig's studio environment.
export async function createTubeCapturer(
  kernel,
  { height, samples = 4, shadows = true, width }
) {
  const { THREE, TSL, lights, look } = kernel;
  const headless = await createHeadlessRenderer({
    configure(renderer) {
      /* eslint-disable no-param-reassign */
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.shadowMap.enabled = shadows;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      /* eslint-enable no-param-reassign */
    },
    height,
    width,
  });
  const { renderer } = headless;
  const scene = new THREE.Scene();
  const cameras = {
    orthographic: new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100),
    perspective: new THREE.PerspectiveCamera(30, width / height, 0.1, 100),
  };
  const pipelines = {};
  const rig = look.createTubeRig();
  let current = null;
  let lightGroup = null;
  scene.add(rig.group);
  rig.setShadows(shadows);

  function pipelineFor(projection) {
    if (!pipelines[projection]) {
      const pipeline = new THREE.RenderPipeline(renderer);
      pipeline.outputNode = TSL.pass(
        scene,
        cameras[projection],
        samples > 0 ? { samples } : {}
      );
      pipelines[projection] = pipeline;
    }
    return pipelines[projection];
  }

  function aim(view) {
    const camera = cameras[view.projection];
    if (view.projection === 'orthographic') {
      Object.assign(camera, {
        bottom: -view.halfHeight,
        left: -view.halfWidth,
        right: view.halfWidth,
        top: view.halfHeight,
      });
    } else {
      camera.fov = view.fov;
    }
    camera.near = view.near;
    camera.far = view.far;
    camera.up.set(...view.up);
    camera.position.set(...view.eye);
    camera.lookAt(...view.target);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }

  // The first render after a uniform change reads back stale in Dawn.
  async function render(pipeline) {
    await headless.readFrame(() => pipeline.render());
    return headless.readFrame(() => pipeline.render());
  }

  return {
    // Sets the stage for a field and returns the world bounds views frame.
    load(drawn) {
      current = drawn;
      const { config } = drawn;
      rig.setTubes(drawn);
      rig.setGrowth(2);
      rig.updateEnvironment(renderer, scene, config);
      scene.background = new THREE.Color(config.sceneBgColor);
      lightGroup?.removeFromParent();
      lightGroup = lights.createSceneLights(
        lights.buildSceneLightingRuntimeConfig({
          controls: config,
          lighting: look.TRUCHETERIE3D_LIGHTING,
        }),
        { shadows }
      );
      scene.add(lightGroup);
      return kernel.tubes.tubeBounds(drawn.tubes, config);
    },

    setGrowth: (value) => rig.setGrowth(value),
    setPalettePhase: (phase) => rig.setPalettePhase(current.config, phase),

    async capture(view) {
      aim(view);
      return render(pipelineFor(view.projection));
    },

    dispose() {
      Object.values(pipelines).forEach((pipeline) => pipeline.dispose());
      rig.dispose();
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
      createTubeCapturer(kernel, {
        height: options.height * options.pixelRatio,
        shadows: options.shadows,
        width: options.width * options.pixelRatio,
      })
  );
  try {
    return await work(capturer);
  } finally {
    capturer.dispose();
  }
}

export async function encodeFrame(frame, format) {
  const image = sharp(frame.data, {
    raw: { channels: 4, height: frame.height, width: frame.width },
  });
  if (format === 'webp') return image.webp({ lossless: true }).toBuffer();
  return image.png().toBuffer();
}
