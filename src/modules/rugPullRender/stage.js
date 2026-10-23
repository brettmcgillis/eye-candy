import { pass } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { setBackdrop } from '@modules/renderStage/capture';
import {
  SCENE_KEYS,
  buildRug,
  clothLayout,
  configFrom,
  createRugCloth,
  flatView,
  floorView,
  renderRugSvg,
  rodHeightFor,
  rollRugConfig,
  seedFor,
  wallView,
} from '@modules/rugPull';

import createRugRig, { FLOOR_GAP, WALL_GAP } from './rig';

export const RUG_VIEWS = { flat: flatView, floor: floorView, wall: wallView };

export function rollArgs({ options, typed }) {
  const scene = new Set(SCENE_KEYS);
  return {
    base: options.base ? configFrom(options.base) : {},
    designPool: options.designPool,
    houseRate: options.houseRate,
    keep: String(options.keep ?? '')
      .split(',')
      .map((facet) => facet.trim())
      .filter(Boolean),
    palettePool: options.palettePool,
    pinned: Object.fromEntries(
      [...typed]
        .filter((key) => scene.has(key))
        .map((key) => [key, options[key]])
    ),
  };
}

export function rugAt({ batch, index, roll }) {
  const name = seedFor(batch, index);
  const config = rollRugConfig(name, roll);
  return { build: buildRug(config), config, name };
}

// Lays the rug out for a mode and lets the cloth settle, as the scene does
// before its first frame.
export function drape({ build, config }, mode, steps) {
  const layout = clothLayout(build, config);
  const rodHeight = rodHeightFor(build, config);
  const cloth = createRugCloth(layout, {
    ...config,
    floorGap: FLOOR_GAP,
    iterations: 12,
    mode: mode === 'flat' ? 'floor' : mode,
    rodHeight,
    rumple: mode === 'flat' ? 0 : config.rumple,
    cornerFlip: mode === 'flat' ? 0 : config.cornerFlip,
    seed: build.cols,
    wallGap: WALL_GAP,
    wind: 0,
  });
  if (mode !== 'flat') cloth.settle(steps);
  return { cloth, layout, rodHeight };
}

// The camera for a mode, fitted to the draped rug.
export const rugView = ({ build, config }, draped, mode, aspect) =>
  RUG_VIEWS[mode](build, { ...config, rodHeight: draped.rodHeight }, aspect);

// The rug stage the CLI renders headlessly and the Live tab renders on a
// canvas, mirroring the scene: ACES tone mapping and soft shadows.
export function createRugStage({
  height,
  readFrame,
  renderer,
  samples = 4,
  transparent = false,
  width,
}) {
  /* eslint-disable no-param-reassign */
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  /* eslint-enable no-param-reassign */
  const scene = new THREE.Scene();
  const cameras = {
    orthographic: new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100),
    perspective: new THREE.PerspectiveCamera(35, width / height, 0.05, 100),
  };
  const rig = createRugRig();
  scene.add(rig.group);
  setBackdrop({ renderer, scene }, '#141110', transparent);
  const pipelines = {};
  let current = null;

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

  // Lays the draped cloth into the rig for `mode`.
  function show(draped, { config, mode }) {
    rig.setLayout(draped.layout, {
      clipCount: config.clipCount,
      hangStyle: config.hangStyle,
      mode: mode === 'flat' ? 'floor' : mode,
      rodHeight: draped.rodHeight,
    });
    rig.updateCloth(draped.cloth.positions);
  }

  return {
    rig,

    load(woven) {
      current = woven;
      rig.apply(woven.config);
      rig.setBuild(woven.build);
    },

    show,

    // `draped` lays a cloth in first; without it the last one shown stays.
    capture(view, draped = null, shown = null) {
      if (draped) show(draped, shown);
      aim(view);
      return readFrame(() => pipelineFor(view.projection).render());
    },

    // The plot is the rug's cartoon, whatever the camera.
    svg(view, options) {
      return renderRugSvg(current.build, { scale: options.cartoonScale });
    },

    dispose() {
      rig.dispose();
      Object.values(pipelines).forEach((pipeline) => pipeline.dispose());
    },
  };
}
