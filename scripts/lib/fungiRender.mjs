/* eslint-disable import/no-extraneous-dependencies */
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

import {
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/fungi/renderOptions.mjs';
import { parseArgs, providedKeys } from './cliArgs.mjs';
import { createHeadlessRenderer, loadThree } from './headlessWebgpu.mjs';
import loadModules, { REPO_ROOT } from './loadModules.mjs';
import overlayLayer from './overlayLayer.mjs';
import { runStage } from './progress.mjs';

export { REPO_ROOT };

// Barrels only — see docs/fungi-pipeline.md.
const ENTRIES = {
  fungi: '/src/modules/fungi/index.js',
  lights: '/src/modules/lightingRig/index.js',
  look: '/src/modules/fungiRender/index.js',
};

const DEG = Math.PI / 180;

// three must see the stubbed browser globals before any module that imports
// it is evaluated, so the renderer bootstrap runs first.
export async function loadKernel() {
  const { THREE, TSL } = await loadThree();
  const loaded = await loadModules(Object.values(ENTRIES));
  const pick = (name) => loaded[ENTRIES[name]];
  return {
    THREE,
    TSL,
    fungi: pick('fungi'),
    lights: pick('lights'),
    look: pick('look'),
  };
}

// A json option may name a file, and a file may be a props.json sidecar;
// either way the caller gets the payload.
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
  return {
    options: normalizeOptions(kind, raw),
    typed: providedKeys(args),
  };
}

export function rollArgs(kernel, { options, typed }) {
  const { fungi } = kernel;
  const scene = new Set(fungi.SCENE_KEYS);
  return {
    base: options.base ? fungi.configFrom(options.base) : {},
    keep: String(options.keep ?? '')
      .split(',')
      .map((facet) => facet.trim())
      .filter(Boolean),
    pinned: Object.fromEntries(
      [...typed]
        .filter((key) => scene.has(key))
        .map((key) => [fungi.sceneNameFor(key), options[key]])
    ),
    seeds: {
      cluster: options.clusterSeed ?? undefined,
      form: options.formSeed ?? undefined,
      palette: options.paletteSeed ?? undefined,
    },
  };
}

// What a batch draws at `index`: one rolled specimen, seeded the way the
// scene's regrow loop seeds its generations.
export function specimenAt(kernel, { index, options, roll }) {
  const { fungi } = kernel;
  const baseSeed = options.seed ?? fungi.randomSeed();
  const seed = options.seed == null ? baseSeed : fungi.seedFor(baseSeed, index);
  const config = fungi.rollFungiConfig(seed, roll);
  return { config, seed, specimen: fungi.buildSpecimen(config) };
}

// One renderer per output size, reused across frames: device and pipeline
// setup dominate a capture, and the rig's materials compile once.
export async function createFungiCapturer(
  kernel,
  { height, samples = 4, shadows = true, width }
) {
  const { THREE, lights, look } = kernel;

  // Mirrors src/app/scaffold/canvas/WebGPUCanvas.jsx: ACES tone mapping and
  // PCF soft shadows.
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
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, width / height, 0.05, 400);
  const { post, setGlow } = look.createSpecimenPost(
    headless.renderer,
    scene,
    camera,
    { samples }
  );
  const rig = look.createSpecimenRig();
  rig.setRenderer(headless.renderer);
  scene.add(rig.group);
  let lightGroup = null;
  let lightKey = null;
  let current = null;

  function setLights(config) {
    const key = config.backgroundColor;
    if (key === lightKey) return;
    lightKey = key;
    lightGroup?.removeFromParent();
    lightGroup = lights.createSceneLights(
      lights.buildSceneLightingRuntimeConfig({
        controls: config,
        lighting: look.FUNGI_LIGHTING,
      }),
      { shadows }
    );
    scene.add(lightGroup);
    scene.background = new THREE.Color(config.backgroundColor);
  }

  return {
    load({ config, specimen }) {
      current = specimen;
      rig.load(specimen);
      rig.setConfig(config);
      setGlow(specimen.genome.glow);
      setLights(config);
      return rig.bounds();
    },

    async capture({ eye, fov, levels, target }) {
      // A still runs the reaction field out to the iteration count its growth
      // level calls for, so a batch is repeatable.
      rig.setLevels(levels(current), { catchUp: true });
      const distance = Math.hypot(...eye.map((v, a) => v - target[a]));
      camera.near = Math.max(0.05, distance - rig.bounds().radius * 2.5);
      camera.far = distance + rig.bounds().radius * 3;
      camera.fov = fov;
      camera.position.set(...eye);
      camera.lookAt(...target);
      camera.updateProjectionMatrix();
      // The first render after a uniform change reads back stale in Dawn.
      await headless.readFrame(() => post.render());
      return headless.readFrame(() => post.render());
    },

    dispose() {
      rig.dispose();
      headless.dispose();
    },
  };
}

// Camera placement for a view, framing the fitted specimen's box.
export function frameView(
  kernel,
  { azimuthOffset = 0, bounds, options, view }
) {
  const [azimuth, elevation] = kernel.fungi.VIEW_ANGLES[view] ?? [20, 6];
  const az = (azimuth + azimuthOffset) * DEG;
  const el = elevation * DEG;
  const dir = [
    Math.sin(az) * Math.cos(el),
    Math.sin(el),
    Math.cos(az) * Math.cos(el),
  ];
  const half = (options.fov * DEG) / 2;
  const horizontal = Math.atan(
    Math.tan(half) * (options.width / options.height)
  );
  const [width, height, depth] = bounds.size;
  const across = Math.max(width, depth);
  const distance =
    Math.max(height / 2 / Math.tan(half), across / 2 / Math.tan(horizontal)) *
      (1 + options.margin) +
    across / 2;
  return {
    eye: bounds.center.map((v, a) => v + dir[a] * distance),
    fov: options.fov,
    target: bounds.center,
  };
}

export function sidecarFor({ config, options }) {
  return { preset: config, render: { ...options, base: undefined } };
}

// The chrome is composited onto the raw pixels so a frame is encoded once.
export async function encodeFrame(frame, format, options = {}) {
  let image = sharp(frame.data, {
    raw: { channels: 4, height: frame.height, width: frame.width },
  });
  if (options.overlay) {
    image = image.composite([
      {
        input: await overlayLayer({
          height: frame.height,
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

export async function withCapturer(kernel, options, work) {
  const capturer = await runStage(
    `initializing WebGPU renderer (${options.width * options.pixelRatio}x${
      options.height * options.pixelRatio
    })`,
    () =>
      createFungiCapturer(kernel, {
        height: options.height * options.pixelRatio,
        samples: options.samples,
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
