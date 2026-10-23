import { pass, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  SCENE_KEYS,
  buildInstances,
  buildTree,
  configFrom,
  domainBounds,
  renderHyperCubesSvg,
  rollHyperCubesConfig,
  seedFor,
} from '@modules/hyperCubes';
import {
  buildSceneLightingRuntimeConfig,
  createSceneLights,
} from '@modules/lightingRig';
import { buildScenePostRuntimeConfig, createPostChain } from '@modules/postRig';
import { setBackdrop } from '@modules/renderStage/capture';
import { PALETTE_NAMES, getPaletteStops } from '@utils/gradientPalette';

import HYPER_CUBES_LIGHTING from './lighting';
import HYPER_CUBES_POST from './post';
import createCubeRig from './rig';

export function rollArgs({ options, typed }) {
  const scene = new Set(SCENE_KEYS);
  return {
    base: options.base ? configFrom(options.base) : {},
    keep: String(options.keep ?? '')
      .split(',')
      .map((facet) => facet.trim())
      .filter(Boolean),
    palettes:
      options.palettes ??
      PALETTE_NAMES.filter((name) => (getPaletteStops(name)?.length ?? 0) >= 2),
    pinned: Object.fromEntries(
      [...typed]
        .filter((key) => scene.has(key))
        .map((key) => [key, options[key]])
    ),
  };
}

// What a batch draws at `index`: names follow batch, batch-1, batch-2….
export function structureAt({ batch, index, roll }) {
  const name = seedFor(batch, index);
  const config = rollHyperCubesConfig(name, roll);
  return {
    config,
    name,
    stops: getPaletteStops(config.paletteName),
    tree: buildTree(config),
  };
}

// The structure stage the CLI renders headlessly and the Live tab renders on
// a canvas, mirroring the scene: soft shadows and flat tone mapping.
export function createCubeStage({
  height,
  pixelRatio = 1,
  readFrame,
  renderer,
  samples = 4,
  shadows = true,
  transparent = false,
  width,
}) {
  /* eslint-disable no-param-reassign */
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  /* eslint-enable no-param-reassign */
  const scene = new THREE.Scene();
  const cameras = {
    orthographic: new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100),
    perspective: new THREE.PerspectiveCamera(35, width / height, 0.1, 100),
  };
  const rig = createCubeRig();
  const passOptions = samples > 0 ? { samples } : {};
  const pipelines = {};
  const depthPipelines = {};
  let camera = cameras.orthographic;
  let current = null;
  let lightGroup = null;

  scene.add(rig.group);
  rig.setShadows(shadows);

  function pipelineFor(projection) {
    const slots = buildScenePostRuntimeConfig(
      HYPER_CUBES_POST,
      current.config
    ).slots.filter((slot) => slot.enabled);
    const key = [projection, ...slots.map((slot) => slot.id)].join('|');
    if (!pipelines[key]) {
      const chain =
        slots.length > 0
          ? createPostChain({
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
        pipeline.outputNode = pass(scene, cameras[projection], passOptions);
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
    const scenePass = pass(scene, cameras[projection]);
    const linear =
      projection === 'orthographic'
        ? scenePass.getTextureNode('depth').r
        : scenePass.getLinearDepthNode();
    const unit = linear.clamp(0, 1).mul(65535);
    const high = unit.div(256).floor();
    const pipeline = new THREE.RenderPipeline(renderer);
    pipeline.outputColorTransform = false;
    pipeline.outputNode = vec4(
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

  const settled = () =>
    buildInstances({
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
      setBackdrop({ renderer, scene }, config.background, transparent);
      lightGroup?.removeFromParent();
      lightGroup = createSceneLights(
        buildSceneLightingRuntimeConfig({
          controls: config,
          lighting: HYPER_CUBES_LIGHTING,
        }),
        { shadows }
      );
      scene.add(lightGroup);
      return domainBounds(config);
    },

    // `instances` defaults to the loaded structure, settled.
    capture(view, instances = null) {
      aim(view);
      rig.setInstances(instances ?? settled());
      return readFrame(() => pipelineFor(view.projection).render());
    },

    async captureDepth(view) {
      aim(view);
      rig.setInstances(settled());
      const frame = await readFrame(() => depthPass(view.projection).render());
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
      return renderHyperCubesSvg({
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
      Object.values(pipelines).forEach(({ pipeline }) => pipeline.dispose?.());
      Object.values(depthPipelines).forEach((pipeline) => pipeline.dispose?.());
    },
  };
}
