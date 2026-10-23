import { pass, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  buildSceneLightingRuntimeConfig,
  createSceneLights,
} from '@modules/lightingRig';
import {
  SCENE_KEYS,
  configFrom,
  fitField,
  holeOutlines,
  renderShoveSvg,
  rollShoveConfig,
  seedFor,
} from '@modules/pushComesToShove';
import { setBackdrop } from '@modules/renderStage/capture';
import { PALETTE_NAMES, getPaletteStops } from '@utils/gradientPalette';

import PUSH_LIGHTING from './lighting';
import createShoveRig from './rig';

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
      PALETTE_NAMES.filter((name) => (getPaletteStops(name)?.length ?? 0) >= 3),
    pinned: Object.fromEntries(
      [...typed]
        .filter((key) => scene.has(key))
        .map((key) => [key, options[key]])
    ),
    stopsOf: getPaletteStops,
  };
}

// What a batch draws at `index`: names follow batch, batch-1, batch-2…. The
// field takes the output's aspect unless a field size was pinned.
export function panelAt({ batch, index, options, roll }) {
  const name = seedFor(batch, index);
  let config = rollShoveConfig(name, roll);
  const pinnedField =
    'fieldWidth' in roll.pinned || 'fieldHeight' in roll.pinned;
  if (options.fitField && !pinnedField) {
    config = fitField(config, options.width / options.height);
  }
  return { config, name, stops: getPaletteStops(config.palette) };
}

// The panel stage the CLI renders headlessly and the Live tab renders on a
// canvas, mirroring the scene's canvas: ACES tone mapping and soft shadows.
export function createShoveStage({
  height,
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
      pipeline.outputNode = pass(scene, camera, passOptions);
    }
    return pipeline;
  }

  // Linear depth over two 8-bit channels: one channel is coarser than a wire
  // is thick at this distance.
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

  return {
    // A fresh rig per panel: the sim's buffers are sized by the panel.
    load(drawn) {
      current = drawn;
      const { config } = drawn;
      rig?.group.removeFromParent();
      rig?.dispose();
      rig = createShoveRig();
      rig.setShadows(shadows);
      rig.apply(config);
      scene.add(rig.group);
      setBackdrop({ renderer, scene }, config.backgroundColor, transparent);
      lightGroup?.removeFromParent();
      lightGroup = createSceneLights(
        buildSceneLightingRuntimeConfig({
          controls: config,
          lighting: PUSH_LIGHTING,
        }),
        { shadows }
      );
      scene.add(lightGroup);
      pipeline?.dispose();
      depthPipeline?.dispose();
      pipeline = null;
      depthPipeline = null;
      return rig.layout();
    },

    warm(seconds) {
      rig.warm(renderer, current.config, seconds);
    },

    settle(options) {
      rig.warm(renderer, current.config, options.warmup);
    },

    step(delta) {
      rig.step(renderer, current.config, delta);
    },

    capture(view) {
      aim(view);
      return readFrame(() => colorPass().render());
    },

    async captureDepth(view) {
      aim(view);
      const frame = await readFrame(() => depthPass().render());
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
      return renderShoveSvg({
        bodies,
        camera: view,
        config,
        height: options.height,
        layout,
        outlines: holeOutlines(config, layout),
        stops,
        stroke: options.svgStroke,
        visible,
        width: options.width,
        wires,
      });
    },

    dispose() {
      rig?.dispose();
      pipeline?.dispose();
      depthPipeline?.dispose();
    },
  };
}
