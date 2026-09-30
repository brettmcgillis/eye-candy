/* eslint-disable import/no-extraneous-dependencies */
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

import {
  RENDER_OPTIONS,
  SCENE_KEYS,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/hyperCubes/renderOptions.mjs';
import { parseArgs, providedKeys } from './cliArgs.mjs';
import { createHeadlessRenderer, loadThree } from './headlessWebgpu.mjs';
import loadModules, { REPO_ROOT } from './loadModules.mjs';
import { runStage } from './progress.mjs';

export { REPO_ROOT };

// Barrels only — see docs/hyper-cubes-pipeline.md.
const ENTRIES = {
  cubes: '/src/modules/hyperCubes/index.js',
  lights: '/src/modules/lightingRig/index.js',
  look: '/src/modules/hyperCubesRender/index.js',
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
    cubes: pick('cubes'),
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
  const { cubes, look } = kernel;
  const scene = new Set(SCENE_KEYS);
  return {
    base: options.base ? cubes.configFrom(options.base) : {},
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
export function structureAt(kernel, { batch, index, roll }) {
  const { cubes, look } = kernel;
  const name = cubes.seedFor(batch, index);
  const config = cubes.rollHyperCubesConfig(name, roll);
  return {
    config,
    name,
    stops: look.getPaletteStops(config.paletteName),
    tree: cubes.buildTree(config),
  };
}

// One renderer per output size, reused across structures and frames: device
// and pipeline setup dominate a capture, and the rig's materials compile once.
export async function createCubeCapturer(
  kernel,
  { height, pixelRatio = 1, samples = 4, shadows = true, width }
) {
  const { THREE, TSL, cubes, lights, look, post } = kernel;

  // Mirrors the scene: WebGPUCanvas's soft shadows, and useFlatToneMapping.
  const headless = await createHeadlessRenderer({
    configure(renderer) {
      /* eslint-disable no-param-reassign */
      renderer.toneMapping = THREE.NoToneMapping;
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
    perspective: new THREE.PerspectiveCamera(35, width / height, 0.1, 100),
  };
  const rig = look.createCubeRig();
  const passOptions = samples > 0 ? { samples } : {};
  const pipelines = {};
  const depthPipelines = {};
  let camera = cameras.orthographic;
  let current = null;
  let lightGroup = null;

  scene.add(rig.group);
  rig.setShadows(shadows);

  function pipelineFor(projection) {
    const slots = post
      .buildScenePostRuntimeConfig(look.HYPER_CUBES_POST, current.config)
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

  // Linear depth over two 8-bit channels: one channel over the frustum is
  // coarser than the smaller cells the hidden-line test has to resolve. An
  // orthographic depth buffer is already linear.
  function depthPass(projection) {
    if (depthPipelines[projection]) return depthPipelines[projection];
    const scenePass = TSL.pass(scene, cameras[projection]);
    const linear =
      projection === 'orthographic'
        ? scenePass.getTextureNode('depth').r
        : scenePass.getLinearDepthNode();
    const unit = linear.clamp(0, 1).mul(65535);
    const high = unit.div(256).floor();
    const pipeline = new THREE.RenderPipeline(renderer);
    pipeline.outputColorTransform = false;
    pipeline.outputNode = TSL.vec4(
      high.div(255),
      unit.sub(high.mul(256)).floor().div(255),
      0,
      1
    );
    depthPipelines[projection] = pipeline;
    return pipeline;
  }

  function aim(view) {
    camera = cameras[view.projection];
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

  const settled = () =>
    cubes.buildInstances({
      config: current.config,
      from: current.tree.root,
      stops: current.stops,
    });

  return {
    // Sets the stage for a structure and returns the bounds views are framed on.
    load(drawn) {
      current = drawn;
      const { config } = drawn;
      rig.apply(config);
      rig.updateEnvironment(renderer, scene, config);
      scene.background = new THREE.Color(config.background);
      lightGroup?.removeFromParent();
      lightGroup = lights.createSceneLights(
        lights.buildSceneLightingRuntimeConfig({
          controls: config,
          lighting: look.HYPER_CUBES_LIGHTING,
        }),
        { shadows }
      );
      scene.add(lightGroup);
      return cubes.domainBounds(config);
    },

    // `instances` defaults to the loaded structure, settled.
    async capture(view, instances = null) {
      aim(view);
      rig.setInstances(instances ?? settled());
      return render(pipelineFor(view.projection));
    },

    async captureDepth(view) {
      aim(view);
      rig.setInstances(settled());
      const frame = await render(depthPass(view.projection));
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
      return cubes.renderHyperCubesSvg({
        camera: view,
        config: current.config,
        height: options.height,
        instances: settled(),
        stroke: options.svgStroke,
        visible,
        width: options.width,
      });
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
      createCubeCapturer(kernel, {
        height: options.height * options.pixelRatio,
        pixelRatio: options.pixelRatio,
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
