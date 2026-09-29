/* eslint-disable import/no-extraneous-dependencies */
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

import {
  RENDER_OPTIONS,
  SCENE_KEYS,
  VIEW_AZIMUTHS,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/blockParty/renderOptions.mjs';
import { parseArgs, providedKeys } from './cliArgs.mjs';
import { createHeadlessRenderer, loadThree } from './headlessWebgpu.mjs';
import loadModules, { REPO_ROOT } from './loadModules.mjs';
import { runStage } from './progress.mjs';

export { REPO_ROOT };

// Barrels only — see docs/block-party-pipeline.md.
const ENTRIES = {
  city: '/src/modules/blockParty/index.js',
  lights: '/src/modules/lightingRig/index.js',
  look: '/src/modules/blockPartyRender/index.js',
  post: '/src/modules/postRig/index.js',
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
    city: pick('city'),
    lights: pick('lights'),
    look: pick('look'),
    post: pick('post'),
  };
}

async function readJsonOption(value) {
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
  return { options: normalizeOptions(kind, raw), typed: providedKeys(args) };
}

export function rollArgs(kernel, { options, typed }) {
  const { city, look } = kernel;
  const scene = new Set(SCENE_KEYS);
  return {
    base: options.base ? city.configFrom(options.base) : {},
    keep: String(options.keep ?? '')
      .split(',')
      .map((facet) => facet.trim())
      .filter(Boolean),
    palettes:
      options.palettes ??
      look.PALETTE_NAMES.filter(
        (name) => (look.paletteStops(name)?.length ?? 0) >= 2
      ),
    pinned: Object.fromEntries(
      [...typed]
        .filter((key) => scene.has(key))
        .map((key) => [key, options[key]])
    ),
  };
}

// What a batch draws at `index`: names follow batch, batch-1, batch-2….
export function cityAt(kernel, { batch, index, roll }) {
  const { city, look } = kernel;
  const name = city.seedFor(batch, index);
  const config = city.rollBlockPartyConfig(name, roll);
  return { config, name, stops: look.paletteStops(config.palette) };
}

// The scene's orthographic isometric camera, fitted to the unzoomed pedestal
// so the seed crop enlarges the city inside the frame exactly as it does in
// the scene.
export function frameView(
  kernel,
  { azimuthOffset = 0, bounds, options, stable = false, view }
) {
  const azimuth = (VIEW_AZIMUTHS[view] + azimuthOffset) * DEG;
  const elevation =
    (view === 'plan' ? 90 : kernel.city.ELEVATION_DEGREES) * DEG;
  const flat = [Math.cos(azimuth), 0, Math.sin(azimuth)];
  const direction =
    view === 'plan'
      ? [0, 1, 0]
      : [
          flat[0] * Math.cos(elevation),
          Math.sin(elevation),
          flat[2] * Math.cos(elevation),
        ];
  const up = view === 'plan' ? [-flat[0], 0, -flat[2]] : [0, 1, 0];
  const distance = bounds.reach * 4;
  const eyeAt = (target) => target.map((v, a) => v + direction[a] * distance);

  const z = direction;
  const x = (() => {
    const c = [
      up[1] * z[2] - up[2] * z[1],
      up[2] * z[0] - up[0] * z[2],
      up[0] * z[1] - up[1] * z[0],
    ];
    const length = Math.hypot(...c) || 1;
    return c.map((v) => v / length);
  })();
  const y = [
    z[1] * x[2] - z[2] * x[1],
    z[2] * x[0] - z[0] * x[2],
    z[0] * x[1] - z[1] * x[0],
  ];
  const { bottom, half, top } = bounds;
  // A moving camera fits the cylinder round the pedestal, so orbiting never
  // changes the zoom.
  const footprint = stable
    ? Array.from({ length: 16 }, (_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        return [
          Math.cos(angle) * half * Math.SQRT2,
          Math.sin(angle) * half * Math.SQRT2,
        ];
      })
    : [
        [-half, -half],
        [half, -half],
        [half, half],
        [-half, half],
      ];
  const corners = footprint.flatMap(([cx, cz]) => [
    [cx, bottom, cz],
    [cx, top, cz],
  ]);
  const along = (axis) =>
    corners.map((c) => c[0] * axis[0] + c[1] * axis[1] + c[2] * axis[2]);
  const xs = along(x);
  const ys = along(y);
  const midX = (Math.max(...xs) + Math.min(...xs)) / 2;
  const midY = (Math.max(...ys) + Math.min(...ys)) / 2;
  const target = [0, 1, 2].map((a) => x[a] * midX + y[a] * midY);
  const aspect = options.width / options.height;
  const spanX = (Math.max(...xs) - Math.min(...xs)) / 2;
  const spanY = (Math.max(...ys) - Math.min(...ys)) / 2;
  const halfHeight = Math.max(spanY, spanX / aspect) / (1 - options.margin * 2);

  return {
    eye: eyeAt(target),
    halfHeight,
    halfWidth: halfHeight * aspect,
    near: distance - bounds.reach * 2,
    far: distance + bounds.reach * 2,
    target,
    up,
  };
}

