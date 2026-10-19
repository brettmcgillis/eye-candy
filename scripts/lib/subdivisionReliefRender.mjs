/* eslint-disable import/no-extraneous-dependencies */
import {
  RENDER_OPTIONS,
  SCENE_KEYS,
  SOURCE_IMAGE_MAX,
  canonicalArgv,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/subdivisionRelief/renderOptions.mjs';
import {
  createParseCli,
  keepList,
  loadKernelModules,
  pinnedFrom,
  sidecarFor,
  withRenderer,
} from './generatorCli.mjs';
import { createHeadlessRenderer } from './headlessWebgpu.mjs';
import { loadImage } from './sourceImage.mjs';

// Barrels only — see docs/subdivision-relief-pipeline.md.
const ENTRIES = {
  lights: '/src/modules/lightingRig/index.js',
  look: '/src/modules/subdivisionReliefRender/index.js',
  relief: '/src/modules/subdivisionRelief/index.js',
  subdivision: '/src/modules/subdivision/index.js',
};

export const loadKernel = () => loadKernelModules(ENTRIES);

export const parseCli = createParseCli({
  RENDER_OPTIONS,
  canonicalArgv,
  defaultsFor,
  normalizeOptions,
});

export function assertPalette({ look }, { options, typed }) {
  const names = [look.PALETTE_NONE, ...look.PALETTE_NAMES];
  if (typed.has('palette') && !names.includes(options.palette)) {
    throw new Error(
      `unknown palette "${options.palette}". ${look.PALETTE_NAMES.length} names are available in src/utils/gradients.json, plus "${look.PALETTE_NONE}".`
    );
  }
}

export function rollArgs({ look, relief }, { options, typed }) {
  return {
    base: options.base ? relief.configFrom(options.base) : {},
    keep: keepList(options),
    paletteNames: look.PALETTE_NAMES,
    pinned: relief.sceneNamed(pinnedFrom({ options, typed }, SCENE_KEYS)),
    seeds: {
      field: options.fieldSeed ?? undefined,
      palette: options.paletteSeed ?? undefined,
      relief: options.reliefSeed ?? undefined,
      structure: options.structureSeed ?? undefined,
    },
  };
}

// What a batch draws at `index`: a seeded batch names its pieces seed,
// seed-1…; without one every piece gets a random seed.
export async function pieceAt(kernel, { index, options, roll }) {
  const { look, relief, subdivision } = kernel;
  const seed =
    options.batch == null
      ? subdivision.randomSeed()
      : subdivision.seedFor(options.batch, index);
  const config = relief.rollReliefConfig(seed, roll);
  const image =
    config.field === 'image'
      ? await loadImage(config.sourceImage, SOURCE_IMAGE_MAX)
      : null;
  const stops =
    config.palette === look.PALETTE_NONE
      ? null
      : look.getPaletteStops(config.palette);
  const piece = relief.buildReliefPiece(config, {
    canvas: { height: options.height, width: options.width },
    image,
    stops,
  });
  return { config, name: seed, piece };
}

export function plotSvg({ relief, subdivision }, { config, piece }, options) {
  return subdivision.renderPlotSvg(
    piece,
    { ...relief.pieceSettings(config), ...relief.plotOptionsFrom(options) },
    { widthMm: options.plotWidthMm }
  );
}

export function sidecarOf({ config, name, piece }, options) {
  return {
    ...sidecarFor({ config, name, options }),
    stats: {
      leaves: piece.nodes.filter((node) => node.leaf).length,
      levels: piece.maxDepth + 1,
      nodes: piece.nodes.length,
      palette: piece.palette,
    },
  };
}

// One renderer per output size, reused across pieces and frames: device and
// pipeline setup dominate a capture, and the rig's materials compile once.
export async function createReliefCapturer(
  kernel,
  { height, samples = 4, width }
) {
  const { THREE, TSL, lights, look, relief } = kernel;

  const headless = await createHeadlessRenderer({
    configure(renderer) {
      // eslint-disable-next-line no-param-reassign
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
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
  const lightGroup = lights.createSceneLights(
    lights.buildSceneLightingRuntimeConfig({
      controls: {},
      lighting: look.SUBDIVISION_RELIEF_LIGHTING,
    }),
    { shadows: true }
  );
  const passOptions = samples > 0 ? { samples } : {};
  const pipelines = {};
  scene.add(rig.group, lightGroup);

  function pipelineFor(projection) {
    if (!pipelines[projection]) {
      const pipeline = new THREE.RenderPipeline(renderer);
      pipeline.outputNode = TSL.pass(scene, cameras[projection], passOptions);
      pipelines[projection] = pipeline;
    }
    return pipelines[projection];
  }

  // The scene's shadow box is sized for its default panel; a larger canvas
  // would fall outside it.
  function fitShadows(canvas) {
    const reach =
      (Math.hypot(canvas.width, canvas.height) / 2) *
        relief.WORLD_SCALE *
        relief.PLATE_MARGIN +
      1;
    lightGroup.traverse((light) => {
      if (!light.isDirectionalLight || !light.castShadow) return;
      const { camera } = light.shadow;
      const extent = Math.max(camera.right, reach);
      Object.assign(camera, {
        bottom: -extent,
        far: Math.max(camera.far, light.position.length() + reach * 2),
        left: -extent,
        right: extent,
        top: extent,
      });
      camera.updateProjectionMatrix();
    });
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

  return {
    rig,

    load({ config, piece }) {
      rig.apply(config);
      rig.setPiece(piece);
      fitShadows(piece.canvas);
      scene.background = new THREE.Color(config.bgColor);
    },

    // `grow` in levels (default: fully split); `motion` as motionAt gives it.
    async capture(view, { grow, motion }) {
      aim(view);
      rig.setGrow(grow);
      rig.setMotion(motion);
      return headless.readFrame(() => pipelineFor(view.projection).render());
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
