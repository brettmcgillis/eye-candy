/* eslint-disable import/no-extraneous-dependencies, no-await-in-loop */
import {
  RENDER_OPTIONS,
  SCENE_KEYS,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/dumpsterFire/renderOptions.mjs';
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

// Barrels only — see docs/dumpster-fire-pipeline.md.
const ENTRIES = {
  fire: '/src/modules/dumpsterFire/index.js',
  look: '/src/modules/dumpsterFireRender/index.js',
};

const FPS = 60;

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
    fire: loaded[ENTRIES.fire],
    look: loaded[ENTRIES.look],
  };
}

export const parseCli = createParseCli({
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
});

export function rollArgs(kernel, { options, typed }) {
  const { fire } = kernel;
  const generation = new Set([...SCENE_KEYS, ...fire.CONFIG_KEYS]);
  return {
    base: options.base ? fire.configFrom(options.base) : {},
    keep: String(options.keep ?? '')
      .split(',')
      .map((facet) => facet.trim())
      .filter(Boolean),
    pinned: Object.fromEntries(
      [...typed]
        .filter((key) => generation.has(key))
        .map((key) => [key, options[key]])
    ),
  };
}

// What a batch draws at `index`: names follow batch, batch-1, batch-2….
export function fireAt(kernel, { batch, index, roll }) {
  const { fire } = kernel;
  const name = fire.seedFor(batch, index);
  return { config: fire.rollDumpsterConfig(name, roll), name };
}

// The smoke paths and the points a camera fits, from the generation alone
// — known before the stage mounts.
export function sceneOf(kernel, config) {
  const { fire, look } = kernel;
  const smoke = look.applySmokeGeneration(look.authoredSmoke(), config);
  const paths = look.smokePaths(smoke);
  return {
    bounds: fire.subjectBounds({
      frame: config.viewFrame,
      smoke: look.smokePoints(paths),
      trash: fire.layoutTrash(config),
    }),
    paths,
  };
}

const meshCount = (root) => {
  let count = 0;
  root?.traverse((object) => {
    if (object.isMesh) count += 1;
  });
  return count;
};

// One renderer and one R3F root per output size: the real DumpsterStage
// mounted with no frame loop, burned at 60 fps for the settle, then
// captured.
export async function createFireCapturer(
  kernel,
  { height, pixelRatio, width }
) {
  const { fire, look } = kernel;
  const headless = await createHeadlessRenderer({
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
  const solidsRef = { current: null };
  const effectsRef = { current: null };
  const nativeRandom = Math.random;
  let clock = 0;
  let paths = [];
  let seed = '';
  let fogConfig = null;

  // eslint-disable-next-line no-underscore-dangle
  const { nodeFrame } = renderer._nodes;

  const step = (seconds) => {
    nodeFrame.deltaTime = seconds - clock;
    nodeFrame.time = seconds;
    clock = seconds;
    setClock(seconds);
    stage.step(seconds);
  };

  const aim = (view) => {
    look.aimCamera(stage.camera, view, width / height);
    if (fogConfig) {
      look.fitFog(
        stage.scene,
        fogConfig,
        Math.hypot(
          view.eye[0] - view.target[0],
          view.eye[1] - view.target[1],
          view.eye[2] - view.target[2]
        )
      );
    }
  };

  async function frame(seconds) {
    setClock(seconds);
    return headless.readFrame(() => {
      clock = seconds;
      stage.step(seconds);
    });
  }

  return {
    // Mounts a generation, waits for every model, burns its settle time and
    // returns the clock it settled at and the bounds the framing fits.
    async load(config, name = 'fire') {
      seed = name;
      fogConfig = null;
      Math.random = fire.burnRandom(name);
      solidsRef.current = null;
      effectsRef.current = null;
      await stage.mount({ config, effectsRef, solidsRef });
      let last = -1;
      let steady = 0;
      await until(
        () => {
          const count = meshCount(solidsRef.current);
          steady = count > 0 && count === last ? steady + 1 : 0;
          last = count;
          return steady >= 40;
        },
        'the dumpster, litter and wall to load',
        6000
      );
      await stage.flush();
      const scene = sceneOf(kernel, config);
      paths = scene.paths;
      clock = 0;
      const frames = Math.max(1, Math.round(config.settle * FPS));
      stage.scene.visible = false;
      step(0);
      for (let f = 1; f <= frames; f += 1) {
        step(f / FPS);
        if (f % 30 === 0) await new Promise(setImmediate);
      }
      stage.scene.visible = true;
      const burning = look.measureSmoke(effectsRef.current);
      paths = look.trimPaths(paths, burning);
      const bounds = fire.subjectBounds({
        frame: config.viewFrame,
        smoke: burning,
        trash: fire.layoutTrash(config),
      });
      fogConfig = config;
      return { bounds, start: clock };
    },

    async capture(view, seconds = clock) {
      aim(view);
      return frame(seconds);
    },

    async svg(view, options) {
      aim(view);
      const solids = solidsRef.current;
      const effects = effectsRef.current;
      const sidewalk = options.svgSidewalk;
      const depth = fire.needsDepth(options)
        ? await captureDepth(
            stage.scene,
            stage.camera,
            width * pixelRatio,
            height * pixelRatio,
            look.solidMeshes(solids, { sidewalk })
          )
        : null;
      const image = fire.needsImage(options) ? await frame(clock) : null;
      let contrast = null;
      if (fire.needsSmokeContrast(options)) {
        const withSmoke = image ?? (await frame(clock));
        look.showSmoke(effects, false);
        const without = await frame(clock);
        look.showSmoke(effects, true);
        contrast = fire.smokeContrast(withSmoke, without);
      }
      const args = fire.plotArgs(options);
      return fire.renderDumpsterSvg({
        ...args,
        camera: view,
        coverage: depth,
        image,
        scene: {
          flames: look.readFlames(effects),
          solids: look.readSolids(solids, { sidewalk }),
        },
        smoke: {
          density: options.svgSmokeDots,
          dots: options.svgSmokeDots > 0 ? look.readSmokeDots(effects) : [],
          flow:
            options.svgSmokeFlow > 0
              ? fire.flowLines(paths, {
                  count: options.svgSmokeFlow,
                  seed,
                  twist: options.svgSmokeTwist,
                })
              : [],
          pen: args.shade?.pen,
          seed,
        },
        smokeShade: args.smokeShade && { ...args.smokeShade, contrast },
        visible: options.svgOcclusion
          ? look.depthProbe(depth, pixelRatio, 0.02)
          : null,
      });
    },

    get clock() {
      return clock;
    },

    // The mounted stage's groups, for checks that render parts of it.
    get parts() {
      return {
        effects: effectsRef.current,
        frame,
        solids: solidsRef.current,
      };
    },

    dispose() {
      Math.random = nativeRandom;
      stage.unmount();
      headless.dispose();
    },
  };
}

export const withCapturer = (kernel, options, work) =>
  withRenderer(
    options,
    () =>
      createFireCapturer(kernel, {
        height: options.height,
        pixelRatio: options.pixelRatio,
        width: options.width,
      }),
    work
  );
