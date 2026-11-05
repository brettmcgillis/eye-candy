#!/usr/bin/env node

/* eslint-disable no-console */
// Drift alarm for the ControlPanel pipeline: the scene, the CLIs and the
// workbench must agree with the kernel they share, a panel must be a pure
// function of its config, and the rig must compile and draw. See
// docs/control-panel-pipeline.md.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  LEVA_KEYS,
  RENDER_OPTIONS,
  SCENE_KEYS,
  normalizeOptions,
} from '../src/modules/controlPanel/renderOptions.mjs';
import { createHeadlessRenderer, loadThree } from './lib/headlessWebgpu.mjs';
import loadModules, { REPO_ROOT } from './lib/loadModules.mjs';
import presetKeys from './lib/presetKeys.mjs';
import schemaControlCoverage from './lib/schemaControlCoverage.mjs';
import checkWorkbenchPage from './lib/workbenchPage.mjs';

// Scene controls whose schema folders the presets are applied through.
const CONTROLS = [
  '/src/components/scenes/WebGPU/ControlPanel/utils/controls.js',
];

const KERNEL_DIR = path.join(REPO_ROOT, 'src', 'modules', 'controlPanel');
const PRESETS = '/src/components/scenes/WebGPU/ControlPanel/presets/presets.js';
const HEADLESS = [
  'lib/controlPanelRender.mjs',
  'control-panel-generate.mjs',
  'control-panel-video.mjs',
];
const BARRELS = {
  lights: '/src/modules/lightingRig/index.js',
  look: '/src/modules/controlPanelRender/index.js',
  panel: '/src/modules/controlPanel/index.js',
  post: '/src/modules/postRig/index.js',
};
const PAGE = path.join(
  REPO_ROOT,
  'src/dev/tools/controlPanel/ControlPanelWorkbenchPage.jsx'
);
const ALLOWED_KERNEL_IMPORTS = new Set([
  '@modules/flora',
  '@modules/plotKit',
  '@modules/ropePhysics',
  '@utils/argylePattern',
  '@utils/paletteStops',
]);
const REGISTERED_PRESET_KEYS = await presetKeys('ControlPanel');
const MAX_PARTS = 40000;
const isPlate = (item) => item?.g === 'box' || item?.g === 'rbox';

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

async function kernelFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return kernelFiles(full);
      return /\.(js|mjs)$/u.test(entry.name) ? [full] : [];
    })
  );
  return nested.flat();
}

async function checkKernelPurity() {
  const files = await kernelFiles(KERNEL_DIR);
  await Promise.all(
    files.map(async (file) => {
      const source = await readFile(file, 'utf8');
      [...source.matchAll(/from '([^'.][^']*)'/gu)]
        .map(([, specifier]) => specifier)
        .filter((specifier) => !ALLOWED_KERNEL_IMPORTS.has(specifier))
        .forEach((specifier) =>
          failures.push(
            `kernel purity: ${path.relative(KERNEL_DIR, file)} imports "${specifier}" — rendering code belongs in @modules/controlPanelRender.`
          )
        );
    })
  );
}

