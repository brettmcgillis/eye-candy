import { pass } from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  SCENE_KEYS,
  configFrom,
  resolveVariants,
  rollImperfectionConfig,
  seedFor,
} from '@modules/imperfection';
import { PALETTE_NAMES, getPaletteStops } from '@utils/gradientPalette';

import renderPaintingSvg, { plotArgs } from './plot';
import createPaintRig from './rig';

const SOURCE_MAX = 1024;

// The painting edge to edge, the camera every still is drawn through.
export const paintingView = (name = 'painting') => ({
  eye: [0, 0, 1],
  far: 10,
  halfHeight: 1,
  halfWidth: 1,
  name,
  near: 0.1,
  projection: 'orthographic',
  target: [0, 0, 0],
  up: [0, 1, 0],
});

export function rollArgs({ options, typed }) {
  const pinnable = new Set(SCENE_KEYS);
  return {
    base: options.base ? configFrom(options.base) : {},
    keep: String(options.keep ?? '')
      .split(',')
      .map((facet) => facet.trim())
      .filter(Boolean),
    palettes:
      options.palettes ??
      PALETTE_NAMES.filter((name) => (getPaletteStops(name)?.length ?? 0) >= 3),
    pinned: Object.fromEntries(
      [...typed]
        .filter((key) => pinnable.has(key))
        .map((key) => [key, options[key]])
    ),
    variants: resolveVariants(options.variants),
  };
}

// What a batch draws at `index`: names follow batch, batch-1, batch-2….
export function paintingAt({ batch, index, options, roll }) {
  const name = seedFor(batch, index);
  const config = { ...options, ...rollImperfectionConfig(name, roll) };
  return { config, name };
}

// The painting stage the CLI renders headlessly and the Live tab renders on
// a canvas. `loadImage(source, max)` decodes an image field's source (sharp
// in the CLI, a canvas in the page). A CLI frame passes its clip time; Live
// runs the paint on its own clock.
export function createPaintStage({ loadImage, readFrame, renderer }) {
  // eslint-disable-next-line no-param-reassign
  renderer.toneMapping = THREE.NoToneMapping;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  const rig = createPaintRig();
  scene.add(rig.mesh);
  const pipeline = new THREE.RenderPipeline(renderer);
  pipeline.outputNode = pass(scene, camera);
  let current = null;
  let sourceKey = null;
  let elapsed = 0;

  function aim(view) {
    Object.assign(camera, {
      bottom: -view.halfHeight,
      far: view.far,
      left: -view.halfWidth,
      near: view.near,
      right: view.halfWidth,
      top: view.halfHeight,
    });
    camera.up.set(...view.up);
    camera.position.set(...view.eye);
    camera.lookAt(...view.target);
    camera.updateProjectionMatrix();
  }

  const stage = {
    async load({ config }) {
      current = config;
      const key = config.fieldSource === 'image' ? config.sourceImage : '';
      if (key !== sourceKey) {
        sourceKey = key;
        rig.setSource(key ? await loadImage(key, SOURCE_MAX) : null);
      }
    },

    step(delta) {
      elapsed += delta;
    },

    capture(view = paintingView(), { time = elapsed } = {}) {
      aim(view);
      rig.apply(current, { time, view: view.name ?? 'painting' });
      return readFrame(() => pipeline.render());
    },

    // The plot is drawn from the frame it is of.
    async svg(view, options) {
      const image = await stage.capture(view);
      return renderPaintingSvg({ ...plotArgs(options), image });
    },

    dispose() {
      rig.dispose();
      pipeline.dispose();
    },
  };
  return stage;
}
