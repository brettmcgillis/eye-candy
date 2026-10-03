import * as THREE from 'three/webgpu';

import {
  RENDER_OPTIONS,
  SCENE_KEYS,
  SOURCE_IMAGE_MAX,
  buildInstances,
  buildNetwork,
  createDrift,
  createDriftClock,
  createPulses,
  frameView,
  growAt,
  sceneDefaults,
} from '@modules/networkTest';
import {
  NETWORK_TEST_POST,
  PALETTE_NAMES,
  createNetworkRig,
  getPaletteStops,
} from '@modules/networkTestRender';
import { buildScenePostRuntimeConfig, createPostChain } from '@modules/postRig';

import { choice, fromSchema, num } from '../shared/specs';

const MOTIONS = ['still', 'grow', 'drift', 'pulse'];
const VIEWS = ['flat', 'hero', 'right', 'top'];
const SKIPPED = new Set(['sourceImage', 'imageShare']);
const SECTIONS_OF_SCHEMA = [
  ['image', 'Image'],
  ['points', 'Generators'],
  ['wiring', 'Wiring'],
  ['nodes', 'Nodes'],
  ['edges', 'Edges'],
  ['pulses', 'Pulses'],
  ['stage', 'Stage'],
];

const KEYS = SCENE_KEYS.filter(
  (key) =>
    !RENDER_OPTIONS[key].sceneOnly &&
    !RENDER_OPTIONS[key].rig &&
    !SKIPPED.has(key) &&
    RENDER_OPTIONS[key].section !== 'motion'
);
const OPTIONS = {
  view: choice('View', VIEWS, 'flat'),
  motion: choice('Motion', MOTIONS, 'pulse'),
  imageShare: num('Image share', 1, 0, 1, 0.01, {
    help: 'Share of the points scattered over the source; the rest come from the generators',
  }),
  margin: num('Margin', 0.06, 0, 0.5, 0.01),
  fov: num('Field of view', 28, 10, 60, 1),
  ...fromSchema(RENDER_OPTIONS, KEYS),
  ...fromSchema(RENDER_OPTIONS, [
    'growSeconds',
    'holdSeconds',
    'driftAmount',
    'driftScale',
    'driftSpeed',
    'rewireSeconds',
    'fadeSeconds',
    'postBloomEnabled',
    'postBloomStrength',
    'postBloomThreshold',
    'postGradeVignette',
  ]),
};

const SECTIONS = [
  {
    keys: ['view', 'motion', 'imageShare', 'margin', 'fov'],
    title: 'View',
  },
  ...SECTIONS_OF_SCHEMA.map(([section, title]) => ({
    keys: KEYS.filter((key) => RENDER_OPTIONS[key].section === section),
    title,
  })),
  {
    keys: [
      'growSeconds',
      'holdSeconds',
      'driftAmount',
      'driftScale',
      'driftSpeed',
      'rewireSeconds',
      'fadeSeconds',
    ],
    title: 'Motion',
  },
  {
    keys: [
      'postBloomEnabled',
      'postBloomStrength',
      'postBloomThreshold',
      'postGradeVignette',
    ],
    title: 'Post',
  },
];

const IMAGE_ONLY = {
  imageShare: 1,
  warpAmount: 0,
  minSpacing: 0,
  pointCount: 2600,
  imageDepth: 0.15,
  surfaceJitter: 0.005,
};

const PRESETS = {
  'Webcam Network': {
    ...IMAGE_ONLY,
    pointCount: 4000,
    imageDepth: 0.12,
    ruleChain: 0,
    ruleMst: 1,
    ruleRng: 0.25,
    ruleGabriel: 0,
    ruleKnn: 0,
    ruleBand: 0,
    ruleBridge: 0,
    lengthFade: 0.6,
    imageEdges: 0.6,
    imageContrast: 2.5,
    imageColor: 0.5,
    paletteName: 'None',
    nodeColor: '#cfe6ff',
    edgeColor: '#7fb2ff',
    edgeTint: 0.3,
    nodeShare: 0.3,
    nodeSize: 0.008,
    nodeHubScale: 0.3,
    pulseCount: 60,
    pulseSpeed: 0.2,
    pulseTrail: 0.7,
  },
  'Stipple Tree': {
    ...IMAGE_ONLY,
    pointCount: 4000,
    ruleChain: 0,
    ruleMst: 1,
    ruleRng: 0,
    ruleGabriel: 0,
    ruleKnn: 0,
    ruleBand: 0,
    ruleBridge: 0,
    imageEdges: 0.2,
    nodeShare: 0,
    pulseCount: 0,
    motion: 'grow',
  },
  'Contour Web': {
    ...IMAGE_ONLY,
    ruleChain: 0,
    ruleMst: 0.6,
    ruleRng: 0,
    ruleGabriel: 1,
    ruleKnn: 0,
    ruleBand: 0,
    ruleBridge: 0,
    imageEdges: 0.9,
    imageContrast: 1.6,
    motion: 'drift',
  },
  'Ink Plot': {
    ...IMAGE_ONLY,
    mood: 'ink',
    background: '#efe9dc',
    nodeColor: '#2b2833',
    edgeColor: '#24212b',
    bridgeColor: '#b4342d',
    pulseColor: '#b4342d',
    nodeIntensity: 1,
    edgeIntensity: 1,
    pulseIntensity: 1,
    nodeStyle: 'dot',
    edgeSoftness: 0.1,
    ruleChain: 0,
    ruleMst: 1,
    ruleRng: 0.4,
    ruleGabriel: 0,
    ruleKnn: 0,
    ruleBand: 0,
    ruleBridge: 0,
    postBloomEnabled: false,
    pulseCount: 0,
    motion: 'still',
  },
  'Half Generated': {
    imageShare: 0.6,
    pointCount: 2200,
    imageColor: 0.5,
    motion: 'grow',
  },
};

