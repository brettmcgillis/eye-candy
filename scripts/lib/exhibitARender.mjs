/* eslint-disable import/no-extraneous-dependencies */
import { readFile } from 'node:fs/promises';

import {
  RENDER_OPTIONS,
  SCENE_KEYS,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/exhibitA/renderOptions.mjs';
import { parseArgs, providedKeys } from './cliArgs.mjs';
import { createHeadlessRenderer, loadThree } from './headlessWebgpu.mjs';
import loadModules, { REPO_ROOT } from './loadModules.mjs';

export { REPO_ROOT };

// Barrels only — see docs/exhibit-a-pipeline.md.
const ENTRIES = {
  exhibit: '/src/modules/exhibitA/index.js',
  look: '/src/modules/exhibitARender/index.js',
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
    exhibit: pick('exhibit'),
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
  const { exhibit, look } = kernel;
  const scene = new Set(SCENE_KEYS);
  return {
    base: options.base ? exhibit.configFrom(options.base) : {},
    families: exhibit.resolveFamilies(options.families),
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
export function exhibitAt(kernel, { batch, index, roll }) {
  const { exhibit, look } = kernel;
  const name = exhibit.seedFor(batch, index);
  const config = exhibit.rollExhibitConfig(name, roll);
  return { config, name, stops: look.getPaletteStops(config.paletteName) };
}

// One renderer per output size, reused across exhibits and frames: device
// and pipeline setup dominate a capture, and the rig's materials compile
// once.
export async function createExhibitCapturer(
  kernel,
  { height, samples = 4, width }
) {
  const { THREE, TSL, exhibit, look, post } = kernel;

  // Mirrors the scene: WebGPUCanvas's soft shadows, and useFlatToneMapping.
  const headless = await createHeadlessRenderer({
    configure(renderer) {
      /* eslint-disable no-param-reassign */
      renderer.toneMapping = THREE.NoToneMapping;
      renderer.shadowMap.enabled = true;
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
  const rig = look.createExhibitRig();
  const passOptions = samples > 0 ? { samples } : {};
  const pipelines = {};
  let current = null;

  scene.add(rig.group);

  function pipelineFor(projection) {
    const slots = post
      .buildScenePostRuntimeConfig(look.EXHIBIT_A_POST, current.config)
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
  }

  // The first render after a uniform change reads back stale in Dawn.
  async function render(pipeline) {
    await headless.readFrame(() => pipeline.render());
    return headless.readFrame(() => pipeline.render());
  }

  return {
    // Builds the exhibit and sets the stage; returns the layout views are
    // framed on.
    load(drawn) {
      const build = exhibit.buildExhibit(drawn.config);
      const footprint = exhibit.exhibitFootprint(drawn.config, build);
      current = { ...drawn, build, footprint };
      rig.setExhibit(drawn.config, build, footprint);
      rig.updateEnvironment(renderer, scene, drawn.config);
      scene.background = new THREE.Color(drawn.config.background);
      return rig.apply(drawn.config, { stops: drawn.stops });
    },

    // One frame. `config` overrides the loaded one (an evolve step), and a
    // mesh exhibit is rebuilt when it is given; `progress` and
    // `lightAzimuth` drive a draw and a light sweep.
    async capture(view, { config = null, lightAzimuth, progress = 1 } = {}) {
      const shown = config ?? current.config;
      if (config && exhibit.FAMILY_KINDS[config.family] !== 'field') {
        rig.setExhibit(config, exhibit.buildExhibit(config), current.footprint);
      }
      rig.apply(shown, {
        lightAzimuth: lightAzimuth ?? shown.lightAzimuth,
        progress,
        stops: current.stops,
      });
      aim(view);
      return render(pipelineFor(view.projection));
    },

    dispose() {
      Object.values(pipelines).forEach(({ chain, pipeline }) => {
        chain?.dispose?.();
        pipeline.dispose?.();
      });
      rig.dispose();
      headless.dispose();
    },
  };
}
