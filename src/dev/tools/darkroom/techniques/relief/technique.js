import * as THREE from 'three/webgpu';

import { PRESETS } from '@components/scenes/WebGPU/SubdivisionRelief/presets/presets';
import {
  buildSceneLightingRuntimeConfig,
  createSceneLights,
} from '@modules/lightingRig';
import {
  SCENE_NAMES,
  SCENE_OPTIONS,
  SOURCE_IMAGE_MAX,
  WORLD_SCALE,
  buildReliefPiece,
  sceneDefaults,
} from '@modules/subdivisionRelief';
import {
  SUBDIVISION_RELIEF_CAMERA as CAMERA,
  SUBDIVISION_RELIEF_LIGHTING as LIGHTING,
  PALETTE_NONE,
  createReliefRig,
  getPaletteStops,
} from '@modules/subdivisionReliefRender';

import { PALETTE_OR_NONE, fromSchema, webcamPresets } from '../shared/specs';

const EASE = 3;
const SHOT = CAMERA.fixed.shots.default.desktop;
const TARGET = new THREE.Vector3(...SHOT.target);
const VIEW_DIRECTION = new THREE.Vector3(...SHOT.position)
  .sub(TARGET)
  .normalize();
const FRAMING = 1.18;

const KEYS = SCENE_NAMES.filter(
  (key) =>
    !SCENE_OPTIONS[key].sceneOnly &&
    SCENE_OPTIONS[key].section !== 'loop' &&
    key !== 'sourceImage'
);
const OPTIONS = {
  ...fromSchema(SCENE_OPTIONS, KEYS),
  seed: { ...SCENE_OPTIONS.seed, default: 'relief' },
};

const SECTIONS = [
  ['structure', 'Structure'],
  ['field', 'Field'],
  ['palette', 'Palette'],
  ['relief', 'Relief'],
  ['motion', 'Motion'],
  ['output', 'Seed'],
].map(([section, title]) => ({
  keys: KEYS.filter((key) => OPTIONS[key].section === section),
  title,
}));

export default {
  animated: (options) => options.animate,
  choices: { palette: PALETTE_OR_NONE },
  defaultPreset: 'Webcam Squares',
  description:
    'Subdivision cells raised as prisms: height from depth, brightness or the field, with noise and wave motion.',
  engine: 'webgpu',
  id: 'relief',
  inputs: ['still', 'video', 'live'],
  label: 'Subdivision Relief',
  options: OPTIONS,
  order: 15,
  presets: webcamPresets(PRESETS),
  sections: SECTIONS,

  create(stage) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(SHOT.fov, 1, 0.05, 200);
    const rig = createReliefRig();
    const motion = { mix: 0, noisePhase: 0, wavePhase: 0 };
    scene.add(rig.group);
    scene.add(
      createSceneLights(
        buildSceneLightingRuntimeConfig({ controls: {}, lighting: LIGHTING }),
        { shadows: true }
      )
    );
    let piece = null;
    let planned = '';
    let ready = null;

    const init = async () => {
      const { renderer } = await stage.gpu();
      Object.assign(renderer, { toneMapping: THREE.ACESFilmicToneMapping });
      Object.assign(renderer.shadowMap, {
        enabled: true,
        type: THREE.PCFSoftShadowMap,
      });
      return renderer;
    };

    return {
      async render({ dt, frame, options, size }) {
        ready = ready ?? init();
        const renderer = await ready;
        const config = { ...sceneDefaults(), ...options, ...size };
        const key = `${frame.version}|${JSON.stringify(config)}`;
        if (key !== planned) {
          planned = key;
          const stops =
            config.palette === PALETTE_NONE
              ? null
              : getPaletteStops(config.palette);
          piece = buildReliefPiece(config, {
            canvas: size,
            image: frame.pixels(SOURCE_IMAGE_MAX),
            stops,
          });
          rig.apply(config);
          rig.setPiece(piece);
          scene.background = new THREE.Color(config.bgColor);
        }
        rig.setGrow(piece.maxDepth + 1);
        motion.mix +=
          ((config.animate ? 1 : 0) - motion.mix) * (1 - Math.exp(-EASE * dt));
        if (motion.mix > 1e-3) {
          motion.noisePhase += dt * config.motionNoiseSpeed;
          motion.wavePhase += dt * config.motionWaveSpeed;
        }
        rig.setMotion(motion);

        const half = (SHOT.fov * Math.PI) / 360;
        const aspect = size.width / size.height;
        const horizontal = Math.atan(Math.tan(half) * aspect);
        const distance =
          Math.max(
            (size.height * WORLD_SCALE) / 2 / Math.tan(half),
            (size.width * WORLD_SCALE) / 2 / Math.tan(horizontal)
          ) * FRAMING;
        camera.aspect = aspect;
        camera.position
          .copy(VIEW_DIRECTION)
          .multiplyScalar(distance)
          .add(TARGET);
        camera.lookAt(TARGET);
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);
      },
      reset() {
        planned = '';
        Object.assign(motion, { mix: 0, noisePhase: 0, wavePhase: 0 });
      },
      dispose() {
        rig.dispose();
      },
    };
  },
};
