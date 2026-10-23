import { pass, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  SCENE_KEYS,
  buildStructure,
  configFrom,
  frameView,
  groundAt,
  renderBrutalistSvg,
  rollBrutalistConfig,
  scatterTrees,
  seedFor,
} from '@modules/brutalist';
import {
  buildSceneLightingRuntimeConfig,
  createSceneLights,
} from '@modules/lightingRig';
import { buildScenePostRuntimeConfig, createPostChain } from '@modules/postRig';
import { setBackdrop } from '@modules/renderStage/capture';

import { FOREST_LIGHTING, MAQUETTE_LIGHTING } from './lighting';
import BRUTALIST_POST from './post';
import createBrutalistRig from './rig';

export function rollArgs({ options, typed }) {
  const scene = new Set(SCENE_KEYS);
  return {
    base: options.base ? configFrom(options.base) : {},
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
export function structureAt({ batch, index, roll }) {
  const name = seedFor(batch, index);
  const config = rollBrutalistConfig(name, roll);
  const structure = buildStructure(config);
  return { config, name, site: scatterTrees(config, structure), structure };
}

// A view of a loaded structure; `transform` is the rig's fit of it to the
// stage (what `load` returns).
export function frameStructure({
  drawn,
  options,
  stage,
  transform,
  view,
  ...extra
}) {
  const { config, site, structure } = drawn;
  return frameView({
    groundAt: (x, z) => groundAt(x, z, config, site?.foot ?? 0),
    options,
    stage,
    standoff: (site?.foot ?? 0) + config.clearing,
    structure,
    transform,
    view,
    ...extra,
  });
}

// The maquette or forest stage the CLI renders headlessly and the Live tab
// renders on a canvas, mirroring R3F's defaults: ACES tone mapping and soft
// shadows. `Tree` is ez-tree's class, passed in because it must be imported
// under a stubbed document in Node.
export function createBrutalistStage({
  Tree,
  height,
  pixelRatio = 1,
  readFrame,
  renderer,
  samples = 4,
  shadows = true,
  stage,
  transparent = false,
  width,
}) {
  /* eslint-disable no-param-reassign */
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  /* eslint-enable no-param-reassign */
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, width / height, 0.5, 12000);
  const rig = createBrutalistRig({ Tree, stage });
  const lighting = stage === 'forest' ? FOREST_LIGHTING : MAQUETTE_LIGHTING;
  const passOptions = samples > 0 ? { samples } : {};
  const pipelines = {};
  let depthPipeline = null;
  let current = null;
  let lightGroup = null;

  scene.add(rig.group);
  rig.attach(scene);
  rig.setShadows(shadows);

  function pipeline() {
    const slots = buildScenePostRuntimeConfig(
      BRUTALIST_POST,
      current.config
    ).slots.filter((slot) => slot.enabled);
    const key = slots.map((slot) => slot.id).join('|');
    if (!pipelines[key]) {
      const chain =
        slots.length > 0
          ? createPostChain({ camera, passOptions, renderer, scene, slots })
          : null;
      let next = chain?.pipeline;
      if (!next) {
        next = new THREE.RenderPipeline(renderer);
        next.outputNode = pass(scene, camera, passOptions);
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
    const unit = pass(scene, camera)
      .getLinearDepthNode()
      .clamp(0, 1)
      .mul(65535);
    const high = unit.div(256).floor();
    depthPipeline = new THREE.RenderPipeline(renderer);
    depthPipeline.outputColorTransform = false;
    depthPipeline.outputNode = vec4(
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

  return {
    // Returns the rig's fit of the structure, which views are framed on.
    load(drawn) {
      current = drawn;
      const { config, site, structure } = drawn;
      rig.apply(config);
      rig.setStructure(structure, config);
      rig.setSite(site, config);
      rig.setPhase(0);
      // eslint-disable-next-line no-param-reassign
      renderer.toneMappingExposure = stage === 'forest' ? config.exposure : 1;
      // Transparent drops the sky and studio walls; floors keep their
      // shadows. The forest's fog stays: it is what lights the trees.
      setBackdrop({ renderer, scene }, config.studioBackground, transparent);
      if (stage === 'forest' && !transparent) scene.background = null;
      lightGroup?.removeFromParent();
      lightGroup = createSceneLights(
        buildSceneLightingRuntimeConfig({ controls: config, lighting }),
        { shadows }
      );
      scene.add(lightGroup);
      return { transform: rig.transform };
    },

    frame(options, view, extra = {}) {
      return frameStructure({
        drawn: current,
        options,
        stage,
        transform: rig.transform,
        view,
        ...extra,
      });
    },

    capture(view, phase = 0) {
      aim(view);
      rig.setPhase(phase);
      return readFrame(() => pipeline().render());
    },

    async captureDepth(view) {
      aim(view);
      const frame = await readFrame(() => depthPass().render());
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
      return renderBrutalistSvg({
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
      Object.values(pipelines).forEach((entry) => entry.pipeline.dispose?.());
      depthPipeline?.dispose();
    },
  };
}
