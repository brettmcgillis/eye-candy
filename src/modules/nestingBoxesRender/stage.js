import { pass, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  buildSceneLightingRuntimeConfig,
  createSceneLights,
} from '@modules/lightingRig';
import {
  SCENE_KEYS,
  VIEW_AZIMUTHS,
  VIEW_ELEVATION,
  configFrom,
  levelBounds,
  renderNestingBoxesSvg,
  rollNestingBoxesConfig,
  seedFor,
  treeBounds,
  treeLevel,
} from '@modules/nestingBoxes';
import { buildScenePostRuntimeConfig, createPostChain } from '@modules/postRig';
import { setBackdrop } from '@modules/renderStage/capture';
import { PALETTE_NAMES, getPaletteStops } from '@utils/gradientPalette';

import NESTING_BOXES_CAMERA from './camera';
import createFog from './fog';
import NESTING_BOXES_LIGHTING from './lighting';
import NESTING_BOXES_POST from './post';
import createBoxRig from './rig';
import { MAP_SLOTS, SURFACES, configureSurfaceTexture } from './surfaces';

const DEG = Math.PI / 180;
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
    backdrop: options.backdrop,
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
export function treeAt({ batch, index, roll }) {
  const name = seedFor(batch, index);
  const config = rollNestingBoxesConfig(name, roll);
  return { config, name, stops: getPaletteStops(config.paletteName) };
}

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

// `loadImage(url)` decodes a surface map to top-down RGBA (sharp in the CLI,
// a canvas in the page); useTexture's images load with flipY, and a
// DataTexture's first row is v = 0, so the rows are flipped to match.
function createSurfaceLoader(loadImage) {
  const cache = new Map();
  const load = (url) => {
    if (!cache.has(url)) {
      cache.set(
        url,
        loadImage(url).then(({ data, height, width }) => {
          const row = width * 4;
          const flipped = new Uint8Array(row * height);
          for (let y = 0; y < height; y += 1) {
            flipped.set(
              data.subarray((height - 1 - y) * row, (height - y) * row),
              y * row
            );
          }
          const texture = new THREE.DataTexture(flipped, width, height);
          texture.generateMipmaps = true;
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.needsUpdate = true;
          return texture;
        })
      );
    }
    return cache.get(url);
  };

  return {
    async maps(surface) {
      const urls = SURFACES[surface] ?? {};
      const entries = await Promise.all(
        MAP_SLOTS.filter((slot) => urls[slot]).map(async (slot) => {
          const texture = await load(urls[slot]);
          configureSurfaceTexture(texture, slot);
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

// The tree stage the CLI renders headlessly and the Live tab renders on a
// canvas, mirroring the scene's canvas: ACES tone mapping and soft shadows.
export function createTreeStage({
  height,
  loadImage,
  pixelRatio = 1,
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
  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  const rig = createBoxRig();
  const fog = createFog();
  const surfaces = createSurfaceLoader(loadImage);
  const sceneCamera = NESTING_BOXES_CAMERA.orbit.desktop;
  const sceneDistance = Math.hypot(
    ...sub(sceneCamera.position, sceneCamera.target)
  );
  const plain = new THREE.RenderPipeline(renderer);
  plain.outputNode = pass(scene, camera, samples > 0 ? { samples } : {});

  let current = null;
  let lightGroup = null;
  let chain = null;
  let chainKey = null;
  let depthPipeline = null;

  scene.add(rig.mesh);

  function setLights(config) {
    lightGroup?.removeFromParent();
    lightGroup = createSceneLights(
      buildSceneLightingRuntimeConfig({
        controls: config,
        lighting: NESTING_BOXES_LIGHTING,
      }),
      { shadows }
    );
    scene.add(lightGroup);
  }

  function setPost(config) {
    const slots = buildScenePostRuntimeConfig(
      NESTING_BOXES_POST,
      config
    ).slots.filter((slot) => slot.enabled);
    const key = JSON.stringify(slots.map((slot) => slot.id));
    if (key !== chainKey) {
      chainKey = key;
      chain =
        slots.length > 0
          ? createPostChain({
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
    const unit = pass(scene, camera)
      .getLinearDepthNode()
      .clamp(0, 1)
      .mul(65535);
    const high = unit.div(256).floor();
    depthPipeline = new THREE.RenderPipeline(renderer);
    depthPipeline.outputColorTransform = false;
    depthPipeline.outputNode = vec4(
      high.div(255),
      unit.sub(high.mul(256)).floor().div(255),
      0,
      1
    );
    return depthPipeline;
  }

  const render = (pipeline) =>
    readFrame(() => {
      rig.compute(renderer);
      pipeline.render();
    });

  return {
    // Loads a tree and returns the bounds views are framed on: `settled` is
    // the finished tree, `all` every level, so a growing tree never leaves
    // the frame.
    async load({ config, stops }) {
      current = { config, stops };
      rig.setPalette(config.paletteName, config.paletteExact);
      rig.setSurfaceMaps(await surfaces.maps(config.surface));
      setBackdrop({ renderer, scene }, config.background, transparent);
      scene.fogNode = config.fogEnabled ? fog.node : null;
      setLights(config);
      setPost(config);
      return {
        all: treeBounds(config),
        settled: levelBounds(treeLevel(config)),
      };
    },

    capture(view, { drift, progress } = {}) {
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
      return renderNestingBoxesSvg({
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
      plain.dispose();
      depthPipeline?.dispose();
      await surfaces.dispose();
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
export async function settleBackdrop(stage, drawn, { options, roll }) {
  if (
    options.backdrop !== 'contrast' ||
    roll.keep.includes('atmosphere') ||
    roll.pinned.background != null
  ) {
    return drawn;
  }
  const bounds = await stage.load(drawn);
  const frame = await stage.capture(
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
