import { pass } from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  buildSceneLightingRuntimeConfig,
  createSceneLights,
} from '@modules/lightingRig';
import { setBackdrop } from '@modules/renderStage/capture';
import createMeshPlotter from '@modules/renderStage/meshPlotter';
import { randomSeed, seedFor } from '@modules/subdivision';
import {
  PLATE_MARGIN,
  SCENE_KEYS,
  SOURCE_IMAGE_MAX,
  WORLD_SCALE,
  buildReliefPiece,
  configFrom,
  motionAt,
  rollReliefConfig,
  sceneNamed,
} from '@modules/subdivisionRelief';
import {
  PALETTE_NAMES,
  PALETTE_NONE,
  getPaletteStops,
} from '@utils/gradientPalette';

import SUBDIVISION_RELIEF_LIGHTING from './lighting';
import createReliefRig from './rig';

export function rollArgs({ options, typed }) {
  const scene = new Set(SCENE_KEYS);
  return {
    base: options.base ? configFrom(options.base) : {},
    keep: String(options.keep ?? '')
      .split(',')
      .map((facet) => facet.trim())
      .filter(Boolean),
    paletteNames: PALETTE_NAMES,
    pinned: sceneNamed(
      Object.fromEntries(
        [...typed]
          .filter((key) => scene.has(key))
          .map((key) => [key, options[key]])
      )
    ),
    seeds: {
      field: options.fieldSeed ?? undefined,
      palette: options.paletteSeed ?? undefined,
      relief: options.reliefSeed ?? undefined,
      structure: options.structureSeed ?? undefined,
    },
  };
}

// What a batch draws at `index`: a seeded batch names its pieces seed,
// seed-1…; without one every piece gets a random seed. `loadImage(source,
// max)` decodes an image field's source (sharp in the CLI, a canvas in the
// page).
export async function pieceAt({ index, loadImage, options, roll }) {
  const seed =
    options.batch == null ? randomSeed() : seedFor(options.batch, index);
  const config = rollReliefConfig(seed, roll);
  const image =
    config.field === 'image'
      ? await loadImage(config.sourceImage, SOURCE_IMAGE_MAX)
      : null;
  const stops =
    config.palette === PALETTE_NONE ? null : getPaletteStops(config.palette);
  const piece = buildReliefPiece(config, {
    canvas: { height: options.height, width: options.width },
    image,
    stops,
  });
  return { config, name: seed, piece };
}

// The relief stage the CLI renders headlessly and the Live tab renders on a
// canvas, mirroring the scene: ACES tone mapping and soft shadows. A CLI
// frame passes its grow and motion; Live runs the motion on its own clock.
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
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
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
  const lightGroup = createSceneLights(
    buildSceneLightingRuntimeConfig({
      controls: {},
      lighting: SUBDIVISION_RELIEF_LIGHTING,
    }),
    { shadows: true }
  );
  const passOptions = samples > 0 ? { samples } : {};
  const pipelines = {};
  let current = null;
  let elapsed = 0;
  scene.add(rig.group, lightGroup);

  function pipelineFor(projection) {
    if (!pipelines[projection]) {
      const pipeline = new THREE.RenderPipeline(renderer);
      pipeline.outputNode = pass(scene, cameras[projection], passOptions);
      pipelines[projection] = pipeline;
    }
    return pipelines[projection];
  }

  // The scene's shadow box is sized for its default panel; a larger canvas
  // would fall outside it.
  function fitShadows(canvas) {
    const reach =
      (Math.hypot(canvas.width, canvas.height) / 2) *
        WORLD_SCALE *
        PLATE_MARGIN +
      1;
    lightGroup.traverse((light) => {
      if (!light.isDirectionalLight || !light.castShadow) return;
      const { camera } = light.shadow;
      const extent = Math.max(camera.right, reach);
      Object.assign(camera, {
        bottom: -extent,
        far: Math.max(camera.far, light.position.length() + reach * 2),
        left: -extent,
        right: extent,
        top: extent,
      });
      camera.updateProjectionMatrix();
    });
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

    load(drawn) {
      const { config, piece } = drawn;
      current = drawn;
      rig.apply(config);
      rig.setPiece(piece);
      fitShadows(piece.canvas);
      setBackdrop({ renderer, scene }, config.bgColor, transparent);
    },

    step(delta) {
      elapsed += delta;
    },

    // `grow` in levels (default: fully split); `motion` as motionAt gives it.
    capture(
      view,
      {
        grow = current.piece.maxDepth + 1,
        motion = motionAt(current.config, elapsed),
      } = {}
    ) {
      aim(view);
      rig.setGrow(grow);
      rig.setMotion(motion);
      return readFrame(() => pipelineFor(view.projection).render());
    },

    // The grown cells as hidden-line line work through the view's camera:
    // each prism's edges, or `svgStyle: faces` for its top alone. The motion
    // is held off, since the plot's cells are placed without it.
    svg(view, options) {
      aim(view);
      const grow = current.piece.maxDepth + 1;
      rig.setGrow(grow);
      rig.setMotion({ mix: 0, noisePhase: 0, wavePhase: 0 });
      const { drawn, solid } = rig.plotMeshes({
        faces: options.svgStyle === 'faces',
        grow,
      });
      return meshPlot({
        camera: cameras[view.projection],
        meshes: drawn,
        occluders: options.svgOcclusion ? solid : [],
        options,
        scene,
        subject: rig.cells,
        view,
      });
    },

    dispose() {
      rig.dispose();
      Object.values(pipelines).forEach((pipeline) => pipeline.dispose());
    },
  };
}
