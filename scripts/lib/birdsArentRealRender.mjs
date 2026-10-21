/* eslint-disable import/no-extraneous-dependencies, no-await-in-loop */
import {
  RENDER_OPTIONS,
  SCENE_KEYS,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/birdsArentReal/renderOptions.mjs';
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

// Barrels only — see docs/birds-arent-real-pipeline.md.
const ENTRIES = {
  birds: '/src/modules/birdsArentReal/index.js',
  look: '/src/modules/birdsArentRealRender/index.js',
};

const FPS = 60;

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
    birds: loaded[ENTRIES.birds],
    look: loaded[ENTRIES.look],
  };
}

export const parseCli = createParseCli({
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
});

export function rollArgs(kernel, { options, typed }) {
  const { birds, look } = kernel;
  const scene = new Set(SCENE_KEYS);
  return {
    base: options.base ? birds.configFrom(options.base) : {},
    keep: String(options.keep ?? '')
      .split(',')
      .map((facet) => facet.trim())
      .filter(Boolean),
    pinned: Object.fromEntries(
      [...typed]
        .filter((key) => scene.has(key))
        .map((key) => [key, options[key]])
    ),
    species: look.SPECIES_NAMES,
  };
}

// What a batch draws at `index`: names follow batch, batch-1, batch-2….
export function flockAt(kernel, { batch, index, roll }) {
  const { birds, look } = kernel;
  const name = birds.seedFor(batch, index);
  const config = birds.rollFlockConfig(name, roll);
  if (!look.SPECIES_NAMES.includes(config.species)) {
    throw new Error(
      `Unknown species "${config.species}"; species are ${look.SPECIES_NAMES.join(', ')}.`
    );
  }
  return { config, name };
}

// The flock's bounding sphere, from its layout — known before the stage
// mounts, so `gaze: camera` can look at the hero camera while it settles.
export function boundsOf(kernel, config) {
  const { birds } = kernel;
  return birds.flockBounds(birds.layoutFlock(config));
}

// One renderer and one R3F root per output size: the real BirdStudio stage
// (FakeBirds, GhostBuster's studio, the shadow floor) mounted with no frame
// loop, stepped at 60 fps for the settle, then captured.
export async function createFlockCapturer(
  kernel,
  { height, pixelRatio, width }
) {
  const { birds, look } = kernel;
  const headless = await createHeadlessRenderer({
    configure(renderer, THREE) {
      /* eslint-disable no-param-reassign */
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
  const flockRef = { current: null };
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

  return {
    // Mounts a generation, aims the camera at its hero view (the camera a
    // `gaze: camera` flock stares at) and animates its settle time; returns
    // the clock it settled at and the sphere the framing fits.
    async load(config, options) {
      flockRef.current = null;
      await stage.mount({ config, flockRef });
      const meshes = Math.max(1, Math.round(config.birdCount)) * 3;
      await until(
        () =>
          flockRef.current &&
          look.flockMeshes(flockRef.current).length >= meshes,
        'the flock to load',
        3000
      );
      await stage.flush();
      const bounds = boundsOf(kernel, config);
      look.aimCamera(
        stage.camera,
        birds.frameFlock({ bounds, config, options, view: 'hero' }),
        width / height
      );
      clock = 0;
      const frames = Math.max(1, Math.round(config.settle * FPS));
      const { scene } = stage;
      scene.visible = false;
      step(0);
      for (let f = 1; f <= frames; f += 1) {
        step(f / FPS);
        if (f % 30 === 0) await new Promise(setImmediate);
      }
      scene.visible = true;
      return { bounds, start: clock };
    },

    // A still at the current clock, or the clip's next frame at `seconds`.
    async capture(view, seconds = clock) {
      look.aimCamera(stage.camera, view, width / height);
      return frame(seconds);
    },

    async svg(view, options) {
      look.aimCamera(stage.camera, view, width / height);
      const flock = flockRef.current;
      const depth = birds.needsDepth(options)
        ? await captureDepth(
            stage.scene,
            stage.camera,
            width * pixelRatio,
            height * pixelRatio,
            flock
          )
        : null;
      const image = birds.needsImage(options) ? await frame(clock) : null;
      return birds.renderFlockSvg({
        ...birds.plotArgs(options),
        camera: view,
        coverage: depth,
        flock: look.readFlockMesh(flock),
        image,
        visible: options.svgOcclusion
          ? look.depthProbe(depth, pixelRatio, 0.01)
          : null,
      });
    },

    get clock() {
      return clock;
    },

    get flock() {
      return flockRef.current;
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
      createFlockCapturer(kernel, {
        height: options.height,
        pixelRatio: options.pixelRatio,
        width: options.width,
      }),
    work
  );
