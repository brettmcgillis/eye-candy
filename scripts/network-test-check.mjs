#!/usr/bin/env node

/* eslint-disable no-console */
// Drift alarm for the NetworkTest pipeline: the scene, the CLIs and the
// workbench must agree with the kernel they share, every generator and rule
// must hold its invariants, and the rig must compile and draw. See
// docs/network-test-pipeline.md.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  FAMILIES,
  FAMILY_KINDS,
  LEVA_KEYS,
  MAX_POINTS,
  RENDER_OPTIONS,
  RULES,
  SCENE_KEYS,
  normalizeOptions,
} from '../src/modules/networkTest/renderOptions.mjs';
import { createHeadlessRenderer, loadThree } from './lib/headlessWebgpu.mjs';
import loadModules, { REPO_ROOT } from './lib/loadModules.mjs';

const KERNEL_DIR = path.join(REPO_ROOT, 'src', 'modules', 'networkTest');
const PRESETS = '/src/components/scenes/WebGPU/NetworkTest/presets/presets.js';
const HEADLESS = [
  'lib/networkTestRender.mjs',
  'network-test-generate.mjs',
  'network-test-video.mjs',
];
const BARRELS = {
  look: '/src/modules/networkTestRender/index.js',
  net: '/src/modules/networkTest/index.js',
  post: '/src/modules/postRig/index.js',
};
const PAGE_FIELDS = path.join(
  REPO_ROOT,
  'src/dev/tools/networkTest/components/OptionSections.jsx'
);
const ALLOWED_KERNEL_IMPORTS = new Set([
  '@modules/flora',
  '@utils/paletteStops',
]);
// Keys the camera rig owns; a preset may carry them but the schema does not.
const CAMERA_KEY = /^(camera|orbit|fixed|spline|operator)/u;
const RULE_KEYS = {
  band: 'ruleBand',
  bridge: 'ruleBridge',
  chain: 'ruleChain',
  gabriel: 'ruleGabriel',
  knn: 'ruleKnn',
  mst: 'ruleMst',
  rng: 'ruleRng',
};
const FAMILY_KEYS = {
  attractor: 'weightAttractor',
  cluster: 'weightCluster',
  noise: 'weightNoise',
  primitive: 'weightPrimitive',
};

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

async function checkKernelPurity() {
  const files = (await readdir(KERNEL_DIR)).filter((name) =>
    /\.(js|mjs)$/u.test(name)
  );
  await Promise.all(
    files.map(async (name) => {
      const source = await readFile(path.join(KERNEL_DIR, name), 'utf8');
      [...source.matchAll(/from '([^'.][^']*)'/gu)]
        .map(([, specifier]) => specifier)
        .filter((specifier) => !ALLOWED_KERNEL_IMPORTS.has(specifier))
        .forEach((specifier) =>
          failures.push(
            `kernel purity: ${name} imports "${specifier}" — rendering code belongs in @modules/networkTestRender.`
          )
        );
    })
  );
}

function checkRigDefaults({ look, post }) {
  const { slots } = post.buildScenePostRuntimeConfig(look.NETWORK_TEST_POST);
  const slot = (id) => slots.find((entry) => entry.id === id);
  const expected = {
    postBloomEnabled: slot('bloom')?.enabled,
    postBloomStrength: slot('bloom')?.strength,
    postBloomThreshold: slot('bloom')?.threshold,
    postGradeEnabled: slot('grade')?.enabled,
    postGradeLetterbox: slot('grade')?.letterbox,
    postGradeTint: slot('grade')?.tint,
    postGradeVignette: slot('grade')?.vignette,
    postGrainAmount: slot('grain')?.amount,
    postGrainAnimated: slot('grain')?.animated,
    postGrainEnabled: slot('grain')?.enabled,
    postGrainScale: slot('grain')?.scale,
  };
  Object.entries(RENDER_OPTIONS)
    .filter(([, spec]) => spec.rig)
    .forEach(([name, spec]) => {
      check(
        name in expected,
        `"${name}" is a rig key the check does not know how to verify.`
      );
      check(
        spec.default === expected[name],
        `"${name}" defaults to ${spec.default} in renderOptions.mjs but the rig declares ${expected[name]}.`
      );
    });
}

