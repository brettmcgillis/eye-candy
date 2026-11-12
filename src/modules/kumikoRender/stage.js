import { pass } from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  SCENE_KEYS,
  buildLeaves,
  buildPanel,
  configFrom,
  randomSeed,
  renderKumikoSvg,
  rollKumikoConfig,
  sceneNameFor,
  seedFor,
} from '@modules/kumiko';
import {
  buildSceneLightingRuntimeConfig,
  createSceneLights,
} from '@modules/lightingRig';
import { setBackdrop } from '@modules/renderStage/capture';

import KUMIKO_LIGHTING from './lighting';
import paletteStops, { PALETTE_NAMES } from './palette';
import createPanelRig from './rig';

const DEG = Math.PI / 180;

// Azimuth and elevation, in degrees, of each 3D view; `flat` is the 2D art.
export const VIEW_ANGLES = {
  angle: [-24, 12],
  front: [0, 0],
  flat: [0, 0],
  raking: [-58, 6],
};

// The roll a batch (or the Live tab) draws from: the typed scene keys held,
// the rest rolled.
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
      PALETTE_NAMES.filter((name) => paletteStops(name).length >= 3),
    pinned: Object.fromEntries(
      [...typed]
        .filter((key) => scene.has(key))
        .map((key) => [sceneNameFor(key), options[key]])
    ),
  };
}

// What a batch draws at `index`: seeds follow seed, seed-1, seed-2….
// `loadImage(source)` decodes a source image to RGBA (sharp in the CLI, a
// canvas in the page).
export async function panelAt({ index, loadImage, options, roll }) {
  const baseSeed = options.batch ?? randomSeed();
  const seed = options.batch == null ? baseSeed : seedFor(baseSeed, index);
  const config = rollKumikoConfig(seed, roll);
  const image = await loadImage(config.sourceImage);
  return {
    config,
    image,
    panel: buildPanel(config, { image }),
    seed: String(seed),
    stops: paletteStops(config.palette),
  };
}

// The panel as SVG art: `fill` sized to the output frame (the flat view's
// raster), `plot` / `pieces` in mm for the plotter.
export function panelSvg({ config, options, panel, stops }, style) {
  return renderKumikoSvg({
    config,
    frame:
      style === 'fill'
        ? {
            height: options.height * options.pixelRatio,
            margin: options.margin,
            width: options.width * options.pixelRatio,
          }
        : null,
    panel,
    stops,
    stroke: options.svgStroke,
    style,
    transparent: options.transparent,
  });
}

export function frameView({ bounds, options, view }) {
  const [azimuth, elevation] = VIEW_ANGLES[view];
  const az = azimuth * DEG;
  const el = elevation * DEG;
  const dir = [
    Math.sin(az) * Math.cos(el),
    Math.sin(el),
    Math.cos(az) * Math.cos(el),
  ];
  const fov = 24;
  const half = (fov * DEG) / 2;
  const horizontal = Math.atan(
    Math.tan(half) * (options.width / options.height)
  );
  const [w, h] = bounds.size;
  const distance =
    Math.max(h / 2 / Math.tan(half), w / 2 / Math.tan(horizontal)) *
    (1 + options.margin * 2);
  return {
    eye: bounds.center.map((v, a) => v + dir[a] * distance),
    fov,
    target: bounds.center,
  };
}

// The 3D panel stage the CLI renders headlessly and the Live tab renders on
// a canvas: the scene's rig, lights and tone mapping. `readFrame(draw)`
// draws a frame and returns what the caller reads back.
export function createKumikoStage({
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
  const camera = new THREE.PerspectiveCamera(30, width / height, 0.05, 400);
  const pipeline = new THREE.RenderPipeline(renderer);
  pipeline.outputNode = pass(scene, camera, samples > 0 ? { samples } : {});
  const rig = createPanelRig();
  scene.add(rig.group);
  scene.add(
    createSceneLights(
      buildSceneLightingRuntimeConfig({
        controls: {},
        lighting: KUMIKO_LIGHTING,
      }),
      { shadows }
    )
  );

  let current = null;

  return {
    load(drawn) {
      const { config, image } = drawn;
      current = drawn;
      setBackdrop({ renderer, scene }, config.backgroundColor, transparent);
      return rig.setPanel(buildLeaves(config, { image }), config, {
        immediate: true,
      });
    },
    capture({ eye, fov, target, up = [0, 1, 0] }) {
      camera.fov = fov;
      camera.up.set(...up);
      camera.position.set(...eye);
      camera.lookAt(...target);
      camera.updateProjectionMatrix();
      return readFrame(() => pipeline.render());
    },
    // The plot is the panel's own art, whatever the camera.
    svg(view, options) {
      return panelSvg({ ...current, options }, options.svgStyle);
    },
    dispose() {
      rig.dispose();
      pipeline.dispose();
    },
  };
}
