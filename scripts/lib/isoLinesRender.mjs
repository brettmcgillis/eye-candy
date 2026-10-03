/* eslint-disable import/no-extraneous-dependencies */
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

import {
  RENDER_OPTIONS,
  SCENE_KEYS,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/isoLines/renderOptions.mjs';
import { parseArgs, providedKeys } from './cliArgs.mjs';
import { createHeadlessRenderer, loadThree } from './headlessWebgpu.mjs';
import loadModules, { REPO_ROOT } from './loadModules.mjs';
import { runStage } from './progress.mjs';
import { loadImage } from './sourceImage.mjs';

export { REPO_ROOT };

// Barrels only — see docs/iso-lines-pipeline.md.
const ENTRIES = {
  iso: '/src/modules/isoLines/index.js',
  look: '/src/modules/isoLinesRender/index.js',
  post: '/src/modules/postRig/index.js',
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
    iso: pick('iso'),
    look: pick('look'),
    post: pick('post'),
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
  const { iso, look } = kernel;
  const scene = new Set(SCENE_KEYS);
  return {
    base: options.base ? iso.configFrom(options.base) : {},
    keep: String(options.keep ?? '')
      .split(',')
      .map((facet) => facet.trim())
      .filter(Boolean),
    palettes:
      options.palettes ??
      look.PALETTE_NAMES.filter(
        (name) => (look.getPaletteStops(name)?.length ?? 0) >= 2
      ),
    pinned: Object.fromEntries(
      [...typed]
        .filter((key) => scene.has(key))
        .map((key) => [key, options[key]])
    ),
  };
}

// What a batch draws at `index`: names follow batch, batch-1, batch-2….
// A source image without a typed weightImage drives the field alone.
export async function pieceAt(kernel, { batch, index, roll }) {
  const { iso, look } = kernel;
  const name = iso.seedFor(batch, index);
  const config = iso.rollIsoLinesConfig(name, roll);
  if (config.sourceImage && roll.pinned.weightImage == null) {
    Object.assign(config, {
      weightFocal: 0,
      weightImage: 1,
      weightNoise: 0,
      weightShape: 0,
    });
  }
  const image =
    config.sourceImage && config.weightImage > 0
      ? await loadImage(config.sourceImage, iso.SOURCE_IMAGE_MAX)
      : null;
  return {
    config,
    image,
    name,
    stops: look.getPaletteStops(config.paletteName),
  };
}

// One renderer per output size, reused across pieces and frames: device
// and pipeline setup dominate a capture, and the rig's materials compile once.
export async function createIsoCapturer(
  kernel,
  { height, samples = 4, width }
) {
  const { THREE, TSL, look, post } = kernel;

  const headless = await createHeadlessRenderer({
    configure(renderer) {
      // eslint-disable-next-line no-param-reassign
      renderer.toneMapping = THREE.NoToneMapping;
    },
    height,
    width,
  });
  const { renderer } = headless;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  const rig = look.createIsoRig();
  const passOptions = samples > 0 ? { samples } : {};
  const pipelines = {};
  let current = null;

  scene.add(rig.group);

  function currentPipeline() {
    const slots = post
      .buildScenePostRuntimeConfig(look.ISO_LINES_POST, current.config)
      .slots.filter((slot) => slot.enabled);
    const key = slots.map((slot) => slot.id).join('|');
    if (!pipelines[key]) {
      const chain =
        slots.length > 0
          ? post.createPostChain({
              camera,
              passOptions,
              renderer,
              scene,
              slots,
            })
          : null;
      let pipeline = chain?.pipeline;
      if (!pipeline) {
        pipeline = new THREE.RenderPipeline(renderer);
        pipeline.outputNode = TSL.pass(scene, camera, passOptions);
      }
      pipelines[key] = { chain, pipeline };
    }
    const entry = pipelines[key];
    entry.chain?.chain.forEach((link) => link.update(current.config, {}));
    return entry.pipeline;
  }

  function aim(view) {
    Object.assign(camera, {
      bottom: -view.halfHeight,
      far: view.far,
      left: -view.halfWidth,
      near: view.near,
      right: view.halfWidth,
      top: view.halfHeight,
    });
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

    // `pixelRatio` scales the px-sized line widths to the output.
    load(drawn, pixelRatio) {
      current = drawn;
      rig.apply(drawn.config);
      rig.setPixelRatio(pixelRatio);
      scene.background = new THREE.Color(drawn.config.background);
    },

    async capture(view, build) {
      aim(view);
      rig.setBuild(build);
      return render(currentPipeline());
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
      createIsoCapturer(kernel, {
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
  const image = sharp(frame.data, {
    raw: { channels: 4, height: frame.height, width: frame.width },
  });
  if (format === 'webp') return image.webp({ lossless: true }).toBuffer();
  return image.png().toBuffer();
}

export function sidecarFor({ config, name, options }) {
  return {
    name,
    preset: config,
    render: { ...options, base: undefined, palettes: undefined },
  };
}