// Leva keeps a value a preset leaves out, so a hand-written preset that
// skips a control inherits it from whichever preset was showing before.
function checkPresets({ PRESETS: presets }) {
  const scene = new Set(SCENE_KEYS);
  Object.entries(presets).forEach(([name, preset]) => {
    Object.keys(preset)
      .filter((key) => !scene.has(key) && !CAMERA_KEY.test(key))
      .forEach((key) =>
        failures.push(
          `preset "${name}" sets "${key}", which renderOptions.mjs does not declare.`
        )
      );
    LEVA_KEYS.filter((key) => !(key in preset)).forEach((key) =>
      failures.push(`preset "${name}" leaves out "${key}".`)
    );
    Object.entries(preset)
      .filter(([key]) => RENDER_OPTIONS[key]?.type === 'number')
      .forEach(([key, value]) => {
        const { max, min } = RENDER_OPTIONS[key];
        check(
          value >= min && value <= max,
          `preset "${name}" sets ${key} = ${value}, outside [${min}, ${max}] — Leva would clamp it.`
        );
      });
    Object.entries(preset)
      .filter(([key]) => RENDER_OPTIONS[key]?.type === 'enum')
      .forEach(([key, value]) =>
        check(
          RENDER_OPTIONS[key].choices.includes(value),
          `preset "${name}" sets ${key} = "${value}", not one of its choices.`
        )
      );
  });
}

// Every generator, alone, must make finite points and a connected-enough
// network; every rule, alone, must make only its own edges.
function checkTechniques({ net }) {
  const base = { ...net.sceneDefaults(), pointCount: 600, shapeCount: 1 };
  const families = Object.fromEntries(
    FAMILIES.map((family) => [FAMILY_KEYS[family], 0])
  );
  FAMILIES.forEach((family) =>
    FAMILY_KINDS[family].forEach((kind) => {
      const config = {
        ...base,
        ...families,
        [FAMILY_KEYS[family]]: 1,
        [`${family}Kind`]: kind,
      };
      const network = net.buildNetwork(config);
      check(
        network.placements.every((p) => p.family === family && p.kind === kind),
        `soloing ${family}:${kind} placed something else.`
      );
      check(
        network.count >= 50,
        `${family}:${kind} made only ${network.count} points.`
      );
      check(
        network.positions.every(Number.isFinite),
        `${family}:${kind} made a non-finite position.`
      );
      check(
        network.edges.length >= network.count * 0.5,
        `${family}:${kind} wired only ${network.edges.length} edges over ${network.count} points.`
      );
    })
  );

  const rules = Object.fromEntries(RULES.map((rule) => [RULE_KEYS[rule], 0]));
  const multi = { ...base, shapeCount: 3, pointCount: 800 };
  RULES.forEach((rule) => {
    const network = net.buildNetwork({
      ...multi,
      ...rules,
      [RULE_KEYS[rule]]: 1,
    });
    check(network.edges.length > 0, `soloing the ${rule} rule drew no edges.`);
    check(
      network.edges.every((edge) => edge.rule === rule),
      `soloing the ${rule} rule drew edges of another rule.`
    );
    if (rule !== 'bridge') {
      check(
        network.degree.every((d) => d <= multi.maxDegree),
        `the ${rule} rule broke maxDegree.`
      );
    }
  });

  const mstOnly = net.buildNetwork({ ...multi, ...rules, ruleMst: 1 });
  check(
    mstOnly.edges.length < mstOnly.count,
    'the spanning tree has a cycle (as many edges as points).'
  );
}

// Every roll must be a config the scene accepts, small enough to draw; a
// held facet must not move; a seed must rebuild the same network.
function checkRolls({ look, net }) {
  const palettes = look.PALETTE_NAMES.filter(
    (name) => (look.getPaletteStops(name)?.length ?? 0) >= 2
  );
  for (let i = 0; i < 30; i += 1) {
    const config = net.rollNetworkTestConfig(`check-${i}`, { palettes });
    Object.entries(config)
      .filter(([key]) => RENDER_OPTIONS[key]?.type === 'number')
      .forEach(([key, value]) => {
        const { max, min } = RENDER_OPTIONS[key];
        check(
          value >= min && value <= max,
          `roll check-${i} sets ${key} = ${value}, outside [${min}, ${max}].`
        );
      });
    const network = net.buildNetwork(config);
    check(
      network.count <= MAX_POINTS && network.count > 0,
      `roll check-${i} builds ${network.count} points.`
    );
    check(network.edges.length > 0, `roll check-${i} wires no edges.`);
    try {
      normalizeOptions('still', config);
    } catch (error) {
      failures.push(`roll check-${i} fails validation: ${error.message}`);
    }
  }
  const source = net.rollNetworkTestConfig('b', { palettes });
  ['points', 'wiring', 'color', 'atmosphere'].forEach((facet) => {
    const held = net.rollNetworkTestConfig('a', {
      base: source,
      keep: [facet],
      palettes,
    });
    net
      .keysInFacet(facet)
      .forEach((key) =>
        check(
          held[key] === source[key],
          `holding ${facet} still re-rolled "${key}".`
        )
      );
  });
  const config = net.rollNetworkTestConfig('determinism', { palettes });
  const a = net.buildNetwork(config);
  const b = net.buildNetwork(config);
  check(
    a.edges.length === b.edges.length &&
      a.positions.every((v, i) => v === b.positions[i]),
    'the same config built two different networks.'
  );
}

