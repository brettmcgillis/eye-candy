import { pass } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { SOURCE_IMAGE_MAX, createIsoBuilder, seedFor } from '@modules/isoLines';
import {
  SCENE_KEYS,
  configFrom,
  rollIsoLinesReliefConfig,
  segmentMode,
} from '@modules/isoLinesRelief';
import { buildScenePostRuntimeConfig, createPostChain } from '@modules/postRig';
import { setBackdrop } from '@modules/renderStage/capture';
import createMeshPlotter from '@modules/renderStage/meshPlotter';
import { PALETTE_NAMES, getPaletteStops } from '@utils/gradientPalette';

import plotParts from './plot';
import ISO_LINES_RELIEF_POST from './post';
import createReliefRig from './rig';

// The sheet steps at grid resolution along a steep rim, so the plot spans
// the steps (output px) and drops the mesh-edge debris where a chain meets
// the outline.
const PLOT_TUNING = {
  contourTolerance: 2,
  minLength: 14,
  outlineTolerance: 1.5,
};

// With exact occlusion the outline is drawn from the meshes' own edges, and
// the sheet's occluding contours (which follow its cells) are straightened
// to the stroke they trace (output px).
const EXACT_TUNING = { contourTolerance: 1.6, silhouette: false };

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

// The relief stage the CLI renders headlessly and the Live tab renders on a
// canvas, mirroring the scene: soft shadows and flat tone mapping.
export function createReliefStage({
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
  const rig = createReliefRig();
  const meshPlot = createMeshPlotter(renderer, { advance });
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

    // The piece as hidden-line line work through the view's camera: each
    // level's contour standing at its height, plus the walls, skirts and
    // smooth sheet the style draws, at rest.
    svg(view, options) {
      aim(view);
      rig.setBuild(shown);
      rig.setTime(shown.time);
      rig.setMotion({});
      const { lines, meshes, occluders } = plotParts(current.config, shown);
      return meshPlot({
        camera: cameras[view.projection],
        lines,
        meshes,
        options,
        plot: occluders ? { ...EXACT_TUNING, occluders } : PLOT_TUNING,
        scene,
        subject: rig.plotSubject(),
        view,
      });
    },

    dispose() {
      rig.dispose();
      Object.values(pipelines).forEach(({ pipeline }) => pipeline.dispose?.());
    },
  };
}
