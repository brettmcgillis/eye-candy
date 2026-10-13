/* eslint-disable import/no-extraneous-dependencies */
import {
  RENDER_OPTIONS,
  SCENE_KEYS,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/trucheterie3d/renderOptions.mjs';
import {
  createParseCli,
  loadKernelModules,
  withRenderer,
} from './generatorCli.mjs';
import { createHeadlessRenderer } from './headlessWebgpu.mjs';
import { withResolvedDesign } from './trucheterieDesigns.mjs';

// Barrels only — see docs/trucheterie3d-pipeline.md.
const ENTRIES = {
  blob: '/src/modules/trucheterieBlob/index.js',
  lights: '/src/modules/lightingRig/index.js',
  look: '/src/modules/trucheterie3dRender/index.js',
  tubes: '/src/modules/trucheterie3d/index.js',
};

export const loadKernel = () => loadKernelModules(ENTRIES);

export const parseCli = createParseCli({
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
});

export function assertPalette(kernel, { options, typed }) {
  const names = kernel.look.PALETTE_NAMES;
  if (typed.has('blobPalette') && !names.includes(options.blobPalette)) {
    throw new Error(
      `unknown palette "${options.blobPalette}". ${names.length} names are available in src/utils/gradients.json, plus "None".`
    );
  }
}

export function rollArgs(kernel, { options, typed }) {
  const scene = new Set(SCENE_KEYS);
  return {
    base: options.base ? kernel.tubes.configFrom(options.base) : {},
    keep: String(options.keep ?? '')
      .split(',')
      .map((facet) => facet.trim())
      .filter(Boolean),
    paletteNames: kernel.look.PALETTE_NAMES.filter((name) => name !== 'None'),
    pinned: withResolvedDesign(
      kernel.blob,
      Object.fromEntries(
        [...typed]
          .filter((key) => scene.has(key))
          .map((key) => [key, options[key]])
      )
    ),
  };
}

// What a batch draws at `index`: seeds follow seed, seed-1, seed-2….
export function fieldAt(kernel, { baseSeed, index, roll }) {
  const { tubes } = kernel;
  const name = tubes.seedFor(baseSeed, index);
  const config = tubes.rollTubeConfig(name, roll);
  const field = tubes.buildField(config);
  return { config, field, name, ...tubes.buildForm(field, config) };
}

export function sidecarFor({ config, membrane, name, options, tubes: built }) {
  return {
    name,
    preset: config,
    render: { ...options, base: undefined },
    stats: membrane
      ? { ...built.stats, membrane: membrane.stats }
      : built.stats,
  };
}

// Long enough for the default pressure response and damping to come to rest.
const SETTLE_SECONDS = 6;

// One renderer per output size, reused across fields and frames. Mirrors the
// scene: ACES through a RenderPipeline (only its output node applies the
// tone curve and sRGB encode), soft shadows, the rig's studio environment.
export async function createTubeCapturer(
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
  const { renderer } = headless;
  const scene = new THREE.Scene();
  const cameras = {
    orthographic: new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100),
    perspective: new THREE.PerspectiveCamera(30, width / height, 0.1, 100),
  };
  const pipelines = {};
  const rig = look.createTubeRig();
  let current = null;
  let lightGroup = null;
  scene.add(rig.group);
  rig.setShadows(shadows);

  function pipelineFor(projection) {
    if (!pipelines[projection]) {
      const pipeline = new THREE.RenderPipeline(renderer);
      pipeline.outputNode = TSL.pass(
        scene,
        cameras[projection],
        samples > 0 ? { samples } : {}
      );
      pipelines[projection] = pipeline;
    }
    return pipelines[projection];
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

  async function render(pipeline) {
    return headless.readFrame(() => pipeline.render());
  }

  return {
    // Sets the stage for a field and returns the world bounds views frame. A
    // membrane is inflated to rest first unless `settle` is off, when it
    // stays flat for an inflate clip to drive.
    load(drawn, { settle = true } = {}) {
      current = drawn;
      const { config } = drawn;
      rig.setTubes(drawn);
      rig.setGrowth(2);
      if (settle && rig.hasMembrane) {
        const frames = Math.ceil(SETTLE_SECONDS / config.membraneMaxDelta);
        for (let f = 0; f < frames; f += 1) {
          rig.stepMembrane(
            renderer,
            config.membraneMaxDelta,
            config,
            config.membranePressure
          );
        }
      }
      rig.updateEnvironment(renderer, scene, config);
      scene.background = new THREE.Color(config.sceneBgColor);
      lightGroup?.removeFromParent();
      lightGroup = lights.createSceneLights(
        lights.buildSceneLightingRuntimeConfig({
          controls: config,
          lighting: look.TRUCHETERIE3D_LIGHTING,
        }),
        { shadows }
      );
      scene.add(lightGroup);
      return kernel.tubes.formBounds(drawn, config);
    },

    stepMembrane: (seconds, target) =>
      rig.stepMembrane(renderer, seconds, current.config, target),

    setGrowth: (value) => rig.setGrowth(value),
    setPalettePhase: (phase) => rig.setPalettePhase(current.config, phase),

    async capture(view) {
      aim(view);
      return render(pipelineFor(view.projection));
    },

    dispose() {
      Object.values(pipelines).forEach((pipeline) => pipeline.dispose());
      rig.dispose();
      headless.dispose();
    },
  };
}

export const withCapturer = (kernel, options, work) =>
  withRenderer(
    options,
    () =>
      createTubeCapturer(kernel, {
        height: options.height * options.pixelRatio,
        shadows: options.shadows,
        width: options.width * options.pixelRatio,
      }),
    work
  );
