/* eslint-disable import/no-extraneous-dependencies */
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

import {
  RENDER_OPTIONS,
  SCENE_KEYS,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/kumiko/renderOptions.mjs';
import { parseArgs, providedKeys } from './cliArgs.mjs';
import { createHeadlessRenderer, loadThree } from './headlessWebgpu.mjs';
import loadModules, { REPO_ROOT } from './loadModules.mjs';
import { runStage } from './progress.mjs';

export { REPO_ROOT };

// Barrels only — see docs/kumiko-pipeline.md.
const ENTRIES = {
  kumiko: '/src/modules/kumiko/index.js',
  lights: '/src/modules/lightingRig/index.js',
  look: '/src/modules/kumikoRender/index.js',
};

const DEG = Math.PI / 180;

// Azimuth and elevation, in degrees, of each 3D view; `flat` is the 2D art.
export const VIEW_ANGLES = {
  angle: [-24, 12],
  front: [0, 0],
  raking: [-58, 6],
};

export async function loadKernel() {
  const { THREE, TSL } = await loadThree();
  const loaded = await loadModules(Object.values(ENTRIES));
  const pick = (name) => loaded[ENTRIES[name]];
  return {
    THREE,
    TSL,
    kumiko: pick('kumiko'),
    lights: pick('lights'),
    look: pick('look'),
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
  const { kumiko, look } = kernel;
  const scene = new Set(SCENE_KEYS);
  return {
    base: options.base ? kumiko.configFrom(options.base) : {},
    keep: String(options.keep ?? '')
      .split(',')
      .map((facet) => facet.trim())
      .filter(Boolean),
    palettes:
      options.palettes ??
      look.PALETTE_NAMES.filter((name) => look.paletteStops(name).length >= 3),
    pinned: Object.fromEntries(
      [...typed]
        .filter((key) => scene.has(key))
        .map((key) => [key, options[key]])
    ),
  };
}

const IMAGE_MAX = 1024;
const decoded = new Map();

// A source image as the RGBA bytes the kernel samples: a path under public/
// (images/…) as the scene would load it, or any file path.
export async function loadSourceImage(source) {
  if (!source) return null;
  if (!decoded.has(source)) {
    const inPublic = path.join(REPO_ROOT, 'public', source.replace(/^\//u, ''));
    const file = existsSync(inPublic) ? inPublic : path.resolve(source);
    const { data, info } = await sharp(file)
      .rotate()
      .resize(IMAGE_MAX, IMAGE_MAX, { fit: 'inside', withoutEnlargement: true })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    decoded.set(source, {
      channels: 4,
      data,
      height: info.height,
      width: info.width,
    });
  }
  return decoded.get(source);
}

// What a batch draws at `index`: seeds follow seed, seed-1, seed-2….
export async function panelAt(kernel, { index, options, roll }) {
  const { kumiko, look } = kernel;
  const baseSeed = options.seed ?? kumiko.randomSeed();
  const seed =
    options.seed == null ? baseSeed : kumiko.seedFor(baseSeed, index);
  const config = kumiko.rollKumikoConfig(seed, roll);
  const image = await loadSourceImage(config.sourceImage);
  return {
    config,
    image,
    panel: kumiko.buildPanel(config, { image }),
    seed: String(seed),
    stops: look.paletteStops(config.palette),
  };
}

export function renderFlatSvg(
  kernel,
  { config, options, panel, stops },
  style
) {
  return kernel.kumiko.renderKumikoSvg({
    config,
    frame:
      style === 'fill'
        ? {
            height: options.height * options.pixelRatio,
            margin: options.margin,
            width: options.width * options.pixelRatio,
          }
        : null,
    panel,
    stops,
    stroke: options.svgStroke,
    style,
  });
}

export async function encodeImage(input, format) {
  const image = sharp(
    input.data ?? input,
    input.data
      ? { raw: { channels: 4, height: input.height, width: input.width } }
      : {}
  );
  if (format === 'webp') return image.webp({ lossless: true }).toBuffer();
  return image.png().toBuffer();
}

// Headless 3D stills: the scene's rig, lights and tone mapping.
export async function createKumikoCapturer(
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
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, width / height, 0.05, 400);
  const pipeline = new THREE.RenderPipeline(headless.renderer);
  pipeline.outputNode = TSL.pass(scene, camera, samples > 0 ? { samples } : {});
  const rig = look.createPanelRig();
  scene.add(rig.group);
  scene.add(
    lights.createSceneLights(
      lights.buildSceneLightingRuntimeConfig({
        controls: {},
        lighting: look.KUMIKO_LIGHTING,
      }),
      { shadows }
    )
  );

  return {
    load({ config, image }) {
      scene.background = new THREE.Color(config.backgroundColor);
      return rig.setPanel(
        kernel.kumiko.buildLeaves(config, { image }),
        config,
        {
          immediate: true,
        }
      );
    },
    async capture({ eye, fov, target }) {
      camera.fov = fov;
      camera.position.set(...eye);
      camera.lookAt(...target);
      camera.updateProjectionMatrix();
      await headless.readFrame(() => pipeline.render());
      return headless.readFrame(() => pipeline.render());
    },
    dispose() {
      rig.dispose();
      headless.dispose();
    },
  };
}

export function frameView({ bounds, options, view }) {
  const [azimuth, elevation] = VIEW_ANGLES[view];
  const az = azimuth * DEG;
  const el = elevation * DEG;
  const dir = [
    Math.sin(az) * Math.cos(el),
    Math.sin(el),
    Math.cos(az) * Math.cos(el),
  ];
  const fov = 24;
  const half = (fov * DEG) / 2;
  const horizontal = Math.atan(
    Math.tan(half) * (options.width / options.height)
  );
  const [w, h] = bounds.size;
  const distance =
    Math.max(h / 2 / Math.tan(half), w / 2 / Math.tan(horizontal)) *
    (1 + options.margin * 2);
  return {
    eye: bounds.center.map((v, a) => v + dir[a] * distance),
    fov,
    target: bounds.center,
  };
}

export async function withCapturer(kernel, options, work) {
  const capturer = await runStage(
    `initializing WebGPU renderer (${options.width * options.pixelRatio}x${options.height * options.pixelRatio})`,
    () =>
      createKumikoCapturer(kernel, {
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

export function sidecarFor({ config, options, panel }) {
  return {
    preset: config,
    render: { ...options, base: undefined, palettes: undefined },
    stats: {
      leaves: panel.leaves.length,
      openings: panel.openings.length,
      pieces: panel.pieces.length,
      pool: panel.pool,
    },
  };
}