// The grow cycle rises to 1, holds, and falls back to 0 (no fade): a
// signal never rides an edge that is not grown.
function checkCycle({ net }) {
  const config = { ...net.sceneDefaults(), growSeconds: 2, holdSeconds: 1 };
  const at = (t) => net.growAt(t, config);
  check(
    at(0) === 0 && at(2) === 1 && at(2.5) === 1,
    'grow does not rise to a hold.'
  );
  check(
    at(4) < 0.6 && at(4) > 0.4 && at(5) === 0,
    'grow does not fall back into its roots after the hold.'
  );
  const network = net.buildNetwork(config);
  const pulses = net.createPulses(1, 30);
  for (let f = 0; f < 30; f += 1) {
    pulses.step(network, network.positions, 1 / 30, 0.6, 0.3);
  }
  check(
    pulses.pulses.every(
      ({ from, to }) =>
        from < 0 || Math.max(network.arrival[from], network.arrival[to]) <= 0.3
    ),
    'a signal rode an edge that is not grown yet.'
  );
}

// A picture dark on its left half: glow gathers on the bright half and ink
// on the dark one (never a negative), and the same picture
// twice must scatter the same points (a webcam does not boil).
function checkImage({ net }) {
  const width = 64;
  const height = 48;
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const o = (y * width + x) * 4;
      const v = x < width / 2 ? 10 : 245;
      data.set([v, v, v, 255], o);
    }
  }
  const image = { channels: 4, data, height, width };
  const config = {
    ...net.sceneDefaults(),
    imageEdges: 0,
    imageShare: 1,
    minSpacing: 0,
    pointCount: 800,
    warpAmount: 0,
  };
  const a = net.buildNetwork(config, { image });
  const b = net.buildNetwork(config, { image });
  const ink = net.buildNetwork({ ...config, mood: 'ink' }, { image });
  const share = (network, onLeft) => {
    let hits = 0;
    for (let i = 0; i < network.count; i += 1) {
      if (network.positions[i * 3] < 0 === onLeft) hits += 1;
    }
    return hits / Math.max(network.count, 1);
  };
  check(
    a.count > 600 && share(a, false) > 0.9,
    `glow scattered ${Math.round(share(a, false) * 100)}% of its points on the bright half.`
  );
  check(
    share(ink, true) > 0.9,
    `ink scattered ${Math.round(share(ink, true) * 100)}% of its points on the dark half.`
  );
  check(
    a.placements.every((p) => p.family === 'image'),
    'an image-only network still placed generators.'
  );
  check(
    a.positions.every((v, i) => v === b.positions[i]),
    'the same picture scattered different points.'
  );
}

// grow 0 draws nothing and grow 1 draws every edge whole; arrival starts at
// a root and fills [0, 1]; the plot SVG has paths.
function checkMotion({ net }) {
  const config = net.sceneDefaults();
  const network = net.buildNetwork(config);
  check(
    network.arrival.every((t) => t >= 0 && t <= 1),
    'arrival times left [0, 1].'
  );
  check(
    network.arrival.some((t) => t === 0) &&
      network.arrival.some((t) => t === 1),
    'arrival times do not span a root to the last point.'
  );
  const empty = net.buildInstances({ config, grow: 0, network });
  check(
    empty.segments.count === 0 && empty.sprites.count === 0,
    `grow 0 still draws ${empty.segments.count} segments and ${empty.sprites.count} sprites.`
  );
  const grown = net.buildInstances({ config, grow: 1, network });
  const settled = net.buildInstances({ config, network });
  check(
    grown.segments.count === settled.segments.count,
    'grow 1 does not draw the settled network.'
  );

  const clock = net.createDriftClock(network, {
    ...config,
    rewireSeconds: 0.1,
  });
  let last = null;
  for (let f = 0; f < 10; f += 1) last = clock.step(f / 30, 1 / 30);
  check(
    last.edges.every((edge) => edge.alpha >= 0 && edge.alpha <= 1),
    'a drift clock faded an edge out of [0, 1].'
  );

  const svg = net.renderNetworkTestSvg({
    camera: net.frameView({
      options: {
        fov: 32,
        height: 400,
        margin: 0.1,
        projection: 'perspective',
        width: 400,
      },
      points: network.positions,
      view: 'hero',
    }),
    config,
    height: 400,
    instances: settled,
    width: 400,
  });
  check(
    (svg.match(/<path /gu) ?? []).length > 0,
    'the plot SVG of the default network has no paths.'
  );
}

