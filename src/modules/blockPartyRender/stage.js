import { pass, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  ELEVATION_DEGREES,
  SCENE_KEYS,
  SETTLED,
  VIEW_AZIMUTHS,
  buildCityModel,
  cityScale,
  compositionOf,
  configFrom,
  layCity,
  metricsOf,
  pedestalDepthFor,
  renderBlockPartySvg,
  rollBlockPartyConfig,
  seedFor,
} from '@modules/blockParty';
import {
  buildSceneLightingRuntimeConfig,
  createSceneLights,
} from '@modules/lightingRig';
import { buildScenePostRuntimeConfig, createPostChain } from '@modules/postRig';
import { setBackdrop } from '@modules/renderStage/capture';

import BLOCK_PARTY_LIGHTING from './lighting';
import paletteStops, { PALETTE_NAMES } from './paletteStops';
import BLOCK_PARTY_POST from './post';
import createCityRig from './rig';
import { applyCityConfig, createCityUniforms } from './uniforms';

const DEG = Math.PI / 180;

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
      PALETTE_NAMES.filter((name) => (paletteStops(name)?.length ?? 0) >= 2),
    pinned: Object.fromEntries(
      [...typed]
        .filter((key) => scene.has(key))
        .map((key) => [key, options[key]])
    ),
  };
}

// What a batch draws at `index`: names follow batch, batch-1, batch-2….
export function cityAt({ batch, index, roll }) {
  const name = seedFor(batch, index);
  const config = rollBlockPartyConfig(name, roll);
  return { config, name, stops: paletteStops(config.palette) };
}

// The scene's orthographic isometric camera, fitted to the unzoomed pedestal
// so the seed crop enlarges the city inside the frame exactly as it does in
// the scene.
export function frameView({
  azimuthOffset = 0,
  bounds,
  options,
  stable = false,
  view,
}) {
  const azimuth = (VIEW_AZIMUTHS[view] + azimuthOffset) * DEG;
  const elevation = (view === 'plan' ? 90 : ELEVATION_DEGREES) * DEG;
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
    projection: 'orthographic',
    target,
    up,
  };
}

// The city stage the CLI renders headlessly and the Live tab renders on a
// canvas, mirroring the scene: soft shadows and flat tone mapping.
export function createCityStage({
  pixelRatio = 1,
  readFrame,
  renderer,
  samples = 4,
  shadows = true,
  transparent = false,
}) {
  /* eslint-disable no-param-reassign */
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  /* eslint-enable no-param-reassign */
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  const uniforms = createCityUniforms();
  const rig = createCityRig({ uniforms });
  const chain = createPostChain({
    camera,
    passOptions: samples > 0 ? { samples } : {},
    renderer,
    scene,
    slots: buildScenePostRuntimeConfig(BLOCK_PARTY_POST).slots.filter(
      (slot) => slot.enabled
    ),
  });
  let lightGroup = null;
  let current = null;
  let depthPipeline = null;
  let elapsed = 0;

  scene.add(rig.group);

  function depthPass() {
    if (depthPipeline) return depthPipeline;
    // An orthographic depth buffer is already linear in view distance.
    const unit = pass(scene, camera)
      .getTextureNode('depth')
      .r.clamp(0, 1)
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
    lightGroup = createSceneLights(
      buildSceneLightingRuntimeConfig({
        controls: config,
        lighting: BLOCK_PARTY_LIGHTING,
      }),
      { shadows }
    );
    scene.add(lightGroup);
  }

  function setCells(cells) {
    const { config, model } = current;
    const laid = layCity({
      cells,
      colorBy: config.colorBy,
      metrics: metricsOf(config),
      model,
    });
    rig.setLayers(laid.layers);
    rig.setGround({
      cells,
      radius: model.radius,
      shape: config.pedestalShape,
    });
    const depth = pedestalDepthFor(config, laid.deepest);
    rig.setPedestal({
      depth,
      radius: model.radius,
      shape: config.pedestalShape,
    });
    current.laid = { ...laid, pedestalDepth: depth };
  }

  return {
    // Builds the city and returns the unzoomed bounds a view is framed on.
    load({ config, stops }) {
      const model = buildCityModel({
        composition: compositionOf(config),
        referenceHeight: config.referenceHeight,
        seed: config.seed,
      });
      const colors = applyCityConfig(uniforms, config, stops);
      current = { colors, config, model, stops };
      setBackdrop({ renderer, scene }, colors.backgroundColor, transparent);
      rig.setTowerBlend(config.towerBlend);
      rig.setTowerShadows(config.towerShadows);
      rig.setScale(cityScale(config, model));
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

    // The Live tab's clock; a CLI frame passes its own `time`.
    step(delta) {
      elapsed += delta;
    },

    capture(view, { clock = SETTLED, time = elapsed } = {}) {
      aim(view);
      uniforms.build.value = clock;
      uniforms.time.value = time;
      return readFrame(() =>
        chain ? chain.pipeline.render() : renderer.render(scene, camera)
      );
    },

    async captureDepth(view) {
      aim(view);
      uniforms.build.value = SETTLED;
      const frame = await readFrame(() => depthPass().render());
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
      return renderBlockPartySvg({
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
        scale: cityScale(config, model),
        stops,
        stroke: options.svgStroke,
        visible,
        width: options.width,
      });
    },

    dispose() {
      rig.dispose();
      chain?.pipeline.dispose?.();
      depthPipeline?.dispose();
    },
  };
}
