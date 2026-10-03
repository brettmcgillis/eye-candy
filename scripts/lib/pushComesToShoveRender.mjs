/* eslint-disable import/no-extraneous-dependencies */
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

import {
  RENDER_OPTIONS,
  SCENE_KEYS,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/pushComesToShove/renderOptions.mjs';
import { parseArgs, providedKeys } from './cliArgs.mjs';
import { createHeadlessRenderer, loadThree } from './headlessWebgpu.mjs';
import loadModules, { REPO_ROOT } from './loadModules.mjs';
import { runStage } from './progress.mjs';

export { REPO_ROOT };

// Barrels only — see docs/push-comes-to-shove-pipeline.md.
const ENTRIES = {
  lights: '/src/modules/lightingRig/index.js',
  look: '/src/modules/pushComesToShoveRender/index.js',
  shove: '/src/modules/pushComesToShove/index.js',
};

// three must see the stubbed browser globals before any module that imports
// it is evaluated, so the renderer bootstrap runs first.
export async function loadKernel() {
  const { THREE, TSL } = await loadThree();
  const loaded = await loadModules(Object.values(ENTRIES));
  const pick = (name) => loaded[ENTRIES[name]];
  return {
    THREE,
    TSL,
    lights: pick('lights'),
    look: pick('look'),
    shove: pick('shove'),
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
  const { look, shove } = kernel;
  const scene = new Set(SCENE_KEYS);
  return {
    base: options.base ? shove.configFrom(options.base) : {},
    keep: String(options.keep ?? '')
      .split(',')
      .map((facet) => facet.trim())
      .filter(Boolean),
    palettes:
      options.palettes ??
      look.PALETTE_NAMES.filter(
        (name) => (look.getPaletteStops(name)?.length ?? 0) >= 3
      ),
    pinned: Object.fromEntries(
      [...typed]
        .filter((key) => scene.has(key))
        .map((key) => [key, options[key]])
    ),
    stopsOf: look.getPaletteStops,
  };
}

// What a batch draws at `index`: names follow batch, batch-1, batch-2…. The
// field takes the output's aspect unless a field size was pinned.
export function panelAt(kernel, { batch, index, options, roll }) {
  const { look, shove } = kernel;
  const name = shove.seedFor(batch, index);
  let config = shove.rollShoveConfig(name, roll);
  const pinnedField =
    'fieldWidth' in roll.pinned || 'fieldHeight' in roll.pinned;
  if (options.fitField && !pinnedField) {
    config = shove.fitField(config, options.width / options.height);
  }
  return { config, name, stops: look.getPaletteStops(config.palette) };
}

// One renderer per output size, reused across panels and frames: device and
// pipeline setup dominate a capture.
export async function createShoveCapturer(
  kernel,
  { height, pixelRatio = 1, samples = 4, shadows = true, width }
) {
  const { THREE, TSL, lights, look, shove } = kernel;

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
  const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
  const passOptions = samples > 0 ? { samples } : {};
  let rig = null;
  let current = null;
  let lightGroup = null;
  let pipeline = null;
  let depthPipeline = null;

  function colorPass() {
    if (!pipeline) {
      pipeline = new THREE.RenderPipeline(renderer);
      pipeline.outputNode = TSL.pass(scene, camera, passOptions);
    }
    return pipeline;
  }

  // Linear depth over two 8-bit channels: one channel is coarser than a wire
  // is thick at this distance.
  function depthPass() {
    if (depthPipeline) return depthPipeline;
    const unit = TSL.pass(scene, camera)
      .getLinearDepthNode()
      .clamp(0, 1)
      .mul(65535);
    const high = unit.div(256).floor();
    depthPipeline = new THREE.RenderPipeline(renderer);
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
    camera.fov = view.fov;
    camera.near = view.near;
    camera.far = view.far;
    camera.up.set(...view.up);
    camera.position.set(...view.eye);
    camera.lookAt(...view.target);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }

  // The first render after a uniform change reads back stale in Dawn.
  async function render(target) {
    await headless.readFrame(() => target.render());
    return headless.readFrame(() => target.render());
  }

  return {
    // A fresh rig per panel: the sim's buffers are sized by the panel.
    load(drawn) {
      current = drawn;
      const { config } = drawn;
      rig?.group.removeFromParent();
      rig?.dispose();
      rig = look.createShoveRig();
      rig.setShadows(shadows);
      rig.apply(config);
      scene.add(rig.group);
      scene.background = new THREE.Color(config.backgroundColor);
      lightGroup?.removeFromParent();
      lightGroup = lights.createSceneLights(
        lights.buildSceneLightingRuntimeConfig({
          controls: config,
          lighting: look.PUSH_LIGHTING,
        }),
        { shadows }
      );
      scene.add(lightGroup);
      pipeline = null;
      depthPipeline = null;
      return rig.layout();
    },

    warm(seconds) {
      rig.warm(renderer, current.config, seconds);
    },

    step(delta) {
      rig.step(renderer, current.config, delta);
    },

    async capture(view) {
      aim(view);
      return render(colorPass());
    },

    async captureDepth(view) {
      aim(view);
      const frame = await render(depthPass());
      const depths = new Float32Array(frame.width * frame.height);
      for (let i = 0; i < depths.length; i += 1) {
        const unit = (frame.data[i * 4] * 256 + frame.data[i * 4 + 1]) / 65535;
        depths[i] = view.near + unit * (view.far - view.near);
      }
      return { data: depths, height: frame.height, width: frame.width };
    },

    // A hidden-line test in output pixels. The farthest of a 3×3 patch is
    // used so a line is not hidden by the surface it lies on.
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

    async svg(view, options, visible) {
      const { config, stops } = current;
      const layout = rig.layout();
      const { bodies, wires } = await rig.readback(renderer);
      return shove.renderShoveSvg({
        bodies,
        camera: view,
        config,
        height: options.height,
        layout,
        outlines: shove.holeOutlines(config, layout),
        stops,
        stroke: options.svgStroke,
        visible,
        width: options.width,
        wires,
      });
    },

    dispose() {
      rig?.dispose();
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
      createShoveCapturer(kernel, {
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
