/* eslint-disable import/no-extraneous-dependencies */
import {
  RENDER_OPTIONS,
  SCENE_KEYS,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/isoLinesRelief/renderOptions.mjs';
import {
  createParseCli,
  loadKernelModules,
  withRenderer,
} from './generatorCli.mjs';
import { createHeadlessRenderer } from './headlessWebgpu.mjs';
import { loadImage } from './sourceImage.mjs';

// Barrels only — see docs/iso-lines-relief-pipeline.md.
const ENTRIES = {
  iso: '/src/modules/isoLines/index.js',
  look: '/src/modules/isoLinesReliefRender/index.js',
  post: '/src/modules/postRig/index.js',
  relief: '/src/modules/isoLinesRelief/index.js',
};

export const loadKernel = () => loadKernelModules(ENTRIES);

export const parseCli = createParseCli({
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
});

export function rollArgs(kernel, { options, typed }) {
  const { look, relief } = kernel;
  const scene = new Set(SCENE_KEYS);
  return {
    base: options.base ? relief.configFrom(options.base) : {},
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
  const { iso, look, relief } = kernel;
  const name = iso.seedFor(batch, index);
  const config = relief.rollIsoLinesReliefConfig(name, roll);
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
export async function createReliefCapturer(
  kernel,
  { height, samples = 4, width }
) {
  const { THREE, TSL, look, post } = kernel;

  const headless = await createHeadlessRenderer({
    configure(renderer) {
      // eslint-disable-next-line no-param-reassign
      renderer.toneMapping = THREE.NoToneMapping;
      // eslint-disable-next-line no-param-reassign
      renderer.shadowMap.enabled = true;
      // eslint-disable-next-line no-param-reassign
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
  const rig = look.createReliefRig();
  const passOptions = samples > 0 ? { samples } : {};
  const pipelines = {};
  let current = null;

  scene.add(rig.group);

  function pipelineFor(projection) {
    const slots = post
      .buildScenePostRuntimeConfig(look.ISO_LINES_RELIEF_POST, current.config)
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

  async function render(pipeline) {
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

    async capture(view, build, motion = {}) {
      aim(view);
      rig.setBuild(build);
      rig.setTime(build.time);
      rig.setMotion(motion);
      return render(pipelineFor(view.projection));
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
      createReliefCapturer(kernel, {
        height: options.height * options.pixelRatio,
        samples: options.samples,
        width: options.width * options.pixelRatio,
      }),
    work
  );
