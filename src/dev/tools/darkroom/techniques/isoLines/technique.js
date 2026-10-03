import * as THREE from 'three/webgpu';

import {
  RENDER_OPTIONS,
  SCENE_KEYS,
  SOURCE_IMAGE_MAX,
  createIsoBuilder,
  flatView,
  sceneDefaults,
} from '@modules/isoLines';
import { PALETTE_NAMES, createIsoRig } from '@modules/isoLinesRender';

import { choice, fromSchema } from '../shared/specs';

const MOTIONS = ['still', 'flow'];
const SKIPPED = new Set([
  'sourceImage',
  'webcam',
  'webcamFacing',
  'webcamRate',
]);
const SCHEMA_SECTIONS = [
  ['contours', 'Contours'],
  ['image', 'Image'],
  ['field', 'Generators'],
  ['color', 'Colour'],
];
// Line widths are output px at a 1080-tall frame, so a small preview and a
// large export draw the same piece.
const REFERENCE_HEIGHT = 1080;

const KEYS = SCENE_KEYS.filter(
  (key) =>
    !RENDER_OPTIONS[key].sceneOnly &&
    !RENDER_OPTIONS[key].rig &&
    !SKIPPED.has(key) &&
    RENDER_OPTIONS[key].section !== 'motion'
);
const OPTIONS = {
  motion: choice('Motion', MOTIONS, 'still'),
  ...fromSchema(RENDER_OPTIONS, KEYS),
  weightImage: {
    ...fromSchema(RENDER_OPTIONS, ['weightImage']).weightImage,
    default: 1,
  },
  weightNoise: {
    ...fromSchema(RENDER_OPTIONS, ['weightNoise']).weightNoise,
    default: 0,
  },
};

const SECTIONS = [
  { keys: ['motion'], title: 'Motion' },
  ...SCHEMA_SECTIONS.map(([section, title]) => ({
    keys: KEYS.filter((key) => RENDER_OPTIONS[key].section === section),
    title,
  })),
];

const PICTURE = {
  weightImage: 1,
  weightNoise: 0,
  weightShape: 0,
  weightFocal: 0,
  imageBlur: 3,
};

const PRESETS = {
  'Topo Bands': { ...PICTURE, levels: 16 },
  'Contour Lines': {
    ...PICTURE,
    style: 'lines',
    outlineWidth: 0,
    cosinePhase: 4.7124,
    levels: 24,
  },
  'Paper Map': {
    ...PICTURE,
    colorMode: 'ramp',
    rampLow: '#cdd8c0',
    rampHigh: '#8f6b4a',
    outlineColor: '#4a3a2c',
    outlineWidth: 0.8,
    levels: 22,
  },
  'Noise over Picture': {
    ...PICTURE,
    weightNoise: 0.35,
    noiseSpeed: 0.2,
    motion: 'flow',
  },
};

export default {
  animated: (options) => options.motion === 'flow',
  choices: {
    paletteName: [['None', 'None'], ...PALETTE_NAMES.map((n) => [n, n])],
  },
  defaultPreset: 'Topo Bands',
  description:
    'The picture as a flat contour map: its brightness banded into terraces or traced as isolines.',
  engine: 'webgpu',
  id: 'isoLines',
  inputs: ['still', 'video', 'live'],
  label: 'IsoLines',
  options: OPTIONS,
  order: 31,
  presets: PRESETS,
  sections: SECTIONS,

  create(stage) {
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50);
    const rig = createIsoRig();
    scene.add(rig.group);
    const builder = createIsoBuilder();
    let built = '';
    let clock = 0;
    let renderer = null;

    return {
      async render({ dt, frame, options, size }) {
        if (!renderer) ({ renderer } = await stage.gpu());
        renderer.toneMapping = THREE.NoToneMapping;
        renderer.shadowMap.enabled = false;
        const config = { ...sceneDefaults(), ...options };
        const aspect = size.width / size.height;
        clock += dt;
        const time = options.motion === 'flow' ? clock : 0;

        const key = [
          frame.version,
          aspect,
          time,
          ...KEYS.map((k) => config[k]),
        ].join('|');
        rig.apply(config);
        if (key !== built) {
          built = key;
          rig.setBuild(
            builder.build(config, {
              aspect,
              image: frame.pixels(SOURCE_IMAGE_MAX),
              time,
            })
          );
        }
        rig.setPixelRatio(size.height / REFERENCE_HEIGHT);
        scene.background = new THREE.Color(config.background);

        const view = flatView(aspect);
        Object.assign(camera, {
          bottom: -view.halfHeight,
          left: -view.halfWidth,
          right: view.halfWidth,
          top: view.halfHeight,
        });
        camera.position.set(...view.eye);
        camera.lookAt(...view.target);
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);
      },
      reset() {
        built = '';
        clock = 0;
      },
      dispose() {
        rig.dispose();
      },
    };
  },
};
