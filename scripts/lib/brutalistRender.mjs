/* eslint-disable import/no-extraneous-dependencies */
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

import {
  RENDER_OPTIONS,
  SCENE_KEYS,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/brutalist/renderOptions.mjs';
import { parseArgs, providedKeys } from './cliArgs.mjs';
import { createHeadlessRenderer, loadThree } from './headlessWebgpu.mjs';
import loadModules, { REPO_ROOT } from './loadModules.mjs';
import { runStage } from './progress.mjs';

export { REPO_ROOT };

// Barrels only — see docs/brutalist-pipeline.md.
const ENTRIES = {
  kernel: '/src/modules/brutalist/index.js',
  lights: '/src/modules/lightingRig/index.js',
  look: '/src/modules/brutalistRender/index.js',
  post: '/src/modules/postRig/index.js',
};

// ez-tree loads its bark and leaf textures from data URIs at import time;
// the rig replaces its materials, so a do-nothing image is enough to let it
// evaluate. The stub exists only for the import.
async function loadTree() {
  const image = () => ({
    addEventListener() {},
    removeEventListener() {},
    style: {},
  });
  globalThis.document = { createElement: image, createElementNS: image };
  try {
    const { Tree } = await import('@dgreenheck/ez-tree');
    return Tree;
  } finally {
    delete globalThis.document;
  }
}

// three must see the stubbed browser globals before any module that imports
// it is evaluated, so the renderer bootstrap runs first.
export async function loadKernel() {
  const { THREE, TSL } = await loadThree();
  const Tree = await loadTree();
  const loaded = await loadModules(Object.values(ENTRIES));
  const pick = (name) => loaded[ENTRIES[name]];
  return {
    THREE,
    TSL,
    Tree,
    brutalist: pick('kernel'),
    lights: pick('lights'),
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
  const scene = new Set(SCENE_KEYS);
  return {
    base: options.base ? kernel.brutalist.configFrom(options.base) : {},
    keep: String(options.keep ?? '')
      .split(',')
      .map((facet) => facet.trim())
      .filter(Boolean),
    pinned: Object.fromEntries(
      [...typed]
        .filter((key) => scene.has(key))
        .map((key) => [key, options[key]])
    ),
  };
}

// What a batch draws at `index`: names follow batch, batch-1, batch-2….
export function structureAt(kernel, { batch, index, roll }) {
  const { brutalist } = kernel;
  const name = brutalist.seedFor(batch, index);
  const config = brutalist.rollBrutalistConfig(name, roll);
  const structure = brutalist.buildStructure(config);
  return {
    config,
    name,
    site: brutalist.scatterTrees(config, structure),
    structure,
  };
}

// One renderer per output size and stage, reused across structures and
// frames: device and pipeline setup dominate a capture.
export async function createCapturer(
  kernel,
  { height, pixelRatio = 1, samples = 4, shadows = true, stage, width }
) {
  const { THREE, TSL, Tree, brutalist, lights, look, post } = kernel;

  // Mirrors R3F's defaults: ACES tone mapping and soft shadows.
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
  const camera = new THREE.PerspectiveCamera(30, width / height, 0.5, 12000);
  const rig = look.createBrutalistRig({ Tree, stage });
  const lighting =
    stage === 'forest' ? look.FOREST_LIGHTING : look.MAQUETTE_LIGHTING;
  const passOptions = samples > 0 ? { samples } : {};
  const pipelines = {};
  let depthPipeline = null;
  let current = null;
  let lightGroup = null;

  scene.add(rig.group);
  rig.attach(scene);
  rig.setShadows(shadows);

  function pipeline() {
    const slots = post
      .buildScenePostRuntimeConfig(look.BRUTALIST_POST, current.config)
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
      let next = chain?.pipeline;
      if (!next) {
        next = new THREE.RenderPipeline(renderer);
        next.outputNode = TSL.pass(scene, camera, passOptions);
      }
      pipelines[key] = { chain, pipeline: next };
    }
    const entry = pipelines[key];
    entry.chain?.chain.forEach((link) => link.update(current.config, {}));
    return entry.pipeline;
  }

  // Linear depth over two 8-bit channels, for the plot's hidden lines.
  function depthPass() {
    if (depthPipeline) return depthPipeline;
    const unit = TSL.pass(scene, camera)
      .getLinearDepthNode()
      .clamp(0, 1)
      .mul(65535);
    const high = unit.div(256).floor();
    depthPipeline = new THREE.RenderPipeline(renderer);
    depthPipeline.outputColorTransform = false;
    depthPipeline.outputNode = TSL.vec4(
      high.div(255),
      unit.sub(high.mul(256)).floor().div(255),
      0,
      1
    );
    return depthPipeline;
  }

  function aim(view) {
    camera.fov = view.fov;
    camera.near = view.near;
    camera.far = view.far;
    camera.up.set(...view.up);
    camera.position.set(...view.eye);
    camera.lookAt(...view.target);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }

  // The first render after a uniform change reads back stale in Dawn.
  async function render(next) {
    await headless.readFrame(() => next.render());
    return headless.readFrame(() => next.render());
  }

  return {
    load(drawn) {
      current = drawn;
      const { config, site, structure } = drawn;
      rig.apply(config);
      rig.setStructure(structure, config);
      rig.setSite(site, config);
      rig.setPhase(0);
      renderer.toneMappingExposure = stage === 'forest' ? config.exposure : 1;
      scene.background =
        stage === 'forest' ? null : new THREE.Color(config.studioBackground);
      lightGroup?.removeFromParent();
      lightGroup = lights.createSceneLights(
        lights.buildSceneLightingRuntimeConfig({ controls: config, lighting }),
        { shadows }
      );
      scene.add(lightGroup);
    },

    frame(options, view, extra = {}) {
      return brutalist.frameView({
        groundAt: (x, z) =>
          brutalist.groundAt(x, z, current.config, current.site?.foot ?? 0),
        options,
        stage,
        standoff: (current.site?.foot ?? 0) + current.config.clearing,
        structure: current.structure,
        transform: rig.transform,
        view,
        ...extra,
      });
    },

    async capture(view, phase = 0) {
      aim(view);
      rig.setPhase(phase);
      return render(pipeline());
    },

    async captureDepth(view) {
      aim(view);
      const frame = await render(depthPass());
      const depths = new Float32Array(frame.width * frame.height);
      for (let i = 0; i < depths.length; i += 1) {
        const unit = (frame.data[i * 4] * 256 + frame.data[i * 4 + 1]) / 65535;
        depths[i] = view.near + unit * (view.far - view.near);
      }
      return { data: depths, height: frame.height, width: frame.width };
    },

    // A hidden-line test in output pixels. The farthest of a 3×3 patch is
    // used so an edge is not hidden by the face it bounds.
    depthProbe(depth) {
      const clampTo = (v, max) => Math.min(Math.max(v, 0), max - 1);
      return (x, y, z) => {
        const px = Math.round(x * pixelRatio);
        const py = Math.round(y * pixelRatio);
        let farthest = -Infinity;
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            const sx = clampTo(px + dx, depth.width);
            const sy = clampTo(py + dy, depth.height);
            farthest = Math.max(farthest, depth.data[sy * depth.width + sx]);
          }
        }
        return z <= farthest;
      };
    },

    svg(view, options, visible) {
      return brutalist.renderBrutalistSvg({
        camera: view,
        height: options.height,
        stroke: options.svgStroke,
        structure: current.structure,
        transform: rig.transform,
        visible,
        width: options.width,
      });
    },

    dispose() {
      rig.detach(scene);
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
      createCapturer(kernel, {
        height: options.height * options.pixelRatio,
        pixelRatio: options.pixelRatio,
        samples: options.samples,
        shadows: options.shadows,
        stage: options.stage,
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
    render: { ...options, base: undefined },
  };
}
