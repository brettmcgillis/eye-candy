/* eslint-disable import/no-extraneous-dependencies */
import {
  RENDER_OPTIONS,
  SCENE_KEYS,
  defaultsFor,
  normalizeOptions,
  resolveVariants,
} from '../../src/modules/imperfection/renderOptions.mjs';
import {
  createParseCli,
  loadKernelModules,
  withRenderer,
} from './generatorCli.mjs';
import { createHeadlessRenderer } from './headlessWebgpu.mjs';
import { loadImage } from './sourceImage.mjs';

const SOURCE_MAX = 1024;

// Barrels only — see docs/imperfection-pipeline.md.
const ENTRIES = {
  imperfection: '/src/modules/imperfection/index.js',
  look: '/src/modules/imperfectionRender/index.js',
};

export const loadKernel = () => loadKernelModules(ENTRIES);

export const parseCli = createParseCli({
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
});

export function rollArgs(kernel, { options, typed }) {
  const { imperfection, look } = kernel;
  const pinnable = new Set(SCENE_KEYS);
  return {
    base: options.base ? imperfection.configFrom(options.base) : {},
    keep: String(options.keep ?? '')
      .split(',')
      .map((facet) => facet.trim())
      .filter(Boolean),
    palettes:
      options.palettes ??
      look.PALETTE_NAMES.filter(
        (name) => (look.getPaletteStops(name)?.length ?? 0) >= 3
      ),
    pinned: Object.fromEntries(
      [...typed]
        .filter((key) => pinnable.has(key))
        .map((key) => [key, options[key]])
    ),
    variants: resolveVariants(options.variants),
  };
}

// What a batch draws at `index`: names follow batch, batch-1, batch-2….
export function paintingAt(kernel, { batch, index, options, roll }) {
  const { imperfection } = kernel;
  const name = imperfection.seedFor(batch, index);
  const config = {
    ...options,
    ...imperfection.rollImperfectionConfig(name, roll),
  };
  return { config, name };
}

// One renderer per output size, reused across paintings and frames; each
// version's material compiles once.
export async function createPaintCapturer(kernel, { height, width }) {
  const { THREE, TSL, look } = kernel;
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
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 1;
  const rig = look.createPaintRig();
  scene.add(rig.mesh);
  const pipeline = new THREE.RenderPipeline(renderer);
  pipeline.outputNode = TSL.pass(scene, camera);

  let sourceKey = null;
  async function useSource(config) {
    const key = config.fieldSource === 'image' ? config.sourceImage : '';
    if (key === sourceKey) return;
    sourceKey = key;
    rig.setSource(key ? await loadImage(key, SOURCE_MAX) : null);
  }

  return {
    async capture(config, { time = 0, view = 'painting' } = {}) {
      await useSource(config);
      rig.apply(config, { time, view });
      return headless.readFrame(() => pipeline.render());
    },

    dispose() {
      rig.dispose();
      headless.dispose();
    },
  };
}

export const withCapturer = (kernel, options, work) =>
  withRenderer(
    options,
    () =>
      createPaintCapturer(kernel, {
        height: options.height * options.pixelRatio,
        width: options.width * options.pixelRatio,
      }),
    work
  );

const sceneConfig = (config) =>
  Object.fromEntries(SCENE_KEYS.map((key) => [key, config[key]]));

export function sidecarFor({ config, name, options }) {
  return {
    name,
    preset: sceneConfig(config),
    render: { ...options, base: undefined },
  };
}
