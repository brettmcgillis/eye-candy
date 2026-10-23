import { pass, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  SCENE_KEYS,
  VIEW_ANGLES,
  buildSpecimen,
  configFrom,
  randomSeed,
  renderFungiSvg,
  rollFungiConfig,
  sceneNameFor,
  seedFor,
  stillLevels,
} from '@modules/fungi';
import {
  buildSceneLightingRuntimeConfig,
  createSceneLights,
} from '@modules/lightingRig';
import { setBackdrop } from '@modules/renderStage/capture';

import FUNGI_LIGHTING from './lighting';
import createSpecimenPost from './post';
import createSpecimenRig from './rig';

const DEG = Math.PI / 180;

export function rollArgs({ options, typed }) {
  const scene = new Set(SCENE_KEYS);
  return {
    base: options.base ? configFrom(options.base) : {},
    keep: String(options.keep ?? '')
      .split(',')
      .map((facet) => facet.trim())
      .filter(Boolean),
    pinned: Object.fromEntries(
      [...typed]
        .filter((key) => scene.has(key))
        .map((key) => [sceneNameFor(key), options[key]])
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
export function specimenAt({ index, options, roll }) {
  const baseSeed = options.batch ?? randomSeed();
  const seed = options.batch == null ? baseSeed : seedFor(baseSeed, index);
  const config = rollFungiConfig(seed, roll);
  return { config, seed, specimen: buildSpecimen(config) };
}

// Camera placement for a view, framing the fitted specimen's box. `levels`
// runs the reaction field out to the still's growth level.
export function frameView({ azimuthOffset = 0, bounds, options, view }) {
  const [azimuth, elevation] = VIEW_ANGLES[view] ?? [20, 6];
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

export const stillLevelsFor = (options) => (specimen) =>
  stillLevels(specimen, { grow: options.grow, rot: options.rot });

// The specimen stage the CLI renders headlessly and the Live tab renders on
// a canvas, mirroring WebGPUCanvas: ACES tone mapping and PCF soft shadows.
// A view carries `levels(specimen)`, the growth it is drawn at.
export function createFungiStage({
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
  const camera = new THREE.PerspectiveCamera(30, width / height, 0.05, 400);
  const { post, setGlow } = createSpecimenPost(renderer, scene, camera, {
    samples,
  });
  const rig = createSpecimenRig();
  rig.setRenderer(renderer);
  scene.add(rig.group);
  let lightGroup = null;
  let lightKey = null;
  let current = null;
  let depthPipeline = null;

  // Linear depth across two 8-bit channels: one channel over the frustum
  // quantises far coarser than a fibre is thick.
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

  function aim({ eye, fov, levels, target }) {
    // A still runs the reaction field out to the iteration count its growth
    // level calls for, so a batch is repeatable.
    rig.setLevels(levels(current.specimen), { catchUp: true });
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
    lightGroup = createSceneLights(
      buildSceneLightingRuntimeConfig({
        controls: config,
        lighting: FUNGI_LIGHTING,
      }),
      { shadows }
    );
    scene.add(lightGroup);
    setBackdrop({ renderer, scene }, config.backgroundColor, transparent);
  }

  return {
    load(drawn) {
      const { config, specimen } = drawn;
      current = drawn;
      rig.load(specimen);
      rig.setConfig(config);
      setGlow(specimen.genome.glow);
      setLights(config);
      return rig.bounds();
    },

    capture(view) {
      aim(view);
      return readFrame(() => post.render());
    },

    // World-space depth per output pixel, for the SVG's hidden-line test.
    async captureDepth(view) {
      aim(view);
      const frame = await readFrame(() => depthPass().render());
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

    // The vector twin of a capture: the same specimen at the same levels,
    // projected as centrelines, with what the render hides removed.
    svg(view, options, visible = null) {
      const { config, specimen } = current;
      return renderFungiSvg({
        background: config.backgroundColor,
        camera: view,
        height: options.height,
        levels: view.levels(specimen),
        matrix: rig.matrix(),
        specimen,
        sporeAmount: config.sporeAmount ?? 1,
        stroke: options.svgStroke,
        visible,
        width: options.width,
      });
    },

    dispose() {
      rig.dispose();
      depthPipeline?.dispose();
    },
  };
}
