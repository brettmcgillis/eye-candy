/* eslint-disable import/no-extraneous-dependencies */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

import {
  RENDER_OPTIONS,
  SCENE_KEYS,
  VIEW_AZIMUTHS,
  VIEW_ELEVATION,
  defaultsFor,
  normalizeOptions,
} from '../../src/modules/nestingBoxes/renderOptions.mjs';
import { parseArgs, providedKeys } from './cliArgs.mjs';
import { createHeadlessRenderer, loadThree } from './headlessWebgpu.mjs';
import loadModules, { REPO_ROOT } from './loadModules.mjs';
import { runStage } from './progress.mjs';

export { REPO_ROOT };

// Barrels only — see docs/nesting-boxes-pipeline.md.
const ENTRIES = {
  boxes: '/src/modules/nestingBoxes/index.js',
  lights: '/src/modules/lightingRig/index.js',
  look: '/src/modules/nestingBoxesRender/index.js',
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
    boxes: pick('boxes'),
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
  const { boxes, look } = kernel;
  const scene = new Set(SCENE_KEYS);
  return {
    backdrop: options.backdrop,
    base: options.base ? boxes.configFrom(options.base) : {},
    keep: String(options.keep ?? '')
      .split(',')
      .map((facet) => facet.trim())
      .filter(Boolean),
    palettes:
      options.palettes ??
      look.PALETTE_NAMES.filter(
        (name) => (look.getPaletteStops(name)?.length ?? 0) >= 2
      ),
    pinned: Object.fromEntries(
      [...typed]
        .filter((key) => scene.has(key))
        .map((key) => [key, options[key]])
    ),
  };
}

// What a batch draws at `index`: names follow batch, batch-1, batch-2….
export function treeAt(kernel, { batch, index, roll }) {
  const { boxes, look } = kernel;
  const name = boxes.seedFor(batch, index);
  const config = boxes.rollNestingBoxesConfig(name, roll);
  return { config, name, stops: look.getPaletteStops(config.paletteName) };
}

const sub = (a, b) => a.map((v, i) => v - b[i]);
const dotOf = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const normalize = (v) => {
  const length = Math.hypot(...v) || 1;
  return v.map((c) => c / length);
};
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

