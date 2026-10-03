/* eslint-disable no-param-reassign */
import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { PRESETS } from '@components/scenes/WebGPU/SubdivisionRelief/presets/presets';
import CAMERA from '@components/scenes/WebGPU/SubdivisionRelief/utils/camera';
import createCellGeometry, {
  writeCells,
} from '@components/scenes/WebGPU/SubdivisionRelief/utils/cellBuffers';
import createCellMaterial from '@components/scenes/WebGPU/SubdivisionRelief/utils/cellMaterial';
import { OMITTED_KEYS } from '@components/scenes/WebGPU/SubdivisionRelief/utils/controls';
import LIGHTING from '@components/scenes/WebGPU/SubdivisionRelief/utils/lighting';
import { RELIEF_OPTIONS } from '@components/scenes/WebGPU/SubdivisionRelief/utils/reliefOptions';
import { WORLD_SCALE } from '@components/scenes/WebGPU/SubdivisionRelief/utils/world';
import {
  buildSceneLightingRuntimeConfig,
  createSceneLights,
} from '@modules/lightingRig';
import {
  RENDER_OPTIONS,
  SCENE_KEYS,
  SOURCE_IMAGE_MAX,
  buildPiece,
  sceneDefaults,
} from '@modules/subdivision';
import { PALETTE_NONE, getPaletteStops } from '@utils/gradientPalette';

import { PALETTE_OR_NONE, fromSchema, webcamPresets } from '../shared/specs';

const EASE = 3;
const MARGIN = 1.04;
const SHOT = CAMERA.fixed.shots.default.desktop;
const TARGET = new THREE.Vector3(...SHOT.target);
const VIEW_DIRECTION = new THREE.Vector3(...SHOT.position)
  .sub(TARGET)
  .normalize();
const FRAMING = 1.18;

const PIECE_KEYS = SCENE_KEYS.filter(
  (key) =>
    !RENDER_OPTIONS[key].sceneOnly &&
    RENDER_OPTIONS[key].section !== 'video' &&
    !OMITTED_KEYS.includes(key) &&
    key !== 'sourceImage'
);
const RELIEF_KEYS = Object.keys(RELIEF_OPTIONS);
const OPTIONS = {
  ...fromSchema(RENDER_OPTIONS, PIECE_KEYS),
  ...RELIEF_OPTIONS,
  seed: { ...RENDER_OPTIONS.seed, default: 'relief' },
};

const SECTIONS = [
  ['structure', 'Structure', PIECE_KEYS],
  ['field', 'Field', PIECE_KEYS],
  ['palette', 'Palette', PIECE_KEYS],
  ['relief', 'Relief', RELIEF_KEYS],
  ['motion', 'Motion', RELIEF_KEYS],
  ['output', 'Seed', PIECE_KEYS],
].map(([section, title, keys]) => ({
  keys: keys.filter((key) => OPTIONS[key].section === section),
  title,
}));

function createMotion() {
  return {
    base: uniform(0),
    depth: uniform(0),
    depthBias: uniform(1),
    gap: uniform(0),
    maxDepth: uniform(1),
    mix: uniform(0),
    noiseAmount: uniform(0),
    noisePhase: uniform(0),
    noiseScale: uniform(1),
    roughness: uniform(0.5),
    waveAmount: uniform(0),
    waveLength: uniform(1),
    waveOrigin: uniform(new THREE.Vector2()),
    wavePhase: uniform(0),
  };
}

function stepMotion(u, c, piece, dt) {
  const { canvas, focal, maxDepth } = piece;
  u.mix.value +=
    ((c.animate ? 1 : 0) - u.mix.value) * (1 - Math.exp(-EASE * dt));
  if (u.mix.value > 1e-3) {
    u.noisePhase.value += dt * c.motionNoiseSpeed;
    u.wavePhase.value += dt * c.motionWaveSpeed;
  }
  u.base.value = c.baseHeight;
  u.depth.value = c.motionDepth;
  u.depthBias.value = c.depthBias;
  u.gap.value = c.cellGap;
  u.maxDepth.value = maxDepth;
  u.noiseAmount.value = c.motionNoiseAmount;
  u.noiseScale.value = c.motionNoiseScale;
  u.roughness.value = c.roughness;
  u.waveAmount.value = c.motionWaveAmount;
  u.waveLength.value = c.motionWaveLength;
  const [fx, fy] =
    c.motionWaveOrigin === 'focal' && focal.length ? focal[0] : [0.5, 0.5];
  u.waveOrigin.value.set(
    (fx - 0.5) * canvas.width * WORLD_SCALE,
    (0.5 - fy) * canvas.height * WORLD_SCALE
  );
}

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
    const grow = uniform(0);
    const motion = createMotion();
    const material = createCellMaterial({ grow, motion });
    const plateMaterial = new THREE.MeshStandardMaterial();
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), plateMaterial);
    plate.position.z = -0.002;
    plate.receiveShadow = true;
    scene.add(plate);
    scene.add(
      createSceneLights(
        buildSceneLightingRuntimeConfig({ controls: {}, lighting: LIGHTING }),
        { shadows: true }
      )
    );
    let cells = null;
    let geometry = null;
    let capacity = 1024;
    let lattice = null;
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

    const ensureGeometry = (count, nextLattice) => {
      while (capacity < count) capacity *= 2;
      if (
        geometry &&
        lattice === nextLattice &&
        geometry.userData.capacity >= capacity
      ) {
        return;
      }
      if (cells) scene.remove(cells);
      geometry?.dispose();
      geometry = createCellGeometry(capacity, nextLattice);
      geometry.userData.capacity = capacity;
      lattice = nextLattice;
      cells = new THREE.Mesh(geometry, material);
      Object.assign(cells, {
        castShadow: true,
        frustumCulled: false,
        receiveShadow: true,
      });
      scene.add(cells);
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
          const built = buildPiece(config, {
            canvas: size,
            image: frame.pixels(SOURCE_IMAGE_MAX),
            stops,
          });
          piece = {
            ...built,
            maxDepth: built.nodes.reduce(
              (d, node) => Math.max(d, node.depth),
              0
            ),
          };
          ensureGeometry(piece.nodes.length, config.lattice);
          writeCells(geometry, piece, config);
          scene.background = new THREE.Color(config.bgColor);
          plateMaterial.color.set(config.plateColor);
          plateMaterial.roughness = config.roughness;
          plate.scale.set(
            size.width * WORLD_SCALE * MARGIN,
            size.height * WORLD_SCALE * MARGIN,
            1
          );
        }
        grow.value = piece.maxDepth + 1;
        stepMotion(motion, config, piece, dt);

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
        motion.mix.value = 0;
        motion.noisePhase.value = 0;
        motion.wavePhase.value = 0;
      },
      dispose() {
        geometry?.dispose();
        material.dispose();
        plateMaterial.dispose();
        plate.geometry.dispose();
      },
    };
  },
};
