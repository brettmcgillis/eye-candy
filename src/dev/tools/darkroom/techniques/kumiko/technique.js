import { pass } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { PRESETS } from '@components/scenes/WebGPU/Kumiko/presets/presets';
import {
  RENDER_OPTIONS,
  SCENE_KEYS,
  buildLeaves,
  buildPanel,
  renderKumikoSvg,
  sceneDefaults,
} from '@modules/kumiko';
import {
  KUMIKO_LIGHTING,
  PALETTE_NAMES,
  createPanelRig,
  paletteStops,
} from '@modules/kumikoRender';
import {
  buildSceneLightingRuntimeConfig,
  createSceneLights,
} from '@modules/lightingRig';

import drawSvg from '../shared/drawSvg';
import { choice, flag, fromSchema, num, webcamPresets } from '../shared/specs';

const IMAGE_MAX = 1024;
const DEG = Math.PI / 180;
const VIEW_ANGLES = {
  angle: [-24, 12],
  front: [0, 0],
  raking: [-58, 6],
};

const KEYS = SCENE_KEYS.filter(
  (key) =>
    (!RENDER_OPTIONS[key].sceneOnly || key === 'cellEase') &&
    key !== 'sourceImage'
);
const OPTIONS = {
  view: choice('View', ['flat', 'front', 'angle', 'raking'], 'flat'),
  fitPanel: flag('Panel takes the source aspect', true),
  margin: num('Margin', 0.06, 0, 0.5, 0.01),
  ...fromSchema(RENDER_OPTIONS, KEYS),
};
OPTIONS.seed = { ...OPTIONS.seed, default: 'kumiko' };

const SECTIONS = [
  { keys: ['view', 'fitPanel', 'margin'], title: 'View' },
  ...[
    ['image', 'Image'],
    ['panel', 'Panel'],
    ['strips', 'Strips'],
    ['mix', 'Mixing'],
    ['pool', 'Pattern pool'],
    ['color', 'Colour'],
    ['build', '3D build'],
    ['output', 'Seed'],
  ].map(([section, title]) => ({
    keys: KEYS.filter((key) => RENDER_OPTIONS[key].section === section),
    title,
  })),
];

function panelConfig(options, frame) {
  const config = { ...sceneDefaults(), ...options };
  if (options.fitPanel && frame.width && frame.height) {
    config.panelHeight = Math.round(
      (config.panelWidth * frame.height) / frame.width
    );
  }
  return config;
}

function frameView(bounds, { height, width }, margin, view) {
  const [azimuth, elevation] = VIEW_ANGLES[view];
  const az = azimuth * DEG;
  const el = elevation * DEG;
  const dir = [
    Math.sin(az) * Math.cos(el),
    Math.sin(el),
    Math.cos(az) * Math.cos(el),
  ];
  const fov = 24;
  const half = (fov * DEG) / 2;
  const horizontal = Math.atan(Math.tan(half) * (width / height));
  const [w, h] = bounds.size;
  const distance =
    Math.max(h / 2 / Math.tan(half), w / 2 / Math.tan(horizontal)) *
    (1 + margin * 2);
  return {
    eye: bounds.center.map((v, a) => v + dir[a] * distance),
    fov,
    target: bounds.center,
  };
}

function createPanel3d(stage) {
  let ready = null;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(24, 1, 0.05, 400);
  const rig = createPanelRig();
  scene.add(rig.group);
  scene.add(
    createSceneLights(
      buildSceneLightingRuntimeConfig({
        controls: {},
        lighting: KUMIKO_LIGHTING,
      }),
      { shadows: true }
    )
  );
  let pipeline = null;
  let first = true;
  let planned = '';
  let bounds = null;

  const init = async () => {
    const { renderer } = await stage.gpu();
    Object.assign(renderer, { toneMapping: THREE.ACESFilmicToneMapping });
    Object.assign(renderer.shadowMap, {
      enabled: true,
      type: THREE.PCFSoftShadowMap,
    });
    pipeline = new THREE.RenderPipeline(renderer);
    pipeline.outputNode = pass(scene, camera, { samples: 4 });
    return renderer;
  };

  return {
    async render({ dt, frame, options, size }) {
      ready = ready ?? init();
      await ready;
      const config = panelConfig(options, frame);
      const key = `${frame.version}|${JSON.stringify(config)}`;
      if (key !== planned) {
        planned = key;
        scene.background = new THREE.Color(config.backgroundColor);
        const image =
          config.imageMode === 'off' ? null : frame.pixels(IMAGE_MAX);
        bounds = rig.setPanel(buildLeaves(config, { image }), config, {
          immediate: first,
        });
        first = false;
      }
      rig.tick(dt, config.cellEase);
      const view = frameView(bounds, size, options.margin, options.view);
      camera.fov = view.fov;
      camera.aspect = size.width / size.height;
      camera.position.set(...view.eye);
      camera.lookAt(...view.target);
      camera.updateProjectionMatrix();
      pipeline.render();
    },
    reset() {
      first = true;
      planned = '';
    },
    dispose() {
      rig.dispose();
      pipeline?.dispose();
    },
  };
}

export default {
  animated: (options) => options.view !== 'flat' && options.cellEase > 0,
  choices: { palette: PALETTE_NAMES.map((name) => [name, name]) },
  defaultPreset: 'Webcam Halftone',
  description:
    'A kumiko lattice whose patterns are chosen by brightness (halftone) or split where the picture is busy; flat fill art or the backlit 3D panel.',
  engine: (options) => (options.view === 'flat' ? 'canvas' : 'webgpu'),
  id: 'kumiko',
  inputs: ['still', 'video', 'live'],
  label: 'Kumiko',
  options: OPTIONS,
  order: 20,
  presets: webcamPresets(PRESETS),
  sections: SECTIONS,

  create(stage) {
    let panel3d = null;
    return {
      async render(input) {
        const { frame, options, size } = input;
        if (options.view !== 'flat') {
          panel3d = panel3d ?? createPanel3d(stage);
          await panel3d.render(input);
          return;
        }
        const config = panelConfig(options, frame);
        const image =
          config.imageMode === 'off' ? null : frame.pixels(IMAGE_MAX);
        const svg = renderKumikoSvg({
          config,
          frame: { ...size, margin: options.margin },
          panel: buildPanel(config, { image }),
          stops: paletteStops(config.palette),
          style: 'fill',
        });
        await drawSvg(svg, stage.flatContext, size);
      },
      reset() {
        panel3d?.reset();
      },
      dispose() {
        panel3d?.dispose();
      },
    };
  },
};
