/* eslint-disable import/no-extraneous-dependencies, no-await-in-loop */
import {
  CLIP_SECONDS,
  RENDER_OPTIONS,
  SCENE_KEYS,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/rabbit/renderOptions.mjs';
import { createParseCli, withRenderer } from './generatorCli.mjs';
import {
  createHeadlessRenderer,
  loadThree,
  setClock,
  stubCanvas,
} from './headlessWebgpu.mjs';
import loadModules from './loadModules.mjs';
import {
  installGltfLoader,
  installTextureLoader,
  until,
} from './r3fHeadless.mjs';

// Barrels only — see docs/rabbit-pipeline.md.
const ENTRIES = {
  look: '/src/modules/rabbitRender/index.js',
  rabbit: '/src/modules/rabbit/index.js',
};

const FPS = 60;
const OCCLUSION_BIAS = 0.004;

// R3F runs through Vite rather than as Node's CommonJS copy, so its
// `instanceof THREE.Color` checks see the same three the stage does; the
// GLTF and texture loaders read public/ directly.
export async function loadKernel() {
  const { THREE, TSL } = await loadThree();
  installTextureLoader(THREE);
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  installGltfLoader(GLTFLoader);
  const loaded = await loadModules(Object.values(ENTRIES), {
    noExternal: ['@react-three/fiber'],
  });
  return {
    THREE,
    TSL,
    look: loaded[ENTRIES.look],
    rabbit: loaded[ENTRIES.rabbit],
  };
}

export const parseCli = createParseCli({
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
});

export function rollArgs(kernel, { options, typed }) {
  const { rabbit } = kernel;
  const config = new Set(rabbit.CONFIG_KEYS);
  return {
    base: options.base ? rabbit.configFrom(options.base) : {},
    keep: String(options.keep ?? '')
      .split(',')
      .map((facet) => facet.trim())
      .filter(Boolean),
    pinned: Object.fromEntries(
      [...typed]
        .filter((key) => config.has(key))
        .map((key) => [key, options[key]])
    ),
  };
}

// What a batch draws at `index`: names follow batch, batch-1, batch-2….
export function rabbitAt(kernel, { batch, index, roll }) {
  const { rabbit } = kernel;
  const name = rabbit.seedFor(batch, index);
  return { config: rabbit.rollRabbitConfig(name, roll), name };
}

const wrapClip = (seconds) =>
  ((seconds % CLIP_SECONDS) + CLIP_SECONDS) % CLIP_SECONDS;

// The scene keys a stage mounts with, from a generation config.
export const sceneConfig = (config) =>
  Object.fromEntries(SCENE_KEYS.map((key) => [key, config[key]]));

// One renderer and one R3F root per output size: the real RabbitStudio
// (the scene's subject under its lights) mounted with no frame loop, its
// clip started `settle` seconds before the moment and stepped at 60 fps
// into it, then captured.
export async function createRabbitCapturer(
  kernel,
  { height, pixelRatio, transparent, width }
) {
  const { look, rabbit } = kernel;
  const headless = await createHeadlessRenderer({
    configure(renderer, THREE) {
      /* eslint-disable no-param-reassign */
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.NeutralToneMapping;
      /* eslint-enable no-param-reassign */
    },
    height: height * pixelRatio,
    width: width * pixelRatio,
  });
  const { renderer, target } = headless;
  renderer.setOutputRenderTarget(target);
  const stage = await look.createStageRoot({
    canvas: stubCanvas(width * pixelRatio, height * pixelRatio),
    height,
    pixelRatio,
    renderer,
    width,
  });
  const captureDepth = look.createDepthCapture(renderer);
  let handles = {};
  let config = null;
  let clock = 0;

  // eslint-disable-next-line no-underscore-dangle
  const { nodeFrame } = renderer._nodes;

  const step = (seconds) => {
    nodeFrame.deltaTime = seconds - clock;
    nodeFrame.time = seconds;
    clock = seconds;
    setClock(seconds);
    stage.step(seconds);
  };

  async function frame(seconds) {
    setClock(seconds);
    return headless.readFrame(() => {
      clock = seconds;
      stage.step(seconds);
    });
  }

  const px = (n) => Math.round(n * pixelRatio);
  const depthOf = (only) =>
    captureDepth(stage.scene, stage.camera, px(width), px(height), only);

  return {
    // Mounts a generation with its clip `settle` seconds before the moment
    // and plays it in; returns the clock it settled at and the box the
    // framing fits.
    async load(next) {
      config = next;
      handles = {};
      const settle = Math.max(0, config.settle ?? 0);
      await stage.mount({
        config: sceneConfig(config),
        handles,
        startTime: wrapClip(config.poseTime - settle),
        transparent,
      });
      await until(
        () => look.subjectReady(handles),
        'the rabbit, arrows and grass to load',
        3000
      );
      await stage.flush();
      clock = 0;
      const frames = Math.max(1, Math.round(settle * FPS));
      const { scene } = stage;
      scene.visible = false;
      step(0);
      for (let f = 1; f <= frames; f += 1) {
        step(f / FPS);
        if (f % 10 === 0) await new Promise(setImmediate);
      }
      scene.visible = true;
      return {
        bounds: { points: look.subjectPoints(handles) },
        start: clock,
      };
    },

    // A still at the current clock, or the clip's next frame at `seconds`.
    async capture(view, seconds = clock) {
      look.aimCamera(stage.camera, view, width / height);
      return frame(seconds);
    },

    async svg(view, options) {
      look.aimCamera(stage.camera, view, width / height);
      const depth = rabbit.needsDepth(options)
        ? await depthOf(handles.subject)
        : null;
      const coverage = rabbit.needsCoverage(options)
        ? await depthOf(look.rabbitOnly(handles))
        : null;
      const image = rabbit.needsImage(options) ? await frame(clock) : null;
      return rabbit.renderRabbitSvg({
        ...rabbit.plotArgs(options, config),
        camera: view,
        coverage,
        image,
        subject: look.readSubject(handles, clock),
        visible: depth
          ? look.depthProbe(depth, pixelRatio, OCCLUSION_BIAS)
          : null,
      });
    },

    get clock() {
      return clock;
    },

    get handles() {
      return handles;
    },

    dispose() {
      stage.unmount();
      headless.dispose();
    },
  };
}

export const withCapturer = (kernel, options, work) =>
  withRenderer(
    options,
    () =>
      createRabbitCapturer(kernel, {
        height: options.height,
        pixelRatio: options.pixelRatio,
        transparent: options.transparent,
        width: options.width,
      }),
    work
  );
