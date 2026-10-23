import { pass } from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  SCENE_KEYS,
  VIEW_AZIMUTHS,
  VIEW_ELEVATIONS,
  configFrom,
  rollFractalAutomataConfig,
  seedFor,
} from '@modules/fractalAutomata';
import { createPostChain } from '@modules/postRig';
import { setBackdrop } from '@modules/renderStage/capture';
import createMeshPlotter from '@modules/renderStage/meshPlotter';
import { PALETTE_NAMES, getPaletteStops } from '@utils/gradientPalette';

import createStudio from './environment';
import godraysSlot from './godrays';
import { createCenterLight, createLightRig } from './lightRig';
import {
  buildVoxelObject,
  disposeVoxelMeshes,
  pickStructuralSettings,
  updateVoxelMaterials,
  voxelBounds,
} from './voxelBuild';

const DEG = Math.PI / 180;
const MIN_PALETTE_STOPS = 3;
const MIN_OCCUPIED = 800;
const MIN_FLATNESS = 0.3;
const MAX_ATTEMPTS = 6;

const sub = (a, b) => a.map((v, i) => v - b[i]);
const dotOf = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const normalize = (v) => {
  const length = Math.hypot(...v) || 1;
  return v.map((c) => c / length);
};

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
      PALETTE_NAMES.filter(
        (name) => (getPaletteStops(name)?.length ?? 0) >= MIN_PALETTE_STOPS
      ),
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
  return { config: rollFractalAutomataConfig(name, roll), name };
}

// A perspective camera on the view's bearing, pulled back until the
// structure's bounds fit. A moving camera fits the bounding sphere instead, so
// orbiting never changes the zoom.
export function frameView({
  azimuthOffset = 0,
  bounds,
  options,
  stable = false,
  view,
}) {
  const azimuth = (VIEW_AZIMUTHS[view] + azimuthOffset) * DEG;
  const elevation = VIEW_ELEVATIONS[view] * DEG;
  const z = [
    Math.cos(azimuth) * Math.cos(elevation),
    Math.sin(elevation),
    Math.sin(azimuth) * Math.cos(elevation),
  ];
  const up = [0, 1, 0];
  const x = normalize(cross(up, z));
  const y = cross(z, x);
  const center = bounds.min.map((v, a) => (v + bounds.max[a]) / 2);
  const radius = Math.hypot(...sub(bounds.max, bounds.min)) / 2;
  const aspect = options.width / options.height;
  const tanY = Math.tan((options.fov * DEG) / 2) * (1 - options.margin * 2);
  const tanX = tanY * aspect;

  let distance;
  if (stable) {
    distance = radius / Math.sin(Math.atan(Math.min(tanX, tanY)));
  } else {
    distance = 0;
    for (let i = 0; i < 8; i += 1) {
      const corner = [0, 1, 2].map((a) =>
        // eslint-disable-next-line no-bitwise
        (i >> a) & 1 ? bounds.max[a] : bounds.min[a]
      );
      const offset = sub(corner, center);
      const toward = dotOf(offset, z);
      distance = Math.max(
        distance,
        toward + Math.abs(dotOf(offset, x)) / tanX,
        toward + Math.abs(dotOf(offset, y)) / tanY
      );
    }
  }

  return {
    distance,
    eye: center.map((v, a) => v + z[a] * distance),
    far: distance + radius * 1.5,
    fov: options.fov,
    near: Math.max(0.05, distance - radius * 1.5),
    target: center,
    up,
  };
}

// The voxel stage the CLI renders headlessly and the Live tab renders on a
// canvas, mirroring the scene's canvas: ACES tone mapping and soft shadows.
// `advance` starts a fresh animation frame where the caller drives frames by
// hand (the headless renderer).
export function createAutomataStage({
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
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  const lightRig = createLightRig({ shadows });
  const centerLight = createCenterLight();
  const studio = createStudio();
  const plain = new THREE.RenderPipeline(renderer);
  plain.outputNode = pass(scene, camera, samples > 0 ? { samples } : {});
  const meshPlot = createMeshPlotter(renderer, { advance });

  let current = null;
  let built = null;
  let chain = null;
  let chainKey = null;

  scene.add(lightRig.group, centerLight.group);

  function setScene(config) {
    setBackdrop({ renderer, scene }, config.backgroundColor, transparent);
    if (config.envEnabled) {
      studio.update(renderer);
      scene.environment = studio.texture;
      scene.environmentIntensity = config.envIntensity;
    } else {
      scene.environment = null;
    }
    // eslint-disable-next-line no-param-reassign
    renderer.toneMappingExposure = config.exposure;
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

  // Godrays raymarch the point light's shadow map, which only exists once a
  // render has allocated it, so the chain is built after a warm-up frame.
  function setChain(config) {
    const slots = [godraysSlot(config)].filter((slot) => slot.enabled);
    const key = JSON.stringify(slots);
    if (key !== chainKey) {
      chainKey = key;
      chain =
        slots.length > 0
          ? createPostChain({
              camera,
              lights: { center: centerLight.light },
              passOptions: samples > 0 ? { samples } : {},
              renderer,
              scene,
              slots,
            })
          : null;
    }
    chain?.chain.forEach((entry) => entry.update(config, {}));
  }

  function place(config, position) {
    lightRig.apply(config);
    centerLight.apply(config, position);
  }

  return {
    // Builds a structure and returns the bounds views are framed on, plus
    // what the build reports (occupied cell count, the seed the CA settled on).
    async load({ config }) {
      if (built) {
        scene.remove(built.group);
        disposeVoxelMeshes(built);
      }
      current = { config };
      setScene(config);
      place(config);
      built = await buildVoxelObject({
        config,
        gl: renderer,
        structural: pickStructuralSettings(config),
      });
      scene.add(built.group);
      await readFrame(() => plain.render());
      setChain(config);
      return {
        bounds: voxelBounds(built.group),
        occupied: built.occupied,
        seed: built.seed,
      };
    },

    // `config` overrides the loaded one for a frame (a light sweeping round);
    // `position` moves the godray light.
    capture(view, { config = current.config, position } = {}) {
      aim(view);
      place(config, position);
      updateVoxelMaterials({ ...built, config });
      setScene(config);
      setChain(config);
      return readFrame(() => (chain?.pipeline ?? plain).render());
    },

    // The structure as hidden-line line work in its state colours: the
    // greedy mesh's contours and creases, so merged faces draw no seams.
    svg(view, options) {
      aim(view);
      return meshPlot({
        camera,
        options,
        scene,
        subject: built.group,
        view,
      });
    },

    dispose() {
      if (built) disposeVoxelMeshes(built);
      centerLight.dispose();
      studio.dispose();
      plain.dispose();
    },
  };
}

function isFlat({ max, min }) {
  const spans = max.map((v, a) => v - min[a]);
  return Math.min(...spans) < MIN_FLATNESS * Math.max(...spans);
}

// The rules are rolled blind, and some roll to nothing, a single layer or a
// speck. A roll is drawn again under `name~attempt` until the built structure
// has cells and some depth in every axis. A held structure is taken as it is.
export async function settleStructure(stage, { batch, index, roll }) {
  const held = roll.keep.includes('structure');
  let drawn;
  let loaded;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    drawn = structureAt({
      batch: attempt === 0 ? batch : `${batch}~${attempt}`,
      index,
      roll,
    });
    // eslint-disable-next-line no-await-in-loop
    loaded = await stage.load(drawn);
    if (held || (loaded.occupied >= MIN_OCCUPIED && !isFlat(loaded.bounds))) {
      break;
    }
  }
  return { drawn, loaded };
}
