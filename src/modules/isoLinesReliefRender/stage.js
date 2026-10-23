import { pass } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { SOURCE_IMAGE_MAX, createIsoBuilder, seedFor } from '@modules/isoLines';
import {
  SCENE_KEYS,
  configFrom,
  rollIsoLinesReliefConfig,
  segmentMode,
} from '@modules/isoLinesRelief';
import { planSvg } from '@modules/isoLinesRender';
import { buildScenePostRuntimeConfig, createPostChain } from '@modules/postRig';
import { setBackdrop } from '@modules/renderStage/capture';
import { PALETTE_NAMES, getPaletteStops } from '@utils/gradientPalette';

import ISO_LINES_RELIEF_POST from './post';
import createReliefRig from './rig';

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
// A source image without a typed weightImage drives the field alone.
// `loadImage(source, max)` decodes it (sharp in the CLI, a canvas in the
// page).
export async function pieceAt({ batch, index, loadImage, roll }) {
  const name = seedFor(batch, index);
  const config = rollIsoLinesReliefConfig(name, roll);
  if (config.sourceImage && roll.pinned.weightImage == null) {
    Object.assign(config, {
      weightFocal: 0,
      weightImage: 1,
      weightNoise: 0,
      weightShape: 0,
    });
  }
  const image =
    config.sourceImage && config.weightImage > 0
      ? await loadImage(config.sourceImage, SOURCE_IMAGE_MAX)
      : null;
  return {
    config,
    image,
    name,
    stops: getPaletteStops(config.paletteName),
  };
}

// The piece's grid (and contour lines, for a plot) at a clip time.
export const buildPiece = ({ config, image }, options, { time, withLines }) =>
  createIsoBuilder().build(config, {
    aspect: options.width / options.height,
    image,
    mode: segmentMode(config),
    time,
    withLines,
  });

export { planSvg };

// The relief stage the CLI renders headlessly and the Live tab renders on a
// canvas, mirroring the scene: soft shadows and flat tone mapping.
export function createReliefStage({
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
  const rig = createReliefRig();
  const passOptions = samples > 0 ? { samples } : {};
  const pipelines = {};
  let current = null;
  let shown = null;

  scene.add(rig.group);

  function pipelineFor(projection) {
    const slots = buildScenePostRuntimeConfig(
      ISO_LINES_RELIEF_POST,
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

    // `pixelRatio` scales the px-sized line widths to the output.
    load(drawn, pixelRatio) {
      current = drawn;
      rig.apply(drawn.config);
      rig.setPixelRatio(pixelRatio);
      setBackdrop({ renderer, scene }, drawn.config.background, transparent);
    },

    // The build a frame without its own draws.
    show(build) {
      shown = build;
    },

    capture(view, build = shown, motion = {}) {
      aim(view);
      rig.setBuild(build);
      rig.setTime(build.time);
      rig.setMotion(motion);
      return readFrame(() => pipelineFor(view.projection).render());
    },

    svg(view, options) {
      return planSvg(current, shown, options);
    },

    dispose() {
      rig.dispose();
      Object.values(pipelines).forEach(({ pipeline }) => pipeline.dispose?.());
    },
  };
}