const BUILD_KEYS = KEYS.filter((key) =>
  ['points', 'wiring', 'image'].includes(RENDER_OPTIONS[key].section)
).concat(['imageShare']);

export default {
  animated: (options) => options.motion !== 'still',
  choices: {
    paletteName: [['None', 'None'], ...PALETTE_NAMES.map((n) => [n, n])],
  },
  defaultPreset: 'Webcam Network',
  description:
    'The picture as a network: points scattered by its darkness and edges, wired by spanning trees and proximity graphs, growing, drifting and carrying signals.',
  engine: 'webgpu',
  id: 'networkTest',
  inputs: ['still', 'video', 'live'],
  label: 'NetworkTest',
  options: OPTIONS,
  order: 30,
  presets: PRESETS,
  sections: SECTIONS,

  create(stage) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 1, 0.02, 100);
    const rig = createNetworkRig();
    scene.add(rig.group);
    let renderer = null;
    let chain = null;
    let chainKey = '';
    let built = '';
    let network = null;
    let motion = null;
    let clock = 0;

    // The post chain for the enabled slots, or null to draw straight.
    const chainFor = (config) => {
      const slots = buildScenePostRuntimeConfig(
        NETWORK_TEST_POST,
        config
      ).slots.filter((slot) => slot.enabled);
      const key = slots.map((slot) => slot.id).join('|');
      if (key !== chainKey) {
        chainKey = key;
        chain?.pipeline.dispose?.();
        chain =
          slots.length > 0
            ? createPostChain({
                camera,
                passOptions: { samples: 4 },
                renderer,
                scene,
                slots,
              })
            : null;
      }
      chain?.chain.forEach((link) => link.update(config, {}));
      return chain;
    };

    const pulsesFor = (config) => {
      const key = `${config.wireSeed}|${config.pulseCount}`;
      if (motion.pulseKey !== key) {
        motion.pulseKey = key;
        motion.pulses = createPulses(config.wireSeed, config.pulseCount);
      }
      return motion.pulses;
    };

    return {
      async render({ dt, frame, options, size }) {
        if (!renderer) {
          ({ renderer } = await stage.gpu());
        }
        renderer.toneMapping = THREE.NoToneMapping;
        renderer.shadowMap.enabled = false;
        const config = { ...sceneDefaults(), ...options };

        const key = `${frame.version}|${BUILD_KEYS.map((k) => config[k]).join('|')}`;
        if (key !== built || !network) {
          built = key;
          const previous = network;
          network = buildNetwork(config, {
            image: frame.pixels(SOURCE_IMAGE_MAX),
          });
          if (!motion) {
            clock = 0;
            motion = {};
          }
          motion.pulses?.retarget(previous, network);
          motion.clock = createDriftClock(network, config);
          motion.wander = createDrift(network, config);
        }
        clock += dt;
        const pulses = pulsesFor(config);

        let grow = null;
        let { positions } = network;
        let edges = null;
        let live = network;
        if (options.motion === 'grow') {
          grow = growAt(clock, config);
          if (config.driftAmount > 0) positions = motion.wander(clock, config);
        } else if (options.motion === 'drift') {
          const now = motion.clock.step(clock, dt);
          ({ edges, positions } = now);
          live = now.network;
        }
        if (options.motion !== 'still' && config.pulseCount > 0) {
          pulses.step(live, positions, dt, config.pulseSpeed, grow ?? 1);
        }

        rig.apply(config);
        rig.setInstances(
          buildInstances({
            config,
            edges,
            grow,
            network: live,
            positions,
            pulses: options.motion === 'still' ? null : pulses.pulses,
            stops: getPaletteStops(config.paletteName),
          })
        );
        scene.background = new THREE.Color(config.background);

        const flat = options.view === 'flat';
        const view = frameView({
          elevation: flat ? 0 : undefined,
          options: {
            fov: options.fov,
            height: size.height,
            margin: options.margin,
            projection: 'perspective',
            width: size.width,
          },
          pad: config.nodeSize,
          points: network.positions,
          view: flat ? 'front' : options.view,
        });
        camera.fov = view.fov;
        camera.aspect = size.width / size.height;
        camera.near = view.near;
        camera.far = view.far;
        camera.position.set(...view.eye);
        camera.up.set(...view.up);
        camera.lookAt(...view.target);
        camera.updateProjectionMatrix();
        rig.setDepthRange(view.depthNear, view.depthFar);

        const post = chainFor(config);
        if (post) post.pipeline.render();
        else renderer.render(scene, camera);
      },
      reset() {
        motion = null;
        built = '';
      },
      dispose() {
        chain?.pipeline.dispose?.();
        rig.dispose();
      },
    };
  },
};
