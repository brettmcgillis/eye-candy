/* eslint-disable import/no-extraneous-dependencies */
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

import {
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/flora/renderOptions.mjs';
import { parseArgs, providedKeys } from './cliArgs.mjs';
import { createHeadlessRenderer, loadThree } from './headlessWebgpu.mjs';
import loadModules, { REPO_ROOT } from './loadModules.mjs';
import { runStage } from './progress.mjs';

export { REPO_ROOT };

// Barrels only — see docs/flora-pipeline.md.
const ENTRIES = {
  flora: '/src/modules/flora/index.js',
  lights: '/src/modules/lightingRig/index.js',
  look: '/src/modules/floraRender/index.js',
  palettes: '/src/utils/gradientPalette.js',
};

const DEG = Math.PI / 180;

// three must see the stubbed browser globals before any module that imports
// it is evaluated, so the renderer bootstrap runs first.
export async function loadKernel() {
  const { THREE, TSL } = await loadThree();
  const loaded = await loadModules(Object.values(ENTRIES));
  const pick = (name) => loaded[ENTRIES[name]];
  return {
    THREE,
    TSL,
    flora: pick('flora'),
    lights: pick('lights'),
    look: pick('look'),
    paletteNames: pick('palettes').PALETTE_NAMES,
    paletteStops: pick('palettes').getPaletteStops,
  };
}

// A json option may name a file, and a file may be a props.json sidecar;
// either way the caller gets the payload.
export async function readJsonOption(value) {
  if (value == null || typeof value !== 'string') return value;
  if (/^\s*[[{]/u.test(value)) return JSON.parse(value);
  return JSON.parse(await readFile(value, 'utf8'));
}

// A typed flag is a pin; the set is read before defaults are merged.
export async function parseCli(kind, argv) {
  const args = parseArgs(argv, defaultsFor(kind));
  if (args.help) return { help: true };
  const raw = { ...args };
  await Promise.all(
    Object.entries(RENDER_OPTIONS)
      .filter(([, spec]) => spec.type === 'json')
      .map(async ([key]) => {
        raw[key] = await readJsonOption(args[key]);
      })
  );
  return {
    options: normalizeOptions(kind, raw),
    typed: providedKeys(args),
  };
}

export function assertPalette(kernel, { options, typed }) {
  const names = ['None', ...kernel.paletteNames];
  if (typed.has('paletteName') && !names.includes(options.paletteName)) {
    throw new Error(
      `unknown palette "${options.paletteName}". ${kernel.paletteNames.length} names are available in src/utils/gradients.json, plus "None".`
    );
  }
}

export function rollArgs(kernel, { options, typed }) {
  const scene = new Set(kernel.flora.SCENE_KEYS);
  return {
    base: options.base ? kernel.flora.configFrom(options.base) : {},
    keep: String(options.keep ?? '')
      .split(',')
      .map((facet) => facet.trim())
      .filter(Boolean),
    paletteNames: kernel.paletteNames,
    pinned: Object.fromEntries(
      [...typed]
        .filter((key) => scene.has(key))
        .map((key) => [key, options[key]])
    ),
    seeds: {
      form: options.formSeed ?? undefined,
      ornaments: options.ornamentsSeed ?? undefined,
      palette: options.paletteSeed ?? undefined,
    },
  };
}

function sourceFlowers(kernel, options) {
  const list = options.bouquet ?? [];
  return list
    .map((entry) => {
      if (entry?.bouquet?.flowers) return entry.bouquet.flowers;
      return [kernel.flora.configFrom(entry)];
    })
    .flat();
}

// What a job at `index` draws: one rolled flower, or a bouquet of given and
// filled flowers plus its arrangement seed.
export function flowersAt(kernel, { index, options, roll }) {
  const { flora } = kernel;
  const baseSeed = options.seed ?? flora.randomSeed();
  const seed = options.seed == null ? baseSeed : flora.seedFor(baseSeed, index);
  const sources = sourceFlowers(kernel, options);
  const size = Math.max(options.bouquetSize, sources.length);

  if (size === 0) {
    return { configs: [flora.rollFloraConfig(seed, roll)], seed };
  }

  const configs = Array.from({ length: size }, (_, slot) => {
    if (slot < sources.length) {
      const source = sources[slot];
      return index === 0
        ? source
        : { ...source, seed: flora.seedFor(source.seed ?? seed, index) };
    }
    const flowerSeed = `${seed}.${slot}`;
    if (options.bouquetFill === 'repeat' && sources.length > 0) {
      return { ...sources[slot % sources.length], seed: flowerSeed };
    }
    return flora.rollFloraConfig(flowerSeed, roll);
  });
  return { bouquet: true, configs, seed };
}

function viewDirection(angles, view, azimuthOffset) {
  const [azimuth, elevation] = angles[view] ?? [0, 4];
  const az = (azimuth + azimuthOffset) * DEG;
  const el = elevation * DEG;
  return [
    Math.sin(az) * Math.cos(el),
    Math.sin(el),
    Math.cos(az) * Math.cos(el),
  ];
}

// A flower is rigid: it turns about its own axis, swings its head direction
// onto the arrangement's target, and slides down its own stem — see
// @modules/flora/bouquet.js.
function composePlacement(THREE, group, placement) {
  const from = new THREE.Vector3(...placement.from);
  const to = new THREE.Vector3(...placement.to);
  const pivot = new THREE.Vector3(...placement.pivot);
  const turn = new THREE.Quaternion().setFromAxisAngle(from, placement.turn);

  group.quaternion.setFromUnitVectors(from, to).multiply(turn);
  group.scale.setScalar(placement.scale);
  group.position
    .copy(pivot)
    .sub(
      pivot
        .clone()
        .multiplyScalar(placement.scale)
        .applyQuaternion(group.quaternion)
    )
    .addScaledVector(to, -placement.slide);
  group.updateMatrixWorld(true);
}

// One renderer per output size, reused across frames: device and pipeline
// setup dominate a capture. Rigs are pooled so a batch compiles the flower
// materials once.
export async function createFloraCapturer(
  kernel,
  { height, pixelRatio = 1, samples = 4, shadows = true, width }
) {
  const { THREE, TSL, flora, lights, look } = kernel;

  // Mirrors src/app/scaffold/canvas/WebGPUCanvas.jsx: R3F's defaults are
  // ACES tone mapping and, with shadows="soft", PCF soft shadow maps.
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
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, width / height, 0.05, 400);
  const post = new THREE.RenderPipeline(headless.renderer);
  post.outputNode = TSL.pass(scene, camera, samples > 0 ? { samples } : {});

  const rigs = [];
  let lightGroup = null;
  let lightKey = null;
  let flowers = [];
  let extent = { center: [0, 0, 0], radius: 10 };
  let depthPipeline = null;

  // Linear depth, encoded across two 8-bit channels. A single channel over a
  // frustum tens of units deep quantises to steps far coarser than a fiber is
  // thick, and the SVG's hidden-line test compares against exactly that.
  function depthPass() {
    if (depthPipeline) return depthPipeline;
    // getLinearDepthNode, not getViewZNode normalised by hand: the camera
    // uniforms a hand-built graph picks up are not the pass's own, and the
    // result came back a constant.
    const unit = TSL.pass(scene, camera)
      .getLinearDepthNode()
      .clamp(0, 1)
      .mul(65535);
    const high = unit.div(256).floor();
    depthPipeline = new THREE.RenderPipeline(headless.renderer);
    depthPipeline.outputColorTransform = false;
    depthPipeline.outputNode = TSL.vec4(
      high.div(255),
      unit.sub(high.mul(256)).floor().div(255),
      0,
      1
    );
    return depthPipeline;
  }

  // A frustum wrapped around what is drawn, so 16 bits of depth land well
  // inside a fiber's radius.
  function aimCamera({ eye, fov, target }) {
    const distance = Math.hypot(...eye.map((v, a) => v - target[a]));
    camera.near = Math.max(0.05, distance - extent.radius * 2);
    camera.far = distance + extent.radius * 2.5;
    camera.fov = fov;
    camera.position.set(...eye);
    camera.lookAt(...target);
    camera.updateProjectionMatrix();
  }

  function rigAt(index) {
    while (rigs.length <= index) {
      const rig = look.createSpecimenRig();
      rigs.push({ rig, specimen: null });
    }
    return rigs[index];
  }

  function setLights(config, bounds) {
    const key = JSON.stringify([config.backgroundColor, bounds]);
    if (key === lightKey) return;
    lightKey = key;
    lightGroup?.removeFromParent();
    lightGroup = lights.createSceneLights(
      lights.buildSceneLightingRuntimeConfig({
        controls: config,
        lighting: look.FLORA_LIGHTING,
      }),
      { shadows }
    );
    // The declared shadow frustum is sized for one flower at the scene's
    // crown; a bouquet or a tall specimen needs it to cover what is drawn.
    const center = bounds.min.map((v, a) => (v + bounds.max[a]) / 2);
    const radius =
      Math.hypot(...bounds.max.map((v, a) => v - bounds.min[a])) / 2;
    lightGroup.children.forEach((light) => {
      if (!light.isDirectionalLight) return;
      const shift = new THREE.Vector3(...center).sub(light.target.position);
      light.target.position.add(shift);
      light.position.add(shift);
      if (!light.shadow) return;
      const half = Math.max(light.shadow.camera.right, radius * 1.15);
      Object.assign(light.shadow.camera, {
        bottom: -half,
        left: -half,
        right: half,
        top: half,
      });
      light.shadow.camera.updateProjectionMatrix();
    });
    scene.add(lightGroup);
    scene.background = new THREE.Color(config.backgroundColor);
  }

  return {
    // `entries` are { config, specimen, placement? }. A specimen is only
    // re-uploaded when it changes identity.
    setFlowers(entries) {
      flowers = entries;
      rigs.forEach(({ rig }, index) => {
        if (index >= entries.length) rig.group.removeFromParent();
      });
      const boxes = entries.map((entry, index) => {
        const slot = rigAt(index);
        if (slot.specimen !== entry.specimen) {
          slot.rig.load(entry.specimen);
          slot.specimen = entry.specimen;
        }
        // The clamps are in output pixels, so they scale with the ratio and a
        // 2x render is the 1x render with more detail rather than thinner
        // fibers.
        slot.rig.setConfig({
          ...entry.config,
          minPixels: entry.config.minPixels * pixelRatio,
          ornamentMinPixels: entry.config.ornamentMinPixels * pixelRatio,
        });
        const { group } = slot.rig;
        group.position.set(0, 0, 0);
        group.quaternion.identity();
        group.scale.setScalar(1);
        if (entry.placement) composePlacement(THREE, group, entry.placement);
        group.updateMatrixWorld(true);
        scene.add(group);
        const point = new THREE.Vector3();
        return flora.specimenBounds(entry.specimen, (p) =>
          point
            .set(...p)
            .applyMatrix4(group.matrixWorld)
            .toArray()
        );
      });
      const bounds = {
        max: [0, 1, 2].map((a) => Math.max(...boxes.map((b) => b.max[a]))),
        min: [0, 1, 2].map((a) => Math.min(...boxes.map((b) => b.min[a]))),
      };
      extent = {
        center: bounds.min.map((v, a) => (v + bounds.max[a]) / 2),
        radius:
          Math.hypot(...bounds.max.map((v, a) => v - bounds.min[a])) / 2 || 1,
      };
      setLights(entries[0].config, bounds);
      return bounds;
    },

    // `levels(config)` gives each flower its growth/bloom/exit.
    async capture({ eye, fov, levels, target }) {
      flowers.forEach((entry, index) => {
        rigs[index].rig.setLevels(levels(entry.config));
      });
      aimCamera({ eye, fov, target });
      return headless.readFrame(() => post.render());
    },

    // World-space depth per output pixel, for the SVG's hidden-line test.
    async captureDepth(view) {
      aimCamera(view);
      const pipeline = depthPass();
      const frame = await headless.readFrame(() => pipeline.render());
      const { far, near } = camera;
      const depths = new Float32Array(frame.width * frame.height);
      for (let i = 0; i < depths.length; i += 1) {
        const unit = (frame.data[i * 4] * 256 + frame.data[i * 4 + 1]) / 65535;
        depths[i] = near + unit * (far - near);
      }
      return { data: depths, height: frame.height, width: frame.width };
    },

    matrices() {
      return flowers.map((entry, index) =>
        Array.from(rigs[index].rig.group.matrixWorld.elements)
      );
    },

    // A hidden-line test in output pixels, whatever the pixel ratio is.
    depthProbe(depth) {
      return (x, y, z) => {
        const px = Math.round(x * pixelRatio);
        const py = Math.round(y * pixelRatio);
        if (px < 0 || py < 0 || px >= depth.width || py >= depth.height) {
          return true;
        }
        return z <= depth.data[py * depth.width + px];
      };
    },

    dispose() {
      rigs.forEach(({ rig }) => rig.dispose());
      headless.dispose();
    },
  };
}

// Camera placement for a view: `fit` frames the drawn bounds, `scene` uses the
// scene camera's target at a fixed distance.
export function frameView(
  kernel,
  { azimuthOffset = 0, bounds, options, view }
) {
  const dir = viewDirection(kernel.flora.VIEW_ANGLES, view, azimuthOffset);
  if (options.framing === 'scene') {
    const { target } = kernel.look.FLORA_CAMERA.orbit.desktop;
    return {
      eye: target.map((v, a) => v + dir[a] * options.distance),
      fov: options.fov,
      target,
    };
  }
  const center = bounds.min.map((v, a) => (v + bounds.max[a]) / 2);
  const radius = Math.hypot(...bounds.max.map((v, a) => v - bounds.min[a])) / 2;
  const half = (options.fov * DEG) / 2;
  const horizontal = Math.atan(
    Math.tan(half) * (options.width / options.height)
  );
  const distance =
    (radius * (1 + options.margin)) / Math.sin(Math.min(half, horizontal));
  return {
    eye: center.map((v, a) => v + dir[a] * distance),
    fov: options.fov,
    target: center,
  };
}

export function buildFlowers(kernel, { bouquet, configs, options, seed }) {
  const specimens = configs.map((config) => kernel.flora.buildSpecimen(config));
  if (!bouquet) return [{ config: configs[0], specimen: specimens[0] }];

  const placements = kernel.flora.arrangeBouquet(
    specimens.map((specimen) => ({
      center: specimen.center,
      crownRadius: specimen.crownRadius,
      height: specimen.height,
    })),
    {
      gap: options.bouquetGap,
      jitter: options.bouquetJitter,
      seed,
      spread: options.bouquetSpread,
      style: options.bouquetStyle,
      tie: options.bouquetTie,
    }
  );
  return configs.map((config, index) => ({
    config,
    placement: placements[index],
    specimen: specimens[index],
  }));
}

// The vector twin of a capture: the same flowers, projected as centrelines,
// with what the render hides removed by its depth pass.
export async function renderSvg(kernel, capturer, { flowers, options, view }) {
  const depth = options.svgOcclusion ? await capturer.captureDepth(view) : null;
  return kernel.flora.renderFloraSvg({
    background: flowers[0].config.backgroundColor,
    camera: view,
    flowers: flowers.map((entry, index) => ({
      config: entry.config,
      matrix: capturer.matrices()[index],
      specimen: {
        ...entry.specimen,
        paletteStops: kernel.paletteStops(entry.config.paletteName),
      },
    })),
    growth: options.growth,
    height: options.height,
    stroke: options.svgStroke,
    visible: depth ? capturer.depthProbe(depth) : null,
    width: options.width,
  });
}

export function sidecarFor({ bouquet, configs, options, seed }) {
  const render = { ...options, bouquet: undefined, base: undefined };
  return bouquet
    ? { bouquet: { flowers: configs, seed }, render }
    : { preset: configs[0], render };
}

export async function encodeFrame(frame, format) {
  const image = sharp(frame.data, {
    raw: { channels: 4, height: frame.height, width: frame.width },
  });
  if (format === 'raw') return frame.data;
  if (format === 'webp') return image.webp({ lossless: true }).toBuffer();
  return image.png().toBuffer();
}

export async function withCapturer(kernel, options, work) {
  const capturer = await runStage(
    `initializing WebGPU renderer (${options.width * options.pixelRatio}x${
      options.height * options.pixelRatio
    })`,
    () =>
      createFloraCapturer(kernel, {
        height: options.height * options.pixelRatio,
        pixelRatio: options.pixelRatio,
        samples: options.samples,
        shadows: options.shadows,
        width: options.width * options.pixelRatio,
      })
  );
  try {
    return await work(capturer);
  } finally {
    capturer.dispose();
  }
}