// A perspective camera on the view's bearing, pulled back until the tree's
// bounds fit. A moving camera fits the bounding sphere instead, so orbiting
// never changes the zoom.
export function frameView({
  azimuthOffset = 0,
  bounds,
  options,
  stable = false,
  view,
}) {
  const azimuth = (VIEW_AZIMUTHS[view] + azimuthOffset) * DEG;
  const elevation = VIEW_ELEVATION * DEG;
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

// useTexture's images load with flipY; a DataTexture's first row is v = 0,
// so the pixels are flipped to land the same way up.
function createSurfaceLoader(THREE, look) {
  const cache = new Map();
  const load = (url) => {
    if (!cache.has(url)) {
      const file = path.join(REPO_ROOT, 'public', url.replace(/^\//u, ''));
      cache.set(
        url,
        sharp(file)
          .flip()
          .ensureAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true })
          .then(({ data, info }) => {
            const texture = new THREE.DataTexture(
              new Uint8Array(data),
              info.width,
              info.height
            );
            texture.generateMipmaps = true;
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
            return texture;
          })
      );
    }
    return cache.get(url);
  };

  return {
    async maps(surface) {
      const urls = look.SURFACES[surface] ?? {};
      const entries = await Promise.all(
        look.MAP_SLOTS.filter((slot) => urls[slot]).map(async (slot) => {
          const texture = await load(urls[slot]);
          look.configureSurfaceTexture(texture, slot);
          return [slot, texture];
        })
      );
      return Object.fromEntries(entries);
    },
    async dispose() {
      (await Promise.all(cache.values())).forEach((t) => t.dispose());
    },
  };
}

// One renderer per output size, reused across trees and frames: device and
// pipeline setup dominate a capture, and the box material compiles once.
export async function createTreeCapturer(
  kernel,
  { height, pixelRatio = 1, samples = 4, shadows = true, width }
) {
  const { THREE, TSL, boxes, lights, look, post } = kernel;

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
  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  const rig = look.createBoxRig();
  const fog = look.createFog();
  const surfaces = createSurfaceLoader(THREE, look);
  const sceneCamera = look.NESTING_BOXES_CAMERA.orbit.desktop;
  const sceneDistance = Math.hypot(
    ...sub(sceneCamera.position, sceneCamera.target)
  );
  const plain = new THREE.RenderPipeline(renderer);
  plain.outputNode = TSL.pass(scene, camera, samples > 0 ? { samples } : {});

  let current = null;
  let lightGroup = null;
  let chain = null;
  let chainKey = null;
  let depthPipeline = null;

  scene.add(rig.mesh);

  function setLights(config) {
    lightGroup?.removeFromParent();
    lightGroup = lights.createSceneLights(
      lights.buildSceneLightingRuntimeConfig({
        controls: config,
        lighting: look.NESTING_BOXES_LIGHTING,
      }),
      { shadows }
    );
    scene.add(lightGroup);
  }

  function setPost(config) {
    const slots = post
      .buildScenePostRuntimeConfig(look.NESTING_BOXES_POST, config)
      .slots.filter((slot) => slot.enabled);
    const key = JSON.stringify(slots.map((slot) => slot.id));
    if (key !== chainKey) {
      chainKey = key;
      chain =
        slots.length > 0
          ? post.createPostChain({
              camera,
              lights: {
                key: lightGroup.children.find((l) => l.isDirectionalLight),
              },
              passOptions: samples > 0 ? { samples } : {},
              renderer,
              scene,
              slots,
            })
          : null;
    }
    chain?.chain.forEach((entry) => entry.update(config, {}));
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
    fog.apply(current.config, view.distance - sceneDistance);
  }

  // Linear depth over two 8-bit channels: one channel over the frustum is
  // coarser than the smaller leaves the hidden-line test has to resolve.
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

  // The first render after a uniform change reads back stale in Dawn.
  async function render(pipeline) {
    const draw = () => {
      rig.compute(renderer);
      pipeline.render();
    };
    await headless.readFrame(draw);
    return headless.readFrame(draw);
  }

  return {
    // Loads a tree and returns the bounds views are framed on: `settled` is
    // the finished tree, `all` every level, so a growing tree never leaves
    // the frame.
    async load({ config, stops }) {
      current = { config, stops };
      rig.setPalette(config.paletteName, config.paletteExact);
      rig.setSurfaceMaps(await surfaces.maps(config.surface));
      scene.background = new THREE.Color(config.background);
      scene.fogNode = config.fogEnabled ? fog.node : null;
      setLights(config);
      setPost(config);
      return {
        all: boxes.treeBounds(config),
        settled: boxes.levelBounds(boxes.treeLevel(config)),
      };
    },

    async capture(view, { drift, progress } = {}) {
      aim(view);
      rig.apply(current.config, { drift, progress });
      return render(chain?.pipeline ?? plain);
    },

    async captureDepth(view) {
      aim(view);
      rig.apply(current.config);
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
      return boxes.renderNestingBoxesSvg({
        camera: view,
        config: current.config,
        height: options.height,
        stops: current.stops,
        stroke: options.svgStroke,
        visible,
        width: options.width,
      });
    },

    async dispose() {
      rig.dispose();
      await surfaces.dispose();
      headless.dispose();
    },
  };
}

// Mean linear luminance of the box pixels in a render on black; below it a
// tree reads as a silhouette, so `contrast` puts it on white instead.
const DARK_BOX_LUMINANCE = 0.01;
const toLinear = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

function boxLuminance(frame) {
  let sum = 0;
  let count = 0;
  for (let i = 0; i < frame.data.length; i += 4) {
    const l =
      0.2126 * toLinear(frame.data[i]) +
      0.7152 * toLinear(frame.data[i + 1]) +
      0.0722 * toLinear(frame.data[i + 2]);
    if (l > 0.0005) {
      sum += l;
      count += 1;
    }
  }
  return count > 0 ? sum / count : 0;
}

// The roll puts `contrast` trees on black; one render of the settled tree
// decides whether it stays there. A set background or a held atmosphere is
// left alone. On white the fog goes off: haze toward white would pale the
// dark tree the switch is rescuing.
export async function settleBackdrop(capturer, drawn, { options, roll }) {
  if (
    options.backdrop !== 'contrast' ||
    roll.keep.includes('atmosphere') ||
    roll.pinned.background != null
  ) {
    return drawn;
  }
  const bounds = await capturer.load(drawn);
  const frame = await capturer.capture(
    frameView({ bounds: bounds.settled, options, view: 'hero' })
  );
  if (boxLuminance(frame) >= DARK_BOX_LUMINANCE) return drawn;
  return {
    ...drawn,
    config: {
      ...drawn.config,
      background: '#ffffff',
      ...(roll.pinned.fogEnabled == null ? { fogEnabled: false } : {}),
    },
  };
}

export async function withCapturer(kernel, options, work) {
  const capturer = await runStage(
    `initializing WebGPU renderer (${options.width * options.pixelRatio}x${
      options.height * options.pixelRatio
    })`,
    () =>
      createTreeCapturer(kernel, {
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
    await capturer.dispose();
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
