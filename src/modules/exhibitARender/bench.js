import { pass } from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  FAMILY_KINDS,
  SCENE_KEYS,
  buildExhibit,
  configFrom,
  exhibitFootprint,
  resolveFamilies,
  rollExhibitConfig,
  seedFor,
} from '@modules/exhibitA';
import { buildScenePostRuntimeConfig, createPostChain } from '@modules/postRig';
import { setBackdrop } from '@modules/renderStage/capture';
import createMeshPlotter from '@modules/renderStage/meshPlotter';
import { PALETTE_NAMES, getPaletteStops } from '@utils/gradientPalette';

import EXHIBIT_A_POST from './post';
import createExhibitRig from './rig';

export function rollArgs({ options, typed }) {
  const scene = new Set(SCENE_KEYS);
  return {
    base: options.base ? configFrom(options.base) : {},
    families: resolveFamilies(options.families),
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
export function exhibitAt({ batch, index, roll }) {
  const name = seedFor(batch, index);
  const config = rollExhibitConfig(name, roll);
  return { config, name, stops: getPaletteStops(config.paletteName) };
}

// The exhibit bench stage the CLI renders headlessly and the Live tab
// renders on a canvas, mirroring the scene: soft shadows and flat tone
// mapping. `advance` starts a fresh animation frame where the caller drives
// frames by hand (the headless renderer).
export function createExhibitStage({
  advance = null,
  height,
  readFrame,
  renderer,
  samples = 4,
  transparent = false,
  width,
}) {
  /* eslint-disable no-param-reassign */
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  /* eslint-enable no-param-reassign */
  const scene = new THREE.Scene();
  const cameras = {
    orthographic: new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100),
    perspective: new THREE.PerspectiveCamera(30, width / height, 0.1, 100),
  };
  const rig = createExhibitRig();
  const meshPlot = createMeshPlotter(renderer, { advance });
  const passOptions = samples > 0 ? { samples } : {};
  const pipelines = {};
  let current = null;

  scene.add(rig.group);

  function pipelineFor(projection) {
    const slots = buildScenePostRuntimeConfig(
      EXHIBIT_A_POST,
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

  const render = (projection) =>
    readFrame(() => pipelineFor(projection).render());

  return {
    renderer,
    scene,

    // Builds the exhibit and sets the stage; returns the layout views are
    // framed on.
    load(drawn) {
      const build = buildExhibit(drawn.config);
      const footprint = exhibitFootprint(drawn.config, build);
      current = { ...drawn, build, footprint };
      rig.setExhibit(drawn.config, build, footprint);
      rig.updateEnvironment(renderer, scene, drawn.config);
      setBackdrop({ renderer, scene }, drawn.config.background, transparent);
      return rig.apply(drawn.config, { stops: drawn.stops });
    },

    // One frame. `config` overrides the loaded one (an evolve step), and a
    // mesh exhibit is rebuilt when it is given; `progress` and
    // `lightAzimuth` drive a draw and a light sweep.
    capture(view, { config = null, lightAzimuth, progress = 1 } = {}) {
      const shown = config ?? current.config;
      if (config && FAMILY_KINDS[config.family] !== 'field') {
        rig.setExhibit(config, buildExhibit(config), current.footprint);
      }
      rig.apply(shown, {
        lightAzimuth: lightAzimuth ?? shown.lightAzimuth,
        progress,
        stops: current.stops,
      });
      aim(view);
      return render(view.projection);
    },

    // The exhibit as hidden-line line work in its own colours; a
    // ray-marched field adds the render's brightness contours.
    async svg(view, options) {
      aim(view);
      const { field, subject } = rig.plotSubject();
      const image = field ? await render(view.projection) : null;
      return meshPlot({
        camera: cameras[view.projection],
        options,
        scene,
        subject,
        texture: field ? { image, levels: 6 } : null,
        view,
      });
    },

    dispose() {
      Object.values(pipelines).forEach(({ chain, pipeline }) => {
        chain?.dispose?.();
        pipeline.dispose?.();
      });
      rig.dispose();
    },
  };
}
