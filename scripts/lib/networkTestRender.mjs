/* eslint-disable import/no-extraneous-dependencies */
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

import {
  RENDER_OPTIONS,
  SCENE_KEYS,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/networkTest/renderOptions.mjs';
import { parseArgs, providedKeys } from './cliArgs.mjs';
import { createHeadlessRenderer, loadThree } from './headlessWebgpu.mjs';
import loadModules, { REPO_ROOT } from './loadModules.mjs';
import { runStage } from './progress.mjs';
import { loadImage } from './sourceImage.mjs';

export { REPO_ROOT };

// Barrels only — see docs/network-test-pipeline.md.
const ENTRIES = {
  look: '/src/modules/networkTestRender/index.js',
  net: '/src/modules/networkTest/index.js',
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
    look: pick('look'),
    net: pick('net'),
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
  const { look, net } = kernel;
  const scene = new Set(SCENE_KEYS);
  return {
    base: options.base ? net.configFrom(options.base) : {},
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
// A source image without a typed imageShare is drawn alone.
export async function networkAt(kernel, { batch, index, roll }) {
  const { look, net } = kernel;
  const name = net.seedFor(batch, index);
  const config = net.rollNetworkTestConfig(name, roll);
  if (config.sourceImage && roll.pinned.imageShare == null) {
    config.imageShare = 1;
  }
  const image =
    config.sourceImage && config.imageShare > 0
      ? await loadImage(config.sourceImage, net.SOURCE_IMAGE_MAX)
      : null;
  return {
    config,
    name,
    network: net.buildNetwork(config, { image }),
    stops: look.getPaletteStops(config.paletteName),
  };
}

// What sticks out of a point: node sprites, and in a drift clip the
// furthest a point can wander.
export function padFor({ config }, { drift = false } = {}) {
  const unit = Math.min(config.domainX, config.domainY, config.domainZ);
  return (
    Math.max(config.nodeSize, config.pulseSize) +
    (drift ? config.driftAmount * unit * 1.5 : 0)
  );
}

// One renderer per output size, reused across networks and frames: device
// and pipeline setup dominate a capture, and the rig's materials compile once.
export async function createNetworkCapturer(
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
  const cameras = {
    orthographic: new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100),
    perspective: new THREE.PerspectiveCamera(32, width / height, 0.1, 100),
  };
  const rig = look.createNetworkRig();
  const passOptions = samples > 0 ? { samples } : {};
  const pipelines = {};
  let current = null;

  scene.add(rig.group);

  function pipelineFor(projection) {
    const slots = post
      .buildScenePostRuntimeConfig(look.NETWORK_TEST_POST, current.config)
      .slots.filter((slot) => slot.enabled);
    const key = [projection, ...slots.map((slot) => slot.id)].join('|');
    if (!pipelines[key]) {
      const chain =
        slots.length > 0
          ? post.createPostChain({
              camera: cameras[projection],
              passOptions,
              renderer,
              scene,
              slots,
            })
          : null;
      let pipeline = chain?.pipeline;
      if (!pipeline) {
        pipeline = new THREE.RenderPipeline(renderer);
        pipeline.outputNode = TSL.pass(scene, cameras[projection], passOptions);
      }
      pipelines[key] = { chain, pipeline };
    }
    const entry = pipelines[key];
    entry.chain?.chain.forEach((link) => link.update(current.config, {}));
    return entry.pipeline;
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
    rig.setDepthRange(view.depthNear, view.depthFar);
  }

  // The first render after a uniform change reads back stale in Dawn.
  async function render(pipeline) {
    await headless.readFrame(() => pipeline.render());
    return headless.readFrame(() => pipeline.render());
  }

  return {
    load(drawn) {
      current = drawn;
      rig.apply(drawn.config);
      scene.background = new THREE.Color(drawn.config.background);
    },

    async capture(view, instances) {
      aim(view);
      rig.setInstances(instances);
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
      createNetworkCapturer(kernel, {
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

// A settled network with its signals advanced to `seconds`.
export function settledInstances(kernel, drawn, seconds) {
  const { net } = kernel;
  const { config, network, stops } = drawn;
  const pulses = net.createPulses(config.wireSeed, config.pulseCount);
  pulses.advance(network, network.positions, seconds, config.pulseSpeed);
  return net.buildInstances({
    config,
    network,
    pulses: pulses.pulses,
    stops,
  });
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
