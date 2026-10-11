/* eslint-disable import/no-extraneous-dependencies */
import {
  RENDER_OPTIONS,
  SCENE_KEYS,
  VIEW_AZIMUTHS,
  VIEW_ELEVATIONS,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/fractalAutomata/renderOptions.mjs';
import {
  DEG,
  createParseCli,
  cross,
  dotOf,
  loadKernelModules,
  normalize,
  sub,
} from './generatorCli.mjs';
import { createHeadlessRenderer } from './headlessWebgpu.mjs';
import { runStage } from './progress.mjs';

// Barrels only — see docs/fractal-automata-pipeline.md.
const ENTRIES = {
  auto: '/src/modules/fractalAutomata/index.js',
  look: '/src/modules/fractalAutomataRender/index.js',
  post: '/src/modules/postRig/index.js',
};

const MIN_PALETTE_STOPS = 3;
const MIN_OCCUPIED = 800;
const MIN_FLATNESS = 0.3;
const MAX_ATTEMPTS = 6;

export const loadKernel = () => loadKernelModules(ENTRIES);

export const parseCli = createParseCli({
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
});

export function rollArgs(kernel, { options, typed }) {
  const { auto, look } = kernel;
  const scene = new Set(SCENE_KEYS);
  return {
    base: options.base ? auto.configFrom(options.base) : {},
    keep: String(options.keep ?? '')
      .split(',')
      .map((facet) => facet.trim())
      .filter(Boolean),
    palettes:
      options.palettes ??
      look.PALETTE_NAMES.filter(
        (name) => (look.getPaletteStops(name)?.length ?? 0) >= MIN_PALETTE_STOPS
      ),
    pinned: Object.fromEntries(
      [...typed]
        .filter((key) => scene.has(key))
        .map((key) => [key, options[key]])
    ),
  };
}

// What a batch draws at `index`: names follow batch, batch-1, batch-2….
export function structureAt(kernel, { batch, index, roll }) {
  const { auto } = kernel;
  const name = auto.seedFor(batch, index);
  return { config: auto.rollFractalAutomataConfig(name, roll), name };
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

// One renderer per output size, reused across structures and frames: device
// and pipeline setup dominate a capture, and the voxel materials compile once
// per structure.
export async function createAutomataCapturer(
  kernel,
  { height, samples = 4, shadows = true, width }
) {
  const { THREE, TSL, look, post } = kernel;

  // Mirrors the scene's canvas: R3F's ACES tone mapping and soft shadows.
  const headless = await createHeadlessRenderer({
    configure(renderer) {
      /* eslint-disable no-param-reassign */
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.shadowMap.enabled = shadows;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      /* eslint-enable no-param-reassign */
    },
    height,
    width,
  });
  const { renderer } = headless;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  const lightRig = look.createLightRig({ shadows });
  const centerLight = look.createCenterLight();
  const studio = look.createStudio();
  const plain = new THREE.RenderPipeline(renderer);
  plain.outputNode = TSL.pass(scene, camera, samples > 0 ? { samples } : {});

  let current = null;
  let built = null;
  let chain = null;
  let chainKey = null;

  scene.add(lightRig.group, centerLight.group);

  function setScene(config) {
    scene.background = new THREE.Color(config.backgroundColor);
    if (config.envEnabled) {
      studio.update(renderer);
      scene.environment = studio.texture;
      scene.environmentIntensity = config.envIntensity;
    } else {
      scene.environment = null;
    }
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

  async function render(pipeline) {
    return headless.readFrame(() => pipeline.render());
  }

  // Godrays raymarch the point light's shadow map, which only exists once a
  // render has allocated it, so the chain is built after a warm-up frame.
  async function setChain(config) {
    const slots = [look.godraysSlot(config)].filter((slot) => slot.enabled);
    const key = JSON.stringify(slots);
    if (key !== chainKey) {
      chainKey = key;
      chain =
        slots.length > 0
          ? post.createPostChain({
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
        look.disposeVoxelMeshes(built);
      }
      current = { config };
      setScene(config);
      place(config);
      built = await look.buildVoxelObject({
        config,
        gl: renderer,
        structural: look.pickStructuralSettings(config),
      });
      scene.add(built.group);
      await headless.readFrame(() => plain.render());
      await setChain(config);
      return {
        bounds: look.voxelBounds(built.group),
        occupied: built.occupied,
        seed: built.seed,
      };
    },

    // `config` overrides the loaded one for a frame (a light sweeping round);
    // `position` moves the godray light.
    async capture(view, { config = current.config, position } = {}) {
      aim(view);
      place(config, position);
      look.updateVoxelMaterials({ ...built, config });
      setScene(config);
      await setChain(config);
      return render(chain?.pipeline ?? plain);
    },

    async dispose() {
      if (built) look.disposeVoxelMeshes(built);
      centerLight.dispose();
      studio.dispose();
      headless.dispose();
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
export async function settleStructure(
  capturer,
  kernel,
  { batch, index, roll }
) {
  const held = roll.keep.includes('structure');
  let drawn;
  let loaded;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    drawn = structureAt(kernel, {
      batch: attempt === 0 ? batch : `${batch}~${attempt}`,
      index,
      roll,
    });
    // eslint-disable-next-line no-await-in-loop
    loaded = await capturer.load(drawn);
    if (held || (loaded.occupied >= MIN_OCCUPIED && !isFlat(loaded.bounds))) {
      break;
    }
  }
  return { drawn, loaded };
}

export async function withCapturer(kernel, options, work) {
  const capturer = await runStage(
    `initializing WebGPU renderer (${options.width * options.pixelRatio}x${
      options.height * options.pixelRatio
    })`,
    () =>
      createAutomataCapturer(kernel, {
        height: options.height * options.pixelRatio,
        samples: options.samples,
        shadows: options.shadows,
        width: options.width * options.pixelRatio,
      })
  );
  try {
    return await work(capturer);
  } finally {
    await capturer.dispose();
  }
}

export function sidecarFor({ config, name, options, stats }) {
  return {
    name,
    preset: config,
    render: { ...options, base: undefined, palettes: undefined },
    stats,
  };
}