function checkRigDefaults({ lights, look, post }) {
  const lighting = lights.buildSceneLightingRuntimeConfig({
    lighting: look.CONTROL_PANEL_LIGHTING,
  });
  const key = lighting.slots.find((entry) => entry.id === 'key');
  const { slots } = post.buildScenePostRuntimeConfig(look.CONTROL_PANEL_POST);
  const bloom = slots.find((entry) => entry.id === 'bloom');
  const expected = {
    lightKeyAzimuth: key?.spherical?.azimuth,
    lightKeyColor: key?.color,
    lightKeyElevation: key?.spherical?.elevation,
    lightKeyIntensity: key?.intensity,
    postBloomEnabled: bloom?.enabled,
    postBloomStrength: bloom?.strength,
    postBloomThreshold: bloom?.threshold,
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

function checkPresets({ PRESETS: presets }) {
  const scene = new Set(SCENE_KEYS);
  Object.entries(presets).forEach(([name, preset]) => {
    Object.keys(preset)
      .filter((key) => !scene.has(key) && !REGISTERED_PRESET_KEYS.has(key))
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

const finite = (item) =>
  [...item.p, ...item.q, ...item.s, ...item.c, ...(item.e ?? [])].every(
    Number.isFinite
  );

// Every roll must be a config the scene accepts, a panel the rig can draw,
// and the same panel every time it is built.
function checkRolls({ panel: kernel }) {
  const modes = new Set();
  for (let i = 0; i < 40; i += 1) {
    const config = kernel.rollControlPanelConfig(`check-${i}`);
    modes.add(config.layoutMode);
    Object.entries(config)
      .filter(([key]) => RENDER_OPTIONS[key]?.type === 'number')
      .forEach(([key, value]) => {
        const { max, min } = RENDER_OPTIONS[key];
        check(
          value >= min && value <= max,
          `roll check-${i} sets ${key} = ${value}, outside [${min}, ${max}].`
        );
      });
    try {
      normalizeOptions('still', config);
    } catch (error) {
      failures.push(`roll check-${i} fails validation: ${error.message}`);
    }
    const built = kernel.buildPanel(config);
    const parts = kernel.panelParts(built, config, { t: 2.5 });
    check(
      parts.length <= MAX_PARTS,
      `roll check-${i} draws ${parts.length} parts, over ${MAX_PARTS}.`
    );
    check(
      parts.every((item) => kernel.GEOMETRIES.includes(item.g)),
      `roll check-${i} draws a part of an unknown primitive.`
    );
    check(parts.every(finite), `roll check-${i} has a non-finite part.`);
    if (i < 6) {
      const again = kernel.panelParts(kernel.buildPanel(config), config, {
        t: 2.5,
      });
      check(
        JSON.stringify(again) === JSON.stringify(parts),
        `roll check-${i} is not a pure function of its config.`
      );
    }
    const { max, min } = built.bounds;
    check(
      built.statics.every(
        (item) =>
          item.p[0] >= min[0] - 1e-6 &&
          item.p[0] <= max[0] + 1e-6 &&
          item.p[1] >= min[1] - 1e-6 &&
          item.p[1] <= max[1] + 1e-6
      ),
      `roll check-${i} places a part off the panel.`
    );
  }
  check(modes.size === 3, `40 rolls only used layouts ${[...modes]}.`);
  const shapes = { landscape: 0, portrait: 0, square: 0 };
  for (let i = 0; i < 60; i += 1) {
    const { panelCols: w, panelRows: h } = kernel.rollControlPanelConfig(
      `shape-${i}`
    );
    if (Math.abs(w - h) <= 1) shapes.square += 1;
    else shapes[w > h ? 'landscape' : 'portrait'] += 1;
  }
  Object.entries(shapes).forEach(([shape, n]) =>
    check(n >= 4, `60 any-orientation rolls drew ${n} ${shape} panels.`)
  );
  ['landscape', 'portrait', 'square'].forEach((orientation) => {
    for (let i = 0; i < 20; i += 1) {
      const config = kernel.rollControlPanelConfig(`${orientation}-${i}`, {
        orientation,
      });
      const { panelCols: w, panelRows: h } = config;
      const fits = {
        landscape: w > h + 1,
        portrait: h > w + 1,
        square: Math.abs(w - h) <= 1,
      }[orientation];
      check(fits, `orientation ${orientation} rolled a ${w} × ${h} panel.`);
      if (orientation === 'portrait' && i < 6) {
        const parts = kernel.panelParts(kernel.buildPanel(config), config, {
          t: 2.5,
        });
        check(
          parts.length <= MAX_PARTS && parts.every(finite),
          `portrait roll ${i} draws a bad panel.`
        );
      }
    }
  });
  const source = kernel.rollControlPanelConfig('b');
  const held = kernel.rollControlPanelConfig('a', {
    base: source,
    keep: ['layout'],
  });
  kernel
    .keysInFacet('layout')
    .forEach((key) =>
      check(
        held[key] === source[key],
        `holding layout still re-rolled "${key}".`
      )
    );
}

// A build-in starts with only the chassis showing and ends on the settled
// panel; the plot of the default panel has line work.
function checkMotion({ panel: kernel }) {
  const config = kernel.sceneDefaults();
  const built = kernel.buildPanel(config);
  const risen = kernel.panelParts(built, config, {
    build: config.buildSeconds * 2,
    t: 1,
  });
  const settled = kernel.panelParts(built, config, { t: 1 });
  check(
    risen.length === settled.length,
    'a finished build-in does not draw the settled panel.'
  );
  check(
    kernel.riseAt(1, 0, config.buildSeconds) === 0 &&
      kernel.riseAt(0, config.buildSeconds, config.buildSeconds) === 1,
    'riseAt does not run from 0 to 1 over the build.'
  );
  const svg = kernel.renderPanelSvg({
    camera: kernel.frameView({
      bounds: kernel.panelBounds(built),
      detail: built.detail,
      options: { fov: 30, height: 400, margin: 0.06, width: 600 },
      view: 'hero',
    }),
    height: 400,
    parts: settled,
    width: 600,
  });
  check(
    (svg.match(/<path /gu) ?? []).length > 0,
    'the plot SVG of the default panel has no paths.'
  );
}

// Every hit on a rolled panel must change what is drawn: a press, a drag
// across it, or both. A dead hit is a control the hand cannot move.
function checkInteraction({ panel: kernel }) {
  const kinds = new Set();
  for (let i = 0; i < 12; i += 1) {
    const config =
      i === 0
        ? { ...kernel.sceneDefaults(), layoutMode: 'inventory' }
        : kernel.rollControlPanelConfig(`touch-${i}`);
    const built = kernel.buildPanel(config);
    const t = 2.5;
    const owner = new Map();
    built.modules.forEach((module) =>
      module.controls.forEach((control) => owner.set(control, module))
    );
    built.hits.forEach((hit) => {
      kinds.add(hit.kind);
      const alone = {
        ...built,
        modules: [owner.get(built.controls[hit.control])],
      };
      const drawn = (overrides) =>
        JSON.stringify(kernel.posePanel(alone, config, { overrides, t }));
      const overrides = new Map();
      const read = (key) =>
        kernel.readSignal(built, config, key, { overrides, t });
      const touched = new Set();
      const apply = (set) =>
        Object.entries(set).forEach(([key, value]) => {
          touched.add(key);
          if (value == null) overrides.delete(key);
          else overrides.set(key, value);
        });
      const reach = hit.r ?? Math.max(hit.hw, hit.hh);
      if (hit.requires) {
        overrides.set(`${hit.control}:${hit.requires.signal}`, 1);
      }
      const start = drawn(overrides);
      const { gesture, set } = kernel.pressHit(hit, [hit.x, hit.y], read);
      apply(set);
      let moved = drawn(overrides) !== start;
      if (gesture) {
        [1, -1].forEach((sign) => {
          apply(
            kernel.dragHit(gesture, [
              hit.x + sign * reach,
              hit.y + sign * reach,
            ])
          );
          moved ||= drawn(overrides) !== start;
        });
        if (hit.kind === 'step') {
          const click = kernel.pressHit(hit, [hit.x, hit.y], read).gesture;
          apply(kernel.releaseHit(click));
          moved ||= drawn(overrides) !== start;
        }
      }
      if (gesture) apply(kernel.releaseHit(gesture));
      const { id } = built.controls[hit.control];
      check(moved, `touch-${i}: a ${hit.kind} hit on ${id} moves nothing.`);
      const lost = [...touched].filter((key) => !overrides.has(key));
      check(
        lost.length === 0,
        `touch-${i}: letting go of a ${hit.kind} hit on ${id} hands ${lost.join(', ')} back to automation.`
      );
      check(
        kernel.pickHit(built, hit.x, hit.y) !== null,
        `touch-${i}: the centre of a ${hit.kind} hit on ${id} picks nothing.`
      );
    });
  }
  ['rotary', 'step', 'toggle', 'latch', 'linear', 'xy', 'pad', 'ball'].forEach(
    (kind) => check(kinds.has(kind), `no rolled panel has a ${kind} hit.`)
  );
}

// The Inventory layout must show every control the catalogue can roll, and
// fit on its panel.
function checkInventory({ panel: kernel }) {
  const listed = new Set(kernel.INVENTORY.map(({ id }) => id));
  [...Object.keys(kernel.UNITS), ...Object.keys(kernel.AREAS)].forEach((id) =>
    check(listed.has(id), `the Inventory leaves out "${id}".`)
  );
  const config = { ...kernel.sceneDefaults(), layoutMode: 'inventory' };
  const built = kernel.buildPanel(config);
  const ids = new Set(built.controls.map(({ id }) => id));
  kernel.INVENTORY.filter(({ id }) => id !== 'cluster').forEach(({ id }) =>
    check(ids.has(id), `the Inventory panel draws no "${id}".`)
  );
  check(
    kernel.panelParts(built, config, { t: 1 }).every(finite),
    'the Inventory panel has a non-finite part.'
  );
  const session = kernel.createPanelSession(built, {
    ...config,
    patchCableChance: 0,
  });
  const hit = built.hits.find((candidate) => candidate.kind === 'ball');
  const { gesture } = kernel.pressHit(hit, [hit.x, hit.y], session.read);
  session.beginGesture(hit);
  session.apply(
    kernel.dragHit(gesture, [hit.x + hit.r * 0.7, hit.y + hit.r * 0.3], 1 / 60)
  );
  const key = `${hit.control}:${hit.signals[0]}`;
  const held = session.read(key);
  session.apply(kernel.releaseHit(gesture));
  session.endGesture(gesture);
  session.step(0.1);
  check(
    session.read(key) > held,
    'the trackball stops immediately on release.'
  );
  session.beginGesture(hit);
  const stopped = session.read(key);
  session.step(0.1);
  check(
    session.read(key) === stopped,
    'grabbing the trackball does not stop inertia.'
  );
  session.releaseControls();
  session.dispose();
}

const glowOf = (part) => (part.e ? part.e[0] + part.e[1] + part.e[2] : 0);

// On the Inventory: a second press on a screen's cursor hands the pad back
// to its automation, every LED matrix mode lights some pixels but not all,
// and the HAL eye brightens with its lens dial.
function checkDisplays({ panel: kernel }) {
  const config = { ...kernel.sceneDefaults(), layoutMode: 'inventory' };
  const built = kernel.buildPanel(config);
  const session = kernel.createPanelSession(built, {
    ...config,
    patchCableChance: 0,
  });
  built.hits
    .filter((hit) => hit.kind === 'pad')
    .forEach((hit) => {
      const touch = `${hit.control}:${hit.signals[2]}`;
      const point = [hit.x + hit.hw * 0.4, hit.y - hit.hh * 0.3];
      session.apply(kernel.pressHit(hit, point, session.read).set);
      check(session.read(touch) > 0.5, `${hit.control}: a touch is not held.`);
      const nudge = [point[0] + hit.grab * 0.5, point[1]];
      session.apply(kernel.pressHit(hit, nudge, session.read).set);
      check(
        session.read(touch) < 0.5,
        `${hit.control}: pressing the cursor again keeps the touch.`
      );
    });
  session.dispose();

  const state = (t) => ({
    audio: Array.from({ length: 16 }, (_, i) => 0.3 + 0.4 * Math.sin(i + t)),
    step: Math.floor(t * 4),
    t,
  });
  const matrices = built.controls.filter(({ id }) => id === 'ledMatrix');
  check(
    matrices.length === kernel.MATRIX_MODES.length,
    'the Inventory does not show every LED matrix mode.'
  );
  matrices.forEach((control) => {
    const values = control.signals.map((s) => s.base);
    const lit = [1.3, 4.7, 7.3].map((t) => {
      const glows = control
        .pose(values, state(t))
        .filter(({ g }) => g === 'sphere')
        .map(glowOf);
      const floor = Math.min(...glows);
      return glows.filter((g) => g > floor * 4).length;
    });
    const mode =
      kernel.MATRIX_MODES[
        Math.round(values[0] * (kernel.MATRIX_MODES.length - 1))
      ];
    check(
      lit.some((n) => n > 0 && n < values.length - 1),
      `the ${mode} LED matrix lights nothing, or everything.`
    );
  });

  const matrixIn = (mode) =>
    matrices.find(
      (control) =>
        kernel.MATRIX_MODES[
          Math.round(control.signals[0].base * (kernel.MATRIX_MODES.length - 1))
        ] === mode
    );
  const lifeCtl = matrixIn('life');
  const quiet = lifeCtl.signals.map((s) => s.base);
  const run = (t, values) => JSON.stringify(lifeCtl.pose(values, state(t)));
  const before = run(3, quiet);
  const clicked = quiet.map((v, i) => (i >= 1 && i <= 12 ? 1 : v));
  const afterClick = run(3, clicked);
  check(
    afterClick !== before,
    'clicking Life pixels does not change the board.'
  );
  check(
    run(6, clicked) !== run(6, quiet),
    'Life ignores clicked cells as it steps on.'
  );

  const bounce = matrixIn('bounce');
  const cols = (bounce.signals.length - 1) / 7;
  const head = (t, values) =>
    bounce
      .pose(values, state(t))
      .filter(({ g }) => g === 'sphere')
      .map(glowOf)
      .reduce((best, g, i) => (g > best[0] ? [g, i] : best), [0, -1])[1];
  const firstX =
    head(
      0.05,
      bounce.signals.map((s) => s.base)
    ) % cols;
  const wallX = firstX + 2 < cols ? firstX + 2 : firstX - 2;
  const walled = bounce.signals.map((s, i) =>
    i > 0 && (i - 1) % cols === wallX ? 1 : s.base
  );
  const crossed = Array.from({ length: 120 }, (_, k) => head(k / 10, walled))
    .map((i) => i % cols)
    .some(
      (x) => Math.sign(x - wallX) !== Math.sign(firstX - wallX) && x !== wallX
    );
  check(!crossed, 'the bouncing ball passes through a lit column.');

  const rings = (control, values, t) =>
    control.pose(values, state(t)).filter(({ g }) => g === 'torus').length;
  const radar = built.controls.find(
    (control) =>
      control.id === 'screen' &&
      rings(control, [control.signals[0].base, 0.5, 0.5, 0], 1) === 3
  );
  const mode = radar.signals[0].base;
  rings(radar, [mode, 0.3, 0.6, 1], 5);
  check(
    rings(radar, [mode, 0.7, 0.2, 1], 6) === 5,
    'touching the radar does not place contacts.'
  );

  const pong = kernel.createPong(1, 0.7);
  const game = pong(240, null);
  check(
    game.returns > 4 && game.points > 0,
    `pong never rallies or never scores (${game.returns} returns, ${game.points} points).`
  );

  const mimicOf = (panel) => panel.controls.find(({ id }) => id === 'mimic');
  const mimic = mimicOf(built);
  const lamps = mimic.signals.map((s) => s.base);
  check(
    JSON.stringify(mimic.statics) ===
      JSON.stringify(mimicOf(kernel.buildPanel(config)).statics),
    'the mimic panel grows different track from the same seed.'
  );
  check(lamps.length >= 8, `the mimic panel has ${lamps.length} lamps.`);
  check(
    JSON.stringify(mimic.pose(lamps, state(1))) !==
      JSON.stringify(mimic.pose(lamps, state(3))),
    'no train runs on the mimic panel.'
  );

  built.controls
    .filter(({ id }) => id === 'telltales')
    .forEach((cluster) => {
      const unflipped = cluster.signals.map((s) => s.base);
      const frames = Array.from({ length: 120 }, (_, k) =>
        cluster.pose(unflipped, state(k * 0.5)).map(glowOf)
      );
      const per = frames[0].length;
      const lit = frames.map((glows) => glows.filter((g) => g > 0.05).length);
      check(
        lit.some((n) => n > 0) && lit.some((n) => n < per),
        'the telltale cluster never changes which warnings are lit.'
      );
    });

  const fanfold = built.controls.find(
    ({ id, signals }) => id === 'printer' && signals.length === 2
  );
  const folded = (t) =>
    fanfold.pose(
      fanfold.signals.map((s) => s.base),
      state(t)
    );
  const pile = (t) =>
    folded(t).filter(
      ({ g, s: size }) => g === 'box' && size[1] < 0.01 && size[2] > 0.2
    ).length;
  check(
    JSON.stringify(folded(0)) !== JSON.stringify(folded(3)),
    'the fanfold printer does not feed.'
  );
  check(
    pile(600) === pile(0) && pile(0) > 10,
    `the fanfold pile does not cap (${pile(0)} → ${pile(600)} pages).`
  );

  const deck = built.controls.find(({ id }) => id === 'reels');
  const deckKey = built.hits.find(
    (hit) =>
      built.controls[hit.control] === deck && Math.abs(hit.value - 0.5) < 1e-6
  );
  const deckRead = (key) => {
    const [owner, signal] = key.split(':').map(Number);
    return built.controls[owner].signals[signal].base;
  };
  const { set: stopped } = kernel.pressHit(deckKey, [0, 0], deckRead, 2);
  const deckValues = deck.signals.map(
    (s, i) => stopped[`${deckKey.control}:${i}`] ?? s.base
  );
  check(
    JSON.stringify(deck.pose(deckValues, state(5))) ===
      JSON.stringify(deck.pose(deckValues, state(9))),
    'STOP does not stop the reel-to-reel.'
  );

  const seconds = config.buildSeconds || 4;
  const early = [0, 1, 4].map((id) =>
    kernel.cableReveal(id, 5, seconds * 0.65, seconds)
  );
  const done = [0, 1, 4].map((id) =>
    kernel.cableReveal(id, 5, seconds, seconds)
  );
  check(
    early.every((v) => v === 0) && done.every((v) => v === 1),
    `cables do not wait for the modules in a build-in (${early} / ${done}).`
  );

  const hal = built.controls.find(({ id }) => id === 'hal');
  const eye = (glow) =>
    hal.pose([glow, 0], state(2)).reduce((sum, part) => sum + glowOf(part), 0);
  check(eye(1) > eye(0.1) * 2, 'the HAL eye does not brighten with its dial.');
}

// Packed controls (the Dial From Hell and dial clusters) must keep every
// part inside the plate they sit on, clear of its seams.
function checkPacking({ panel: kernel }) {
  for (let i = 0; i < 16; i += 1) {
    const config = {
      ...kernel.rollControlPanelConfig(`pack-${i}`),
      ...(i % 2 === 0 ? { layoutMode: 'pack' } : { clusterChance: 1 }),
    };
    const built = kernel.buildPanel(config);
    built.modules.forEach((module) => {
      const plate = module.statics[0];
      const [px, py] = isPlate(plate) ? plate.p : [0, 0];
      const [hw, hh] = isPlate(plate)
        ? plate.s
        : [
            built.bounds.max[0] - (config.enclosure ? 0.32 : 0),
            built.bounds.max[1] - (config.enclosure ? 0.32 : 0),
          ];
      module.controls
        .filter((control) => control.at)
        .forEach((control) => {
          const parts = [
            ...control.statics,
            ...(control.pose
              ? kernel.posePanel(
                  { ...built, modules: [{ ...module, controls: [control] }] },
                  config,
                  { t: 1 }
                )
              : []),
          ];
          const over = parts.find(
            (item) =>
              item.g !== 'torus' &&
              (Math.abs(item.p[0] - px) + Math.min(item.s[0], 0.5) >
                hw + 1e-3 ||
                Math.abs(item.p[1] - py) + Math.min(item.s[1], 0.5) > hh + 1e-3)
          );
          check(
            !over,
            `pack-${i}: a packed ${control.id} crosses its plate's edge.`
          );
        });
    });
  }
}

// A cable dragged from one jack and dropped on another patches the pair;
// a closed guard lid keeps its switch out of reach.
function checkPatchAndGuard({ panel: kernel }) {
  const config = { ...kernel.sceneDefaults(), layoutMode: 'inventory' };
  const built = kernel.buildPanel(config);
  const overrides = new Map();
  const read = (key) =>
    kernel.readSignal(built, config, key, { overrides, t: 1 });
  const session = kernel.createPanelSession(built, config);
  const solo = built.sockets.find(
    (socket) =>
      socket.family === 'eighth' &&
      built.controls[Number(socket.id.split(':')[0])].id === 'jack'
  );
  const bay = built.sockets.find(
    (socket) =>
      built.controls[Number(socket.id.split(':')[0])].id === 'patchBay'
  );
  check(
    Boolean(solo && bay),
    'Inventory is missing compatible solo and bay sockets.'
  );
  if (solo && bay) {
    check(
      kernel.compatibleSockets(solo, bay),
      'Solo and bay sockets cannot connect.'
    );
    const quarter = built.sockets.find((socket) => socket.family === 'quarter');
    check(
      kernel.compatibleSockets(quarter, bay),
      'Mixed-size sockets cannot connect.'
    );
  }
  if (solo && bay) {
    const fixture = {
      ...built,
      controls: [],
      sockets: [
        { ...solo, p: [-0.6, 0, 0.075] },
        { ...bay, p: [0.6, 0, 0.06] },
      ],
      bounds: { min: [-2, -2, -0.5], max: [2, 2, 0.6] },
    };
    const hand = kernel.createPanelSession(fixture, {
      ...config,
      patchCableChance: 0,
    });
    hand.spawn(solo.id);
    const { patch } = hand;
    const rope = patch.world.ropes[0];
    const last = rope.start + rope.count - 1;
    const free = Array.from(
      patch.world.positions.slice(last * 3, last * 3 + 3)
    );
    patch.begin({ cable: 0, end: 1 }, free);
    const initialLength = rope.length;
    patch.move([6, 0, 0.4]);
    check(
      Math.abs(patch.world.positions[last * 3] - 6) < 1e-6,
      'The grabbed plug does not immediately follow the cursor.'
    );
    check(
      rope.length > initialLength && patch.cables[0].length === rope.length,
      'Dragging beyond reach does not retain a longer cable.'
    );
    patch.move([0.6, 0, 0.4]);
    patch.release();
    check(
      patch.cables[0].ends[1] === bay.id,
      'Dragging a solo cable onto a bay does not connect it.'
    );
    patch.begin({ cable: 0, end: 1 }, [0.6, 0, 0.4]);
    patch.move([0.9, 0, 0.6]);
    patch.release();
    check(
      patch.cables[0].ends[1] == null && patch.cables[0].ends[0] === solo.id,
      'Unplugging one end changes the wrong attachments.'
    );
    patch.begin({ cable: 0, end: 0 }, [-0.6, 0, 0.4]);
    patch.move([-0.9, 0, 0.6]);
    patch.release();
    for (let i = 0; i < 480; i += 1) patch.step(1 / 120);
    check(
      patch.cables[0].ends.every((end) => end == null),
      'Both unplugged ends are not retained as a loose cable.'
    );
    check(
      patch.world.positions.every(
        (v, i) => Number.isFinite(v) && (i % 3 !== 1 || v >= patch.floor - 1e-6)
      ),
      'A loose cable escapes the invisible floor.'
    );
    const start = performance.now();
    for (let i = 0; i < 60; i += 1) session.patch.step(1 / 60);
    console.log(
      `Inventory rope physics: ${session.patch.cables.length} cables, ${session.patch.world.positions.length / 3} particles, ${((performance.now() - start) / 60).toFixed(2)} ms per 60 Hz step.`
    );
  }
  const quarter = built.sockets.find((socket) => socket.family === 'quarter');
  if (quarter && bay) {
    const inventoryHand = kernel.createPanelSession(built, {
      ...config,
      patchCableChance: 0,
    });
    const selection = inventoryHand.spawn(quarter.id);
    const { patch } = inventoryHand;
    const rope = patch.world.ropes[selection.cable];
    const end = rope.start + rope.count - 1;
    const start = Array.from(patch.world.positions.slice(end * 3, end * 3 + 3));
    patch.begin(selection, start);
    patch.move([100, 100, 3], bay.id);
    patch.release();
    check(
      patch.cables[0].ends[0] === quarter.id &&
        patch.cables[0].ends[1] === bay.id,
      'Inventory quarter-inch solo cannot patch into the distant eighth-inch bay.'
    );
    const stretched = inventoryHand.exportConfig();
    const copy = kernel.createPanelSession(
      kernel.buildPanel(stretched),
      stretched
    );
    check(
      copy.patch.cables[0].length === rope.length &&
        JSON.stringify(copy.patch.world.snapshot()) ===
          JSON.stringify(patch.world.snapshot()),
      'An extended mixed-size patch does not restore exactly.'
    );
  }
  const saved = session.exportConfig();
  const restored = kernel.createPanelSession(kernel.buildPanel(saved), saved);
  check(
    JSON.stringify(session.patch.world.snapshot()) ===
      JSON.stringify(restored.patch.world.snapshot()),
    'Saved rope state does not restore exactly.'
  );
  const used = session.patch.cables.flatMap((cable) =>
    cable.ends.filter(Boolean)
  );
  check(new Set(used).size === used.length, 'Generated cables share a socket.');
  check(
    session.patch.world.positions.every(Number.isFinite),
    'Settled rope has non-finite positions.'
  );

  const guarded = built.hits.find((hit) => hit.requires);
  check(Boolean(guarded), 'the Inventory has no guarded switch.');
  if (guarded) {
    const lid = `${guarded.control}:${guarded.requires.signal}`;
    overrides.set(lid, 0);
    check(
      kernel.pickHit(built, guarded.x, guarded.y, read) !== guarded,
      'a guarded switch can be reached with its lid shut.'
    );
    overrides.set(lid, 1);
    check(
      kernel.pickHit(built, guarded.x, guarded.y, read) === guarded,
      'a guarded switch cannot be reached with its lid open.'
    );
  }
}

const ROUND_PARTS = new Set([
  'cyl',
  'knurl',
  'cap',
  'sphere',
  'torus',
  'dish',
  'bullet',
]);

// A part's footprint on the panel face: a circle for a round part turned
// only about the panel's normal, else its turned box's corners. A rounded
// box's corners are pulled in along its own curve.
function footprint(kernel, item) {
  const [qx, qy] = item.q;
  if (item.g === 'face' && Math.abs(item.q[2]) < 1e-6) {
    return Array.from({ length: 16 }, (_, i) => {
      const [x, y] = kernel.faceRim((i / 16) * Math.PI * 2);
      return [item.p[0] + x * item.s[0], item.p[1] + y * item.s[1]];
    });
  }
  const ball =
    item.g === 'sphere' &&
    Math.abs(item.s[0] - item.s[1]) < 1e-6 &&
    Math.abs(item.s[1] - item.s[2]) < 1e-6;
  const upright = Math.abs(qx) < 1e-6 && Math.abs(qy) < 1e-6;
  if (ball || (ROUND_PARTS.has(item.g) && upright)) {
    const tube = item.g === 'torus' ? item.s[2] : 0;
    const turned = Math.abs(item.q[2]) > 1e-6;
    const reach = Math.max(item.s[0], item.s[1]) + tube;
    const [rx, ry] = turned
      ? [reach, reach]
      : [item.s[0] + tube, item.s[1] + tube];
    return Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2;
      return [item.p[0] + Math.cos(a) * rx, item.p[1] + Math.sin(a) * ry];
    });
  }
  const cut =
    item.g === 'rbox'
      ? kernel.rboxRadius(item.s, item.b) * (1 - Math.SQRT1_2)
      : 0;
  const [x, y, z, w] = item.q;
  const turn = (v) => {
    const tx = 2 * (y * v[2] - z * v[1]);
    const ty = 2 * (z * v[0] - x * v[2]);
    const tz = 2 * (x * v[1] - y * v[0]);
    return [
      v[0] + w * tx + (y * tz - z * ty),
      v[1] + w * ty + (z * tx - x * tz),
    ];
  };
  return Array.from({ length: 8 }, (_, i) => {
    const c = turn([
      (i % 2 ? 1 : -1) * (item.s[0] - cut),
      (Math.floor(i / 2) % 2 ? 1 : -1) * (item.s[1] - cut),
      (Math.floor(i / 4) ? 1 : -1) * item.s[2],
    ]);
    return [item.p[0] + c[0], item.p[1] + c[1]];
  });
}

// Inside a rounded box's outline, `margin` in from its edge.
function onBase(kernel, base, [px, py], margin) {
  const dx = Math.abs(px - base.p[0]);
  const dy = Math.abs(py - base.p[1]);
  const hx = base.s[0] - margin;
  const hy = base.s[1] - margin;
  if (dx > hx || dy > hy) return false;
  const r = base.g === 'rbox' ? kernel.rboxRadius(base.s, base.b) : 0;
  const cx = hx - r;
  const cy = hy - r;
  return dx <= cx || dy <= cy || (dx - cx) ** 2 + (dy - cy) ** 2 <= r * r;
}

// Every control keeps PLATE_MARGIN of bare plate inside its module's seams,
// and whatever sits on one of its own rounded bases stays BASE_MARGIN inside
// that base's outline (a printer's knobs, a screen's button, a jack's nut).
function checkMargins({ panel: kernel }) {
  const PLATE_MARGIN = 0.04;
  const BASE_MARGIN = 0.02;
  const offenders = new Map();
  const blame = (key) => offenders.set(key, (offenders.get(key) ?? 0) + 1);
  const configs = [
    { ...kernel.sceneDefaults(), layoutMode: 'inventory' },
    ...Array.from({ length: 30 }, (_, i) =>
      kernel.rollControlPanelConfig(`margin-${i}`)
    ),
  ];
  configs.forEach((config) => {
    const built = kernel.buildPanel(config);
    built.modules.forEach((module) => {
      const plate = module.statics[0];
      if (!isPlate(plate)) return;
      module.controls
        .filter((control) => !control.at)
        .forEach((control) => {
          const posed = control.pose
            ? kernel.posePanel(
                { ...built, modules: [{ ...module, controls: [control] }] },
                config,
                { t: kernel.STILL_TIME }
              )
            : [];
          const parts = [
            ...control.statics,
            ...(control.loose ? [] : posed),
          ].filter((item) => !kernel.SEE_THROUGH.has(item.g));
          const bases = control.statics.filter(
            (item) =>
              item.g === 'rbox' &&
              item.s[0] * item.s[1] > plate.s[0] * plate.s[1] * 0.45
          );
          parts.forEach((item) => {
            const points = footprint(kernel, item);
            const off = !points.every((point) =>
              onBase(kernel, plate, point, PLATE_MARGIN)
            );
            if (off) blame(`${control.id} ${item.g} over its plate's seam`);
            bases
              .filter(
                (base) =>
                  base !== item &&
                  item.p[2] >= base.p[2] &&
                  Math.abs(item.p[0] - base.p[0]) <= base.s[0] &&
                  Math.abs(item.p[1] - base.p[1]) <= base.s[1]
              )
              .forEach((base) => {
                if (
                  !points.every((point) =>
                    onBase(kernel, base, point, BASE_MARGIN)
                  )
                )
                  blame(`${control.id} ${item.g} over the edge of its base`);
              });
          });
        });
    });
  });
  offenders.forEach((count, what) =>
    failures.push(`margins: ${what} (${count}×).`)
  );
}

async function checkHeadlessCalls(barrels) {
  await Promise.all(
    HEADLESS.map(async (file) => {
      const source = await readFile(
        path.join(REPO_ROOT, 'scripts', file),
        'utf8'
      );
      [...source.matchAll(/\bkernel\.(panel|look)\.(\w+)/gu)].forEach(
        ([, barrel, name]) =>
          check(
            name in barrels[barrel],
            `${file} calls ${barrel}.${name}, which ${BARRELS[barrel]} does not export.`
          )
      );
    })
  );
}

// Every primitive's material must compile to valid WGSL (the Inventory
// panel draws them all) and draw something other than the backdrop.
async function checkRender({ look, panel: kernel }, THREE) {
  const size = 160;
  const headless = await createHeadlessRenderer({ height: size, width: size });
  const stage = look.createPanelStage({
    height: size,
    readFrame: headless.readFrame,
    renderer: headless.renderer,
    samples: 0,
    width: size,
  });
  const config = { ...kernel.sceneDefaults(), layoutMode: 'inventory' };
  const drawn = { config, name: 'check', panel: kernel.buildPanel(config) };
  const inventoryParts = drawn.panel.statics.concat(
    kernel.createPanelSession(drawn.panel, config).moving()
  );
  check(
    kernel.GEOMETRIES.every((g) => inventoryParts.some((item) => item.g === g)),
    'the Inventory panel does not draw every primitive, so the render check misses one.'
  );
  const bounds = stage.load(drawn);
  const view = kernel.frameView({
    bounds,
    options: { fov: 30, height: size, margin: 0.06, width: size },
    view: 'front',
  });
  const { device } = headless.renderer.backend;
  device.pushErrorScope('validation');
  const frame = await stage.capture(view, { t: 1 });
  const error = await device.popErrorScope();
  check(!error, `the rig fails validation: ${error?.message}`);
  const background = new THREE.Color(config.background);
  const lit = [];
  for (let i = 0; i < frame.data.length; i += 4) {
    const away =
      Math.abs(frame.data[i] - background.r * 255) +
      Math.abs(frame.data[i + 1] - background.g * 255) +
      Math.abs(frame.data[i + 2] - background.b * 255);
    if (away > 30) lit.push(i);
  }
  check(
    lit.length > size * size * 0.15,
    'the default panel draws almost nothing.'
  );
  const empty = { ...config, patchCableChance: 0 };
  stage.load({
    config: empty,
    name: 'no-cables',
    panel: kernel.buildPanel(empty),
  });
  device.pushErrorScope('validation');
  await stage.capture(view);
  const emptyError = await device.popErrorScope();
  check(
    !emptyError,
    `a panel with no cables fails GPU validation: ${emptyError?.message}`
  );
  stage.dispose();
  headless.dispose();
}

// Swap and Scroll shows: what they pose at a moment is the same whether
// played up to it or started there; every enabled swap kind plays and no
// disabled one does; the leaves always tile the panel; a square route
// closes after four legs; and the field covers every cell once and shows
// every catalogue entry it may (tiled: in one tile).
function checkSequences({ panel: kernel }, { PRESETS: presets }) {
  // Parts in world space; two shows mounted about different origins match
  // when every part has a twin within a thousandth of a cell.
  const world = (parts, offset = [0, 0]) =>
    parts.map((item) => [
      item.g,
      item.p[0] + offset[0],
      item.p[1] + offset[1],
      item.p[2],
    ]);
  const cell = ([g, ...p]) => [g, ...p.map((v) => Math.round(v * 1000))];
  const same = (a, b) => {
    if (a.length !== b.length) return false;
    const count = new Map();
    const take = (key) => {
      if (!count.get(key)) return false;
      count.set(key, count.get(key) - 1);
      return true;
    };
    b.forEach((item) => {
      const key = cell(item).join();
      count.set(key, (count.get(key) ?? 0) + 1);
    });
    // Exact twins first, so a near one never takes another's match.
    const left = a.filter((item) => !take(cell(item).join()));
    const near = [-1, 0, 1];
    return left.every((item) => {
      const [g, x, y, z] = cell(item);
      return near.some((dx) =>
        near.some((dy) =>
          near.some((dz) => take([g, x + dx, y + dy, z + dz].join()))
        )
      );
    });
  };
  // Kinds and toggles on a cable-free Shuffle (cables pin and cover
  // leaves, checked on their own below).
  const swap = {
    ...presets.Shuffle,
    panelCols: 18,
    panelRows: 10,
    patchCableChance: 0,
  };
  const tiles = (leaves, cols, rows) => {
    const cells = new Uint8Array(cols * rows);
    leaves.forEach((leaf) => {
      for (let { y } = leaf; y < leaf.y + leaf.h; y += 1)
        for (let { x } = leaf; x < leaf.x + leaf.w; x += 1)
          if (x >= 0 && y >= 0 && x < cols && y < rows)
            cells[y * cols + x] += 1;
    });
    return cells.every((n) => n === 1);
  };
  const play = (config, until, each) => {
    const show = kernel.createPanelShow(config);
    for (let r = Math.round(kernel.STILL_TIME * 10); r <= until * 10; r += 1)
      each(show, r / 10);
    return show;
  };
  const marks = new Map();
  const seen = new Set();
  let tiled = true;
  const dealt = new Set();
  play(swap, 70, (show, t) => {
    show.update(t);
    show.leaves.forEach((leaf) =>
      dealt.add(`${leaf.entry.id}:${leaf.entry.variant}`)
    );
    if (show.playing) seen.add(show.playing);
    else tiled &&= tiles(show.leaves, 18, 10);
    if (Math.round(t * 10) % 83 === 0) marks.set(t, world(show.pose({ t })));
  });
  const undealt = kernel.INVENTORY.filter(
    (entry) => !dealt.has(`${entry.id}:${entry.variant}`)
  );
  check(
    undealt.length === 0,
    `swap: ${undealt.map((e) => `${e.id}:${e.variant}`).join(', ')} never on the panel in 70 s of Shuffle.`
  );
  kernel.SWAP_KINDS.forEach((kind) =>
    check(seen.has(kind), `swap: no ${kind} played in 70 s of Shuffle.`)
  );
  check(tiled, 'swap: the settled leaves stopped tiling the panel.');
  marks.forEach((expected, t) => {
    const fresh = kernel.createPanelShow(swap);
    fresh.update(t);
    check(
      same(world(fresh.pose({ t })), expected),
      `swap: the panel at t = ${t} differs when started there.`
    );
  });
  kernel.SWAP_KINDS.forEach((only) => {
    const config = {
      ...swap,
      ...Object.fromEntries(
        kernel.SWAP_KINDS.map((kind) => [
          `swap${kind[0].toUpperCase()}${kind.slice(1)}`,
          kind === only,
        ])
      ),
    };
    const kinds = new Set();
    play(config, 40, (show, t) => {
      show.update(t);
      if (show.playing) kinds.add(show.playing);
    });
    check(
      kinds.size === 1 && kinds.has(only),
      `swap: with only ${only} enabled it played ${[...kinds].join(', ') || 'nothing'}.`
    );
  });

  const cabled = {
    ...presets.Shuffle,
    ...kernel.fitPanel({ x0: -9.2, x1: 9.2, y0: -4.9, y1: 4.9 }),
  };
  const patched = kernel.createPanelShow(cabled);
  const swapSession = kernel.createPanelSession(patched.panel, cabled, {
    show: patched,
  });
  patched.attach(swapSession);
  check(
    swapSession.patch.cables.length > 0,
    'swap: Shuffle has no cables on its pinned sockets.'
  );
  const swapped = new Set();
  for (let r = Math.round(kernel.STILL_TIME * 10); r <= 400; r += 1) {
    patched.update(r / 10);
    if (patched.playing) swapped.add(patched.playing);
  }
  check(
    swapped.size > 0,
    'swap: once its cables cover the panel nothing swaps at all.'
  );

  const scroll = presets.Survey;
  const square = kernel.createRoute({ ...scroll, scrollTurns: 'square' });
  const leg = scroll.scrollLeg;
  const from = square(1.5 * leg);
  const back = square(5.5 * leg);
  check(
    Math.hypot(back[0] - from[0], back[1] - from[1]) < 1e-6,
    'scroll: a square route does not come back round after four legs.'
  );
  ['Survey', 'Grand Tour'].forEach((name) => {
    const wander = kernel.createRoute(presets[name]);
    const trail = [];
    for (let t = 0; t <= 600; t += 1) trail.push(wander(t));
    const turned = trail.findIndex((p, i) =>
      trail
        .slice(0, Math.max(i - 60, 0))
        .some((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 12)
    );
    check(
      turned < 0,
      `scroll (${name}): the wander comes back within 12 cells of where it was a minute or more before (t = ${turned}).`
    );
  });
  Object.entries(kernel.PALETTES).forEach(([name, palette]) => {
    const preset = presets[name];
    check(
      preset &&
        Object.entries(palette).every(([key, value]) => preset[key] === value),
      `palettes: ${name} no longer matches the ${name} preset's colours.`
    );
  });
  const tour = kernel.createPanelShow(presets['Grand Tour']);
  const toured = tour.leavesIn({ x0: -100, x1: 100, y0: -100, y1: 100 });
  const worn = new Set(toured.map((leaf) => leaf.palette));
  check(
    toured.every((leaf) => kernel.PALETTES[leaf.palette]) &&
      worn.size >= Object.keys(kernel.PALETTES).length - 1,
    `palettes: Grand Tour's field wears ${worn.size} palettes over 200 × 200 cells.`
  );
  const view = { x0: -9, x1: 9, y0: -5, y1: 5 };
  [
    presets.Conveyor,
    presets['Conveyor Loop'],
    presets.Survey,
    presets['Grand Tour'],
  ].forEach((config) => {
    const stepped = kernel.createPanelShow(config);
    [6, 19.7, 41.3].forEach((t) => {
      for (let r = 0; r < 12; r += 1) stepped.update(t - (12 - r) / 30, view);
      stepped.update(t, view);
      const fresh = kernel.createPanelShow(config);
      fresh.update(t, view);
      check(
        same(
          world(stepped.pose({ t }), stepped.offset),
          world(fresh.pose({ t }), fresh.offset)
        ),
        `scroll (${config.scrollTurns}${config.scrollTiled ? ', tiled' : ''}): the panel at t = ${t} differs when started there.`
      );
    });
    // A jump in t lands on chunks whose cables have not baked yet: they
    // join once the bakes catch up.
    for (let r = 0; r < 3000 && !stepped.patch?.cables.length; r += 1)
      stepped.update(41.3, view);
    const { patch } = stepped;
    const ids = new Set(stepped.panel.sockets.map((socket) => socket.id));
    check(
      patch?.cables.length > 0 &&
        patch.cables.every((cable) =>
          cable.ends.every((end) => end == null || ids.has(end))
        ),
      `scroll (${config.scrollTurns}${config.scrollTiled ? ', tiled' : ''}): no cables, or a cable plugged into a socket that is not there.`
    );
    const box = config.scrollTiled
      ? { x0: 0, x1: 60, y0: -60, y1: 0 }
      : { x0: -60, x1: 60, y0: -40, y1: 40 };
    const leaves = stepped.leavesIn(box);
    const w = box.x1 - box.x0;
    const cells = new Uint8Array(w * (box.y1 - box.y0));
    leaves.forEach((leaf) => {
      for (let y = leaf.box.y0; y < leaf.box.y1; y += 1)
        for (let x = leaf.box.x0; x < leaf.box.x1; x += 1)
          if (x >= box.x0 && x < box.x1 && y >= box.y0 && y < box.y1)
            cells[(y - box.y0) * w + x - box.x0] += 1;
    });
    check(
      cells.every((n) => n === 1),
      `scroll: the field leaves gaps or overlaps (${config.scrollTiled ? 'tiled' : 'untiled'}).`
    );
    const shown = new Set(
      leaves.map((leaf) => `${leaf.entry.id}:${leaf.entry.variant}`)
    );
    const missing = kernel.INVENTORY.filter(
      (entry) => !shown.has(`${entry.id}:${entry.variant}`)
    );
    check(
      missing.length === 0,
      `scroll: ${missing.map((e) => `${e.id}:${e.variant}`).join(', ')} never appear in ${config.scrollTiled ? 'the tile' : 'a 120 × 80 stretch'}.`
    );
  });
}

async function main() {
  await checkKernelPurity();
  await checkWorkbenchPage(PAGE, RENDER_OPTIONS, check);

  const { THREE } = await loadThree();
  const loaded = await loadModules([PRESETS, ...Object.values(BARRELS)]);
  const barrels = Object.fromEntries(
    Object.entries(BARRELS).map(([name, entry]) => [name, loaded[entry]])
  );
  checkRigDefaults(barrels);
  checkPresets(loaded[PRESETS]);
  checkRolls(barrels);
  checkMotion(barrels);
  checkInteraction(barrels);
  checkInventory(barrels);
  checkDisplays(barrels);
  checkPacking(barrels);
  checkMargins(barrels);
  checkPatchAndGuard(barrels);
  checkSequences(barrels, loaded[PRESETS]);
  await checkHeadlessCalls(barrels);
  await checkRender(barrels, THREE);

  failures.push(...(await schemaControlCoverage(CONTROLS)));
  if (failures.length > 0) {
    console.error(`control-panel:check failed (${failures.length}):\n`);
    failures.forEach((message) => console.error(`  ✗ ${message}`));
    process.exit(1);
  }
  console.log(
    'control-panel:check — kernel, rig, scene, CLIs and workbench agree.'
  );
  process.exit(0);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