async function checkHeadlessCalls(barrels) {
  await Promise.all(
    HEADLESS.map(async (file) => {
      const source = await readFile(
        path.join(REPO_ROOT, 'scripts', file),
        'utf8'
      );
      [...source.matchAll(/\b(?:kernel\.)?(net|look|post)\.(\w+)/gu)]
        .filter(([, barrel]) => barrel in barrels)
        .forEach(([, barrel, name]) =>
          check(
            name in barrels[barrel],
            `${file} calls ${barrel}.${name}, which ${BARRELS[barrel]} does not export.`
          )
        );
    })
  );
}

async function checkPageFields() {
  const source = await readFile(PAGE_FIELDS, 'utf8');
  const block = source.match(/const HANDLED = new Set\(\[([^\]]+)\]/u)?.[1];
  check(block, 'OptionSections.jsx lost its HANDLED list.');
  [...(block ?? '').matchAll(/'(\w+)'/gu)].forEach(([, key]) =>
    check(
      key in RENDER_OPTIONS,
      `the workbench hand-lays "${key}", which is not in renderOptions.mjs.`
    )
  );
}

// The rig and its post chain must compile to valid WGSL and draw something
// other than the backdrop, in both moods.
async function checkRender({ look, net, post }, THREE) {
  const size = 128;
  const headless = await createHeadlessRenderer({ height: size, width: size });
  const { renderer } = headless;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 60);
  const rig = look.createNetworkRig();
  scene.add(rig.group);
  const config = net.sceneDefaults();
  const network = net.buildNetwork(config);
  const view = net.frameView({
    options: {
      fov: 32,
      height: size,
      margin: 0.05,
      projection: 'perspective',
      width: size,
    },
    points: network.positions,
    view: 'hero',
  });
  camera.position.set(...view.eye);
  camera.lookAt(...view.target);
  camera.updateMatrixWorld();
  rig.setDepthRange(view.depthNear, view.depthFar);
  const pulses = net.createPulses(1, 40);
  pulses.advance(network, network.positions, 1, config.pulseSpeed);
  rig.setInstances(
    net.buildInstances({ config, network, pulses: pulses.pulses })
  );
  const chain = post.createPostChain({
    camera,
    renderer,
    scene,
    slots: post.buildScenePostRuntimeConfig(look.NETWORK_TEST_POST).slots,
  });
  const { device } = renderer.backend;

  const drawMood = async (mood) => {
    const background = mood === 'glow' ? '#000000' : '#ffffff';
    scene.background = new THREE.Color(background);
    rig.apply({ ...config, mood });
    device.pushErrorScope('validation');
    await headless.readFrame(() => chain.pipeline.render());
    const frame = await headless.readFrame(() => chain.pipeline.render());
    const error = await device.popErrorScope();
    check(!error, `the rig fails validation (${mood}): ${error?.message}`);
    let marked = 0;
    for (let i = 0; i < frame.data.length; i += 4) {
      const sum = frame.data[i] + frame.data[i + 1] + frame.data[i + 2];
      if (mood === 'glow' ? sum > 30 : sum < 700) marked += 1;
    }
    check(
      marked > size * size * 0.02,
      `the default network draws almost nothing (${mood}).`
    );
  };
  await drawMood('glow');
  await drawMood('ink');
  rig.dispose();
  headless.dispose();
}

async function main() {
  await checkKernelPurity();
  await checkPageFields();

  const { THREE } = await loadThree();
  const loaded = await loadModules([PRESETS, ...Object.values(BARRELS)]);
  const barrels = Object.fromEntries(
    Object.entries(BARRELS).map(([name, entry]) => [name, loaded[entry]])
  );
  checkRigDefaults(barrels);
  checkPresets(loaded[PRESETS]);
  checkTechniques(barrels);
  checkRolls(barrels);
  checkMotion(barrels);
  checkCycle(barrels);
  checkImage(barrels);
  await checkHeadlessCalls(barrels);
  await checkRender(barrels, THREE);

  if (failures.length > 0) {
    console.error(`network-test:check failed (${failures.length}):\n`);
    failures.forEach((message) => console.error(`  ✗ ${message}`));
    process.exit(1);
  }
  console.log(
    'network-test:check — kernel, rig, scene, CLIs and workbench agree.'
  );
  process.exit(0);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
