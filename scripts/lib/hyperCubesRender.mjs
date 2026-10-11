/* eslint-disable import/no-extraneous-dependencies */
import {
  RENDER_OPTIONS,
  SCENE_KEYS,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/hyperCubes/renderOptions.mjs';
import {
  createParseCli,
  loadKernelModules,
  withRenderer,
} from './generatorCli.mjs';
import { createHeadlessRenderer } from './headlessWebgpu.mjs';

// Barrels only — see docs/hyper-cubes-pipeline.md.
const ENTRIES = {
  cubes: '/src/modules/hyperCubes/index.js',
  lights: '/src/modules/lightingRig/index.js',
  look: '/src/modules/hyperCubesRender/index.js',
  post: '/src/modules/postRig/index.js',
};

export const loadKernel = () => loadKernelModules(ENTRIES);

export const parseCli = createParseCli({
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
});

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

  async function render(pipeline) {
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

export const withCapturer = (kernel, options, work) =>
  withRenderer(
    options,
    () =>
      createCubeCapturer(kernel, {
        height: options.height * options.pixelRatio,
        pixelRatio: options.pixelRatio,
        samples: options.samples,
        shadows: options.shadows,
        width: options.width * options.pixelRatio,
      }),
    work
  );