// One renderer per output size, reused across cities and frames: device and
// pipeline setup dominate a capture, and the rig's materials compile once.
export async function createCityCapturer(
  kernel,
  { height, pixelRatio = 1, samples = 4, shadows = true, width }
) {
  const { THREE, TSL, city, lights, look, post } = kernel;

  // Mirrors the scene: WebGPUCanvas's soft shadows, and useFlatToneMapping.
  const headless = await createHeadlessRenderer({
    configure(renderer) {
      /* eslint-disable no-param-reassign */
      renderer.toneMapping = THREE.NoToneMapping;
      renderer.shadowMap.enabled = shadows;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      /* eslint-enable no-param-reassign */
    },
    height,
    width,
  });
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  const uniforms = look.createCityUniforms();
  const rig = look.createCityRig({ uniforms });
  const chain = post.createPostChain({
    camera,
    passOptions: samples > 0 ? { samples } : {},
    renderer: headless.renderer,
    scene,
    slots: post
      .buildScenePostRuntimeConfig(look.BLOCK_PARTY_POST)
      .slots.filter((slot) => slot.enabled),
  });
  let lightGroup = null;
  let current = null;
  let depthPipeline = null;

  scene.add(rig.group);

  function depthPass() {
    if (depthPipeline) return depthPipeline;
    // An orthographic depth buffer is already linear in view distance.
    const unit = TSL.pass(scene, camera)
      .getTextureNode('depth')
      .r.clamp(0, 1)
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

  function aim(view) {
    camera.left = -view.halfWidth;
    camera.right = view.halfWidth;
    camera.top = view.halfHeight;
    camera.bottom = -view.halfHeight;
    camera.near = view.near;
    camera.far = view.far;
    camera.up.set(...view.up);
    camera.position.set(...view.eye);
    camera.lookAt(...view.target);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }

  function setLights(config) {
    lightGroup?.removeFromParent();
    lightGroup = lights.createSceneLights(
      lights.buildSceneLightingRuntimeConfig({
        controls: config,
        lighting: look.BLOCK_PARTY_LIGHTING,
      }),
      { shadows }
    );
    scene.add(lightGroup);
  }

  function setCells(cells) {
    const { config, model } = current;
    const laid = city.layCity({
      cells,
      colorBy: config.colorBy,
      metrics: city.metricsOf(config),
      model,
    });
    rig.setLayers(laid.layers);
    rig.setGround({
      cells,
      radius: model.radius,
      shape: config.pedestalShape,
    });
    const depth = city.pedestalDepthFor(config, laid.deepest);
    rig.setPedestal({
      depth,
      radius: model.radius,
      shape: config.pedestalShape,
    });
    current.laid = { ...laid, pedestalDepth: depth };
  }

  async function render(pipeline) {
    // The first render after a uniform change reads back stale in Dawn.
    await headless.readFrame(() => pipeline.render());
    return headless.readFrame(() => pipeline.render());
  }

  return {
    // Builds the city and returns the unzoomed bounds a view is framed on.
    load({ config, stops }) {
      const model = city.buildCityModel({
        composition: city.compositionOf(config),
        referenceHeight: config.referenceHeight,
        seed: config.seed,
      });
      const colors = look.applyCityConfig(uniforms, config, stops);
      current = { colors, config, model, stops };
      scene.background = new THREE.Color(colors.backgroundColor);
      rig.setTowerBlend(config.towerBlend);
      rig.setTowerShadows(config.towerShadows);
      rig.setScale(city.cityScale(config, model));
      setCells(model.cells);
      setLights(config);
      chain?.chain.forEach((entry) => entry.update(config, {}));

      const fit = config.citySize / model.rootSize;
      const tallest = current.laid.layers.towers.reduce(
        (max, item) => Math.max(max, item.box[1] + item.box[4]),
        0
      );
      const half = config.citySize / 2;
      const top = tallest * fit;
      const bottom = -current.laid.pedestalDepth * fit;
      return {
        bottom,
        half,
        reach: Math.hypot(half * Math.SQRT2, top - bottom),
        top,
      };
    },

    model: () => current.model,

    setCells,

    async capture(view, { clock, time }) {
      aim(view);
      uniforms.build.value = clock;
      uniforms.time.value = time;
      return render(
        chain?.pipeline ?? {
          render: () => headless.renderer.render(scene, camera),
        }
      );
    },

    async captureDepth(view) {
      aim(view);
      uniforms.build.value = city.SETTLED;
      const frame = await render(depthPass());
      const depths = new Float32Array(frame.width * frame.height);
      for (let i = 0; i < depths.length; i += 1) {
        const unit = (frame.data[i * 4] * 256 + frame.data[i * 4 + 1]) / 65535;
        depths[i] = view.near + unit * (view.far - view.near);
      }
      return { data: depths, height: frame.height, width: frame.width };
    },

    // A hidden-line test in output pixels. The farthest of a 3×3 patch is
    // used so an edge is not hidden by the face it bounds.
    depthProbe(depth) {
      const clampTo = (v, max) => Math.min(Math.max(v, 0), max - 1);
      return (x, y, z) => {
        const px = Math.round(x * pixelRatio);
        const py = Math.round(y * pixelRatio);
        let farthest = -Infinity;
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            const sx = clampTo(px + dx, depth.width);
            const sy = clampTo(py + dy, depth.height);
            farthest = Math.max(farthest, depth.data[sy * depth.width + sx]);
          }
        }
        return z <= farthest;
      };
    },

    svg(view, options, visible) {
      const { colors, config, laid, model, stops } = current;
      return city.renderBlockPartySvg({
        camera: view,
        colors,
        config,
        height: options.height,
        layers: laid.layers,
        pedestal: {
          depth: laid.pedestalDepth,
          radius: model.radius,
          shape: config.pedestalShape,
        },
        scale: city.cityScale(config, model),
        stops,
        stroke: options.svgStroke,
        visible,
        width: options.width,
      });
    },

    dispose() {
      rig.dispose();
      headless.dispose();
    },
  };
}

export async function withCapturer(kernel, options, work) {
  const capturer = await runStage(
    `initializing WebGPU renderer (${options.width * options.pixelRatio}x${
      options.height * options.pixelRatio
    })`,
    () =>
      createCityCapturer(kernel, {
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

export async function encodeFrame(frame, format) {
  const image = sharp(frame.data, {
    raw: { channels: 4, height: frame.height, width: frame.width },
  });
  if (format === 'webp') return image.webp({ lossless: true }).toBuffer();
  return image.png().toBuffer();
}

export function sidecarFor({ config, name, options }) {
  return {
    name,
    preset: config,
    render: { ...options, base: undefined, palettes: undefined },
  };
}
