import { pass } from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  buildSceneLightingRuntimeConfig,
  createSceneLights,
} from '@modules/lightingRig';
import { setBackdrop } from '@modules/renderStage/capture';
import createMeshPlotter from '@modules/renderStage/meshPlotter';
import {
  SCENE_KEYS,
  buildField,
  buildForm,
  configFrom,
  formBounds,
  rollTubeConfig,
  seedFor,
} from '@modules/trucheterie3d';
import { PALETTE_NAMES } from '@modules/trucheterieBlobRender';

import TRUCHETERIE3D_LIGHTING from './lighting';
import createTubeRig from './rig';

// `resolvePinned` turns a pinned saved-design name into its code (the CLI
// reads the file; the page resolves it before rolling).
export function rollArgs({
  options,
  resolvePinned = (pinned) => pinned,
  typed,
}) {
  const scene = new Set(SCENE_KEYS);
  return {
    base: options.base ? configFrom(options.base) : {},
    keep: String(options.keep ?? '')
      .split(',')
      .map((facet) => facet.trim())
      .filter(Boolean),
    paletteNames: PALETTE_NAMES.filter((name) => name !== 'None'),
    pinned: resolvePinned(
      Object.fromEntries(
        [...typed]
          .filter((key) => scene.has(key))
          .map((key) => [key, options[key]])
      )
    ),
  };
}

// What a batch draws at `index`: seeds follow seed, seed-1, seed-2….
export function fieldAt({ baseSeed, index, roll }) {
  const name = seedFor(baseSeed, index);
  const config = rollTubeConfig(name, roll);
  const field = buildField(config);
  return { config, field, name, ...buildForm(field, config) };
}

// Long enough for the default pressure response and damping to come to rest.
const SETTLE_SECONDS = 6;

// The tube stage the CLI renders headlessly and the Live tab renders on a
// canvas, mirroring the scene: ACES through a RenderPipeline (only its
// output node applies the tone curve and sRGB encode), soft shadows, the
// rig's studio environment. `advance` starts a fresh animation frame where
// the caller drives frames by hand (the headless renderer).
export function createTubeStage({
  advance = null,
  height,
  readFrame,
  renderer,
  samples = 4,
  shadows = true,
  transparent = false,
  width,
}) {
  /* eslint-disable no-param-reassign */
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  /* eslint-enable no-param-reassign */
  const scene = new THREE.Scene();
  const cameras = {
    orthographic: new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100),
    perspective: new THREE.PerspectiveCamera(30, width / height, 0.1, 100),
  };
  const pipelines = {};
  const rig = createTubeRig();
  const meshPlot = createMeshPlotter(renderer, { advance });
  let current = null;
  let lightGroup = null;
  scene.add(rig.group);
  rig.setShadows(shadows);

  function pipelineFor(projection) {
    if (!pipelines[projection]) {
      const pipeline = new THREE.RenderPipeline(renderer);
      pipeline.outputNode = pass(
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
      setBackdrop({ renderer, scene }, config.sceneBgColor, transparent);
      lightGroup?.removeFromParent();
      lightGroup = createSceneLights(
        buildSceneLightingRuntimeConfig({
          controls: config,
          lighting: TRUCHETERIE3D_LIGHTING,
        }),
        { shadows }
      );
      scene.add(lightGroup);
      return formBounds(drawn, config);
    },

    stepMembrane: (seconds, target) =>
      rig.stepMembrane(renderer, seconds, current.config, target),

    setGrowth: (value) => rig.setGrowth(value),
    setPalettePhase: (phase) => rig.setPalettePhase(current.config, phase),

    capture(view) {
      aim(view);
      return readFrame(() => pipelineFor(view.projection).render());
    },

    // The tubes as hidden-line line work in their lane colours: outlines
    // and ends from the swept mesh, plus each lane's centre stroke.
    svg(view, options) {
      aim(view);
      const { lines, meshes } = rig.plotParts(view.eye);
      return meshPlot({
        camera: cameras[view.projection],
        lines,
        options,
        scene,
        subject: meshes,
        view,
      });
    },

    dispose() {
      Object.values(pipelines).forEach((pipeline) => pipeline.dispose());
      rig.dispose();
    },
  };
}
