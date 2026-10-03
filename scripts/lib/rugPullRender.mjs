/* eslint-disable import/no-extraneous-dependencies */
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

import {
  RENDER_OPTIONS,
  SCENE_KEYS,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/rugPull/renderOptions.mjs';
import { parseArgs, providedKeys } from './cliArgs.mjs';
import { createHeadlessRenderer, loadThree } from './headlessWebgpu.mjs';
import loadModules, { REPO_ROOT } from './loadModules.mjs';
import { runStage } from './progress.mjs';

export { REPO_ROOT };

// Barrels only — see docs/rug-pull-pipeline.md.
const ENTRIES = {
  look: '/src/modules/rugPullRender/index.js',
  rug: '/src/modules/rugPull/index.js',
};

// three must see the stubbed browser globals before any module that imports
// it is evaluated, so the renderer bootstrap runs first.
export async function loadKernel() {
  const { THREE, TSL } = await loadThree();
  const loaded = await loadModules(Object.values(ENTRIES));
  return {
    THREE,
    TSL,
    look: loaded[ENTRIES.look],
    rug: loaded[ENTRIES.rug],
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

export function rollArgs(kernel, { options, typed }) {
  const scene = new Set(SCENE_KEYS);
  return {
    base: options.base ? kernel.rug.configFrom(options.base) : {},
    designPool: options.designPool,
    houseRate: options.houseRate,
    keep: String(options.keep ?? '')
      .split(',')
      .map((facet) => facet.trim())
      .filter(Boolean),
    palettePool: options.palettePool,
    pinned: Object.fromEntries(
      [...typed]
        .filter((key) => scene.has(key))
        .map((key) => [key, options[key]])
    ),
  };
}

export function rugAt(kernel, { batch, index, roll }) {
  const name = kernel.rug.seedFor(batch, index);
  const config = kernel.rug.rollRugConfig(name, roll);
  return { build: kernel.rug.buildRug(config), config, name };
}

export const viewsOf = (options) =>
  String(options.views)
    .split(',')
    .map((view) => view.trim())
    .filter(Boolean);

export function cartoonFrame(kernel, build, options) {
  const { rug } = kernel;
  return rug.rasterCartoon(build, {
    grid: options.cartoonGrid,
    scale: options.cartoonScale,
    warp: rug.hexToRgb(build.colors[build.colors.length - 1]),
  });
}

// Lays the rug out for a mode and lets the cloth settle, as the scene does
// before its first frame.
export function drape(kernel, { build, config }, mode, steps) {
  const { look, rug } = kernel;
  const layout = rug.clothLayout(build, config);
  const rodHeight = rug.rodHeightFor(build, config);
  const cloth = rug.createRugCloth(layout, {
    ...config,
    floorGap: look.FLOOR_GAP,
    iterations: 12,
    mode: mode === 'flat' ? 'floor' : mode,
    rodHeight,
    rumple: mode === 'flat' ? 0 : config.rumple,
    cornerFlip: mode === 'flat' ? 0 : config.cornerFlip,
    seed: build.cols,
    wallGap: look.WALL_GAP,
    wind: 0,
  });
  if (mode !== 'flat') cloth.settle(steps);
  return { cloth, layout, rodHeight };
}

// One renderer per output size, reused across rugs and views: device and
// pipeline setup dominate a capture, and the rig's materials compile once.
export async function createRugCapturer(
  kernel,
  { height, samples = 4, width }
) {
  const { THREE, TSL, look } = kernel;
  const headless = await createHeadlessRenderer({
    configure(renderer) {
      /* eslint-disable no-param-reassign */
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      /* eslint-enable no-param-reassign */
    },
    height,
    width,
  });
  const { renderer } = headless;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#141110');
  const cameras = {
    orthographic: new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100),
    perspective: new THREE.PerspectiveCamera(35, width / height, 0.05, 100),
  };
  const rig = look.createRugRig();
  scene.add(rig.group);
  const pipelines = {};

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
      camera.aspect = width / height;
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
    rig,

    load({ build, config }) {
      rig.apply(config);
      rig.setBuild(build);
    },

    async capture(view, draped, { config, mode }) {
      rig.setLayout(draped.layout, {
        clipCount: config.clipCount,
        hangStyle: config.hangStyle,
        mode: mode === 'flat' ? 'floor' : mode,
        rodHeight: draped.rodHeight,
      });
      rig.updateCloth(draped.cloth.positions);
      aim(view);
      return render(pipelineFor(view.projection));
    },

    dispose() {
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
      createRugCapturer(kernel, {
        height: options.height * options.pixelRatio,
        samples: options.samples,
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
  const image = sharp(Buffer.from(frame.data.buffer ?? frame.data), {
    raw: { channels: 4, height: frame.height, width: frame.width },
  });
  if (format === 'webp') return image.webp({ lossless: true }).toBuffer();
  return image.png().toBuffer();
}

export function sidecarFor({ build, config, name, options }) {
  return {
    name,
    preset: config,
    render: { ...options, base: undefined },
    weave: {
      bands: build.bands,
      cols: build.cols,
      house: build.mine,
      rows: build.rows,
    },
  };
}
