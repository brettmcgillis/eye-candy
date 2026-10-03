import * as THREE from 'three/webgpu';

import { SOURCE_IMAGE_MAX, createIsoBuilder } from '@modules/isoLines';
import {
  RENDER_OPTIONS,
  SCENE_KEYS,
  VIEWS,
  frameView,
  motionState,
  sceneDefaults,
  segmentMode,
} from '@modules/isoLinesRelief';
import { PALETTE_NAMES, createReliefRig } from '@modules/isoLinesReliefRender';

import { choice, fromSchema, num } from '../shared/specs';

const MOTIONS = ['still', 'flow', 'build', 'rise'];
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
  ['form', 'Form'],
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
  view: choice('View', VIEWS, 'hero'),
  motion: choice('Motion', MOTIONS, 'still'),
  margin: num('Margin', 0.04, 0, 0.5, 0.01),
  fov: num('Field of view', 30, 10, 60, 1),
  ...fromSchema(RENDER_OPTIONS, KEYS),
  ...fromSchema(RENDER_OPTIONS, ['buildSeconds', 'holdSeconds']),
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
  { keys: ['view', 'motion', 'margin', 'fov'], title: 'View' },
  ...SCHEMA_SECTIONS.map(([section, title]) => ({
    keys: KEYS.filter((key) => RENDER_OPTIONS[key].section === section),
    title,
  })),
  { keys: ['buildSeconds', 'holdSeconds'], title: 'Motion' },
];

const PICTURE = {
  weightImage: 1,
  weightNoise: 0,
  weightShape: 0,
  weightFocal: 0,
  imageBlur: 3,
};
const SINE = { cosinePhase: 4.7124 };

const PRESETS = {
  Terraces: {
    ...PICTURE,
    imageColor: 0.6,
    relief: 0.45,
    levels: 16,
  },
  'Smooth Relief': {
    ...PICTURE,
    style: 'smooth',
    imageColor: 0.6,
    relief: 0.4,
    levels: 16,
  },
  'Soft Terraces': {
    ...PICTURE,
    style: 'smooth',
    terraceSharpness: 0.85,
    imageColor: 0.6,
    relief: 0.45,
    levels: 12,
  },
  'Floating Layers': {
    ...PICTURE,
    wallMode: 'floating',
    outlineWidth: 0,
    relief: 0.5,
    levels: 12,
  },
  'Contour Walls': {
    ...PICTURE,
    ...SINE,
    style: 'lines',
    lineHeight: 0.03,
    relief: 0.45,
    levels: 20,
  },
  'Time Trail': {
    ...PICTURE,
    ...SINE,
    style: 'lines',
    lineExtrude: 'time',
    trailSlices: 32,
    trailSeconds: 0.1,
    lineHeight: 0.01,
    lineThickness: 0.003,
    relief: 0.9,
    motion: 'flow',
  },
  Rise: {
    ...PICTURE,
    imageColor: 0.5,
    relief: 0.5,
    motion: 'rise',
  },
};

const BUILD_KEYS = [...KEYS, 'trailSlices', 'trailSeconds'];

export default {
  animated: (options) =>
    options.motion !== 'still' ||
    (options.style === 'lines' && options.lineExtrude === 'time'),
  choices: {
    paletteName: [['None', 'None'], ...PALETTE_NAMES.map((n) => [n, n])],
  },
  defaultPreset: 'Terraces',
  description:
    'The picture as a contour relief: its brightness built up as stacked terraces or standing contour walls, lit and shadowed.',
  engine: 'webgpu',
  id: 'isoLinesRelief',
  inputs: ['still', 'video', 'live'],
  label: 'IsoLinesRelief',
  options: OPTIONS,
  order: 32,
  presets: PRESETS,
  sections: SECTIONS,

  create(stage) {
    const scene = new THREE.Scene();
    const cameras = {
      orthographic: new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50),
      perspective: new THREE.PerspectiveCamera(30, 1, 0.02, 100),
    };
    const rig = createReliefRig();
    scene.add(rig.group);
    let builder = createIsoBuilder();
    let built = '';
    let clock = 0;
    let renderer = null;

    return {
      async render({ dt, frame, options, size }) {
        if (!renderer) ({ renderer } = await stage.gpu());
        renderer.toneMapping = THREE.NoToneMapping;
        renderer.shadowMap.enabled = true;
        const config = { ...sceneDefaults(), ...options };
        const aspect = size.width / size.height;
        clock += dt;
        const time = options.motion === 'flow' ? clock : 0;
        const mode = segmentMode(config);
        const trail = mode === 'trail';

        const key = [
          frame.version,
          aspect,
          options.motion === 'flow' || trail ? clock : '',
          ...BUILD_KEYS.map((k) => config[k]),
        ].join('|');
        rig.apply(config);
        if (key !== built) {
          built = key;
          const build = builder.build(config, {
            aspect,
            image: frame.pixels(SOURCE_IMAGE_MAX),
            mode,
            time: trail ? clock : time,
          });
          rig.setBuild(build);
          rig.setTime(build.time);
        }
        rig.setMotion(motionState(options.motion, clock, config));
        rig.setPixelRatio(size.height / REFERENCE_HEIGHT);
        scene.background = new THREE.Color(config.background);

        const view = frameView({
          aspect,
          config,
          options: {
            fov: options.fov,
            height: size.height,
            margin: options.margin,
            projection: 'perspective',
            width: size.width,
          },
          stable: options.motion === 'rise' || options.motion === 'build',
          view: options.view,
        });
        const camera = cameras[view.projection];
        if (view.projection === 'orthographic') {
          Object.assign(camera, {
            bottom: -view.halfHeight,
            left: -view.halfWidth,
            right: view.halfWidth,
            top: view.halfHeight,
          });
        } else {
          camera.fov = view.fov;
          camera.aspect = aspect;
        }
        camera.near = view.near;
        camera.far = view.far;
        camera.position.set(...view.eye);
        camera.up.set(...view.up);
        camera.lookAt(...view.target);
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);
      },
      reset() {
        builder = createIsoBuilder();
        built = '';
        clock = 0;
      },
      dispose() {
        rig.dispose();
      },
    };
  },
};
