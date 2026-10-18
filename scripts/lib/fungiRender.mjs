/* eslint-disable import/no-extraneous-dependencies */
import {
  RENDER_OPTIONS,
  canonicalArgv,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/fungi/renderOptions.mjs';
import {
  DEG,
  createParseCli,
  loadKernelModules,
  withRenderer,
} from './generatorCli.mjs';
import { createHeadlessRenderer } from './headlessWebgpu.mjs';

// Barrels only — see docs/fungi-pipeline.md.
const ENTRIES = {
  fungi: '/src/modules/fungi/index.js',
  lights: '/src/modules/lightingRig/index.js',
  look: '/src/modules/fungiRender/index.js',
};

export const loadKernel = () => loadKernelModules(ENTRIES);

export const parseCli = createParseCli({
  RENDER_OPTIONS,
  canonicalArgv,
  defaultsFor,
  normalizeOptions,
});

export function rollArgs(kernel, { options, typed }) {
  const { fungi } = kernel;
  const scene = new Set(fungi.SCENE_KEYS);
  return {
    base: options.base ? fungi.configFrom(options.base) : {},
    keep: String(options.keep ?? '')
      .split(',')
      .map((facet) => facet.trim())
      .filter(Boolean),
    pinned: Object.fromEntries(
      [...typed]
        .filter((key) => scene.has(key))
        .map((key) => [fungi.sceneNameFor(key), options[key]])
    ),
    seeds: {
      cluster: options.clusterSeed ?? undefined,
      form: options.formSeed ?? undefined,
      palette: options.paletteSeed ?? undefined,
    },
  };
}

// What a batch draws at `index`: one rolled specimen, seeded the way the
// scene's regrow loop seeds its generations.
export function specimenAt(kernel, { index, options, roll }) {
  const { fungi } = kernel;
  const baseSeed = options.batch ?? fungi.randomSeed();
  const seed =
    options.batch == null ? baseSeed : fungi.seedFor(baseSeed, index);
  const config = fungi.rollFungiConfig(seed, roll);
  return { config, seed, specimen: fungi.buildSpecimen(config) };
}

// One renderer per output size, reused across frames: device and pipeline
// setup dominate a capture, and the rig's materials compile once.
export async function createFungiCapturer(
  kernel,
  { height, pixelRatio = 1, samples = 4, shadows = true, width }
) {
  const { THREE, TSL, lights, look } = kernel;

  // Mirrors src/app/scaffold/canvas/WebGPUCanvas.jsx: ACES tone mapping and
  // PCF soft shadows.
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
  const { post, setGlow } = look.createSpecimenPost(
    headless.renderer,
    scene,
    camera,
    { samples }
  );
  const rig = look.createSpecimenRig();
  rig.setRenderer(headless.renderer);
  scene.add(rig.group);
  let lightGroup = null;
  let lightKey = null;
  let current = null;
  let depthPipeline = null;

  // Linear depth across two 8-bit channels: one channel over the frustum
  // quantises far coarser than a fibre is thick.
  function depthPass() {
    if (depthPipeline) return depthPipeline;
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

  function aim({ eye, fov, levels, target }) {
    // A still runs the reaction field out to the iteration count its growth
    // level calls for, so a batch is repeatable.
    rig.setLevels(levels(current), { catchUp: true });
    const distance = Math.hypot(...eye.map((v, a) => v - target[a]));
    camera.near = Math.max(0.05, distance - rig.bounds().radius * 2.5);
    camera.far = distance + rig.bounds().radius * 3;
    camera.fov = fov;
    camera.position.set(...eye);
    camera.lookAt(...target);
    camera.updateProjectionMatrix();
  }

  function setLights(config) {
    const key = config.backgroundColor;
    if (key === lightKey) return;
    lightKey = key;
    lightGroup?.removeFromParent();
    lightGroup = lights.createSceneLights(
      lights.buildSceneLightingRuntimeConfig({
        controls: config,
        lighting: look.FUNGI_LIGHTING,
      }),
      { shadows }
    );
    scene.add(lightGroup);
    scene.background = new THREE.Color(config.backgroundColor);
  }

  return {
    load({ config, specimen }) {
      current = specimen;
      rig.load(specimen);
      rig.setConfig(config);
      setGlow(specimen.genome.glow);
      setLights(config);
      return rig.bounds();
    },

    async capture(view) {
      aim(view);
      return headless.readFrame(() => post.render());
    },

    // World-space depth per output pixel, for the SVG's hidden-line test.
    async captureDepth(view) {
      aim(view);
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

    matrix() {
      return rig.matrix();
    },

    dispose() {
      rig.dispose();
      headless.dispose();
    },
  };
}

// Camera placement for a view, framing the fitted specimen's box.
export function frameView(
  kernel,
  { azimuthOffset = 0, bounds, options, view }
) {
  const [azimuth, elevation] = kernel.fungi.VIEW_ANGLES[view] ?? [20, 6];
  const az = (azimuth + azimuthOffset) * DEG;
  const el = elevation * DEG;
  const dir = [
    Math.sin(az) * Math.cos(el),
    Math.sin(el),
    Math.cos(az) * Math.cos(el),
  ];
  const half = (options.fov * DEG) / 2;
  const horizontal = Math.atan(
    Math.tan(half) * (options.width / options.height)
  );
  const [width, height, depth] = bounds.size;
  const across = Math.max(width, depth);
  const distance =
    Math.max(height / 2 / Math.tan(half), across / 2 / Math.tan(horizontal)) *
      (1 + options.margin) +
    across / 2;
  return {
    eye: bounds.center.map((v, a) => v + dir[a] * distance),
    fov: options.fov,
    target: bounds.center,
  };
}

// The vector twin of a capture: the same specimen at the same levels,
// projected as centrelines, with what the render hides removed by its depth
// pass.
export async function renderSvg(
  kernel,
  capturer,
  { config, options, specimen, view }
) {
  const depth = options.svgOcclusion ? await capturer.captureDepth(view) : null;
  return kernel.fungi.renderFungiSvg({
    background: config.backgroundColor,
    camera: view,
    height: options.height,
    levels: view.levels(specimen),
    matrix: capturer.matrix(),
    specimen,
    sporeAmount: config.sporeAmount ?? 1,
    stroke: options.svgStroke,
    visible: depth ? capturer.depthProbe(depth) : null,
    width: options.width,
  });
}

export function sidecarFor({ config, options }) {
  return { preset: config, render: { ...options, base: undefined } };
}

export const withCapturer = (kernel, options, work) =>
  withRenderer(
    options,
    () =>
      createFungiCapturer(kernel, {
        height: options.height * options.pixelRatio,
        pixelRatio: options.pixelRatio,
        samples: options.samples,
        shadows: options.shadows,
        width: options.width * options.pixelRatio,
      }),
    work
  );
