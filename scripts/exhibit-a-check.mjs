#!/usr/bin/env node

/* eslint-disable no-console */
// Drift alarm for the ExhibitA pipeline: the scene, the CLIs and the
// workbench must agree with the kernel they share, every exhibit must build,
// compile and draw, and each ray-marched exhibit's silhouette must match its
// CPU solid field. See docs/exhibit-a-pipeline.md.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  EXHIBITS,
  FAMILIES,
  FAMILY_KINDS,
  LEVA_KEYS,
  MATERIALS,
  RENDER_OPTIONS,
  SCENE_KEYS,
  VIDEO_MODES,
  VIEWS,
  kindKey,
  normalizeOptions,
  sceneDefaults,
} from '../src/modules/exhibitA/renderOptions.mjs';
import {
  createExhibitCapturer,
  loadKernel,
  sidecarFor,
} from './lib/exhibitARender.mjs';
import loadModules, { REPO_ROOT } from './lib/loadModules.mjs';
import checkWorkbenchPage from './lib/workbenchPage.mjs';

const KERNEL_DIR = path.join(REPO_ROOT, 'src', 'modules', 'exhibitA');
const PRESETS = '/src/components/scenes/WebGPU/ExhibitA/presets/presets.js';
const HEADLESS = [
  'lib/exhibitARender.mjs',
  'exhibit-a-generate.mjs',
  'exhibit-a-video.mjs',
];
const BARRELS = {
  exhibit: '/src/modules/exhibitA/index.js',
  look: '/src/modules/exhibitARender/index.js',
  post: '/src/modules/postRig/index.js',
};
const PAGE_FIELDS = path.join(
  REPO_ROOT,
  'src/dev/tools/exhibitA/ExhibitAWorkbenchPage.jsx'
);
const ALLOWED_KERNEL_IMPORTS = new Set(['@modules/apollian', '@modules/flora']);
const CAMERA_KEY = /^(camera|orbit|fixed|spline|operator)/u;
const ROLLS = 400;
const DRAW_SIZE = 96;
const PARITY_SIZE = 128;
const PARITY_AGREEMENT = 0.985;

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

const exhibits = FAMILIES.flatMap((family) =>
  EXHIBITS[family].map((id) => ({ family, id }))
);
const configFor = ({ family, id }, over = {}) => ({
  ...sceneDefaults(),
  family,
  [kindKey(family)]: id,
  ...over,
});

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
            `kernel purity: ${name} imports "${specifier}" — rendering code belongs in @modules/exhibitARender.`
          )
        );
    })
  );
}

function checkRigDefaults({ look, post }) {
  const { slots } = post.buildScenePostRuntimeConfig(look.EXHIBIT_A_POST);
  const bloom = slots.find((entry) => entry.id === 'bloom');
  const grade = slots.find((entry) => entry.id === 'grade');
  const expected = {
    postBloomEnabled: bloom?.enabled,
    postBloomStrength: bloom?.strength,
    postBloomThreshold: bloom?.threshold,
    postGradeEnabled: grade?.enabled,
    postGradeLetterbox: grade?.letterbox,
    postGradeTint: grade?.tint,
    postGradeVignette: grade?.vignette,
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

const exhibitKey = (preset) => preset[kindKey(preset.family)];

// Leva keeps a value a preset leaves out, so a hand-written preset that
// skips a control inherits it from whichever preset was showing before.
function checkPresets({ DEFAULT_PRESET, PRESETS: presets }) {
  check(
    DEFAULT_PRESET in presets,
    `DEFAULT_PRESET "${DEFAULT_PRESET}" is missing.`
  );
  const scene = new Set(SCENE_KEYS);
  const shown = new Set(Object.values(presets).map(exhibitKey));
  exhibits.forEach(({ id }) =>
    check(shown.has(id), `no preset puts the "${id}" exhibit on the plinth.`)
  );
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
    check(
      EXHIBITS[preset.family]?.includes(preset[kindKey(preset.family)]),
      `preset "${name}" names no exhibit of its family.`
    );
    Object.entries(preset).forEach(([key, value]) => {
      const spec = RENDER_OPTIONS[key];
      if (spec?.type === 'number') {
        check(
          value >= spec.min && value <= spec.max,
          `preset "${name}" sets ${key} = ${value}, outside [${spec.min}, ${spec.max}] — Leva would clamp it.`
        );
      }
      if (spec?.type === 'enum') {
        check(
          spec.choices.includes(value),
          `preset "${name}" sets ${key} = "${value}", not one of its choices.`
        );
      }
    });
  });
}

// Every exhibit has a way to be built and a motion to evolve with; every
// motion step walks a real, numeric knob.
function checkRegistry({ exhibit }) {
  exhibits.forEach(({ family, id }) => {
    check(
      Boolean(FAMILY_KINDS[family]),
      `family "${family}" has no entry in FAMILY_KINDS.`
    );
    check(
      id in exhibit.EVOLVE,
      `"${id}" has no entry in EVOLVE (it would fall back to a spin).`
    );
    const spec = RENDER_OPTIONS[kindKey(family)];
    check(
      spec?.choices.includes(id),
      `${kindKey(family)} does not offer "${id}".`
    );
    if (FAMILY_KINDS[family] === 'field' && !exhibit.isGuest(id)) {
      check(id in exhibit.FIELD_EXHIBITS, `field exhibit "${id}" has no core.`);
    }
  });
  Object.entries(exhibit.EVOLVE).forEach(([id, steps]) => {
    check(
      exhibits.some((entry) => entry.id === id),
      `EVOLVE names "${id}", which is not an exhibit.`
    );
    steps.forEach((step) =>
      check(
        RENDER_OPTIONS[step.key]?.type === 'number',
        `EVOLVE "${id}" walks "${step.key}", which is not a numeric option.`
      )
    );
  });
  VIDEO_MODES.forEach((mode) =>
    check(
      RENDER_OPTIONS.mode.choices.includes(mode),
      `video mode "${mode}" is not offered by the CLI.`
    )
  );
  VIEWS.forEach((view) =>
    check(
      RENDER_OPTIONS.views.help.includes(view),
      `view "${view}" is not in the views help.`
    )
  );
}

// Rolls stay in range, validate, reach every exhibit, and the first one of
// each builds; holding a facet leaves it alone.
function checkRolls({ exhibit, look }) {
  const palettes = look.PALETTE_NAMES.filter(
    (name) => (look.getPaletteStops(name)?.length ?? 0) >= 2
  );
  const firstSeen = new Map();
  for (let i = 0; i < ROLLS; i += 1) {
    const config = exhibit.rollExhibitConfig(`check-${i}`, { palettes });
    const id = exhibit.exhibitOf(config);
    if (!firstSeen.has(id)) firstSeen.set(id, config);
    Object.entries(config)
      .filter(([key]) => RENDER_OPTIONS[key]?.type === 'number')
      .forEach(([key, value]) => {
        const { max, min } = RENDER_OPTIONS[key];
        check(
          value >= min && value <= max,
          `roll check-${i} sets ${key} = ${value}, outside [${min}, ${max}].`
        );
      });
    if (i < 24) {
      try {
        normalizeOptions('still', config);
      } catch (error) {
        failures.push(`roll check-${i} fails validation: ${error.message}`);
      }
    }
  }
  exhibits.forEach(({ id }) =>
    check(firstSeen.has(id), `${ROLLS} rolls never reached "${id}".`)
  );

  firstSeen.forEach((config, id) => {
    try {
      const build = exhibit.buildExhibit(config);
      if (build.kind === 'mesh') {
        const vertices = Object.values(build.parts).reduce(
          (sum, part) => sum + part.positions.length / 3,
          0
        );
        check(vertices > 0, `rolled "${id}" builds no geometry.`);
        check(
          Object.values(build.parts).every((part) =>
            part.positions.every(Number.isFinite)
          ),
          `rolled "${id}" builds non-finite positions.`
        );
        check(
          build.radius > 0 && build.radius < 1.05,
          `rolled "${id}" has radius ${build.radius}, outside the unit ball.`
        );
      } else {
        const field = exhibit.createExhibitField(config);
        check(
          Number.isFinite(field.distance([0.1, 0.2, 0.3])),
          `rolled "${id}" has a non-finite field.`
        );
      }
    } catch (error) {
      failures.push(`rolled "${id}" fails to build: ${error.message}`);
    }
  });

  const source = exhibit.rollExhibitConfig('b', { palettes });
  const held = exhibit.rollExhibitConfig('a', {
    base: source,
    keep: ['form'],
    palettes,
  });
  exhibit
    .keysInFacet('form')
    .forEach((key) =>
      check(held[key] === source[key], `holding form still re-rolled "${key}".`)
    );

  const sidecar = sidecarFor({ config: source, name: 'check', options: {} });
  const restored = exhibit.configFrom(sidecar);
  SCENE_KEYS.forEach((key) =>
    check(
      restored[key] === source[key],
      `a props.json does not restore "${key}" as a preset.`
    )
  );
}

// An evolve step must stay in each knob's range and keep the exhibit valid.
function checkMotion({ exhibit }) {
  exhibits.forEach((entry) => {
    const config = configFor(entry);
    [0, 3.7, 11, 29].forEach((seconds) => {
      let walked = null;
      try {
        walked = exhibit.evolveConfig(config, seconds);
      } catch (error) {
        failures.push(`${entry.id} cannot evolve: ${error.message}`);
        return;
      }
      Object.entries(walked)
        .filter(([key]) => RENDER_OPTIONS[key]?.type === 'number')
        .forEach(([key, value]) => {
          const { max, min } = RENDER_OPTIONS[key];
          check(
            value >= min - 1e-9 && value <= max + 1e-9,
            `${entry.id} evolves ${key} to ${value} at ${seconds}s, outside [${min}, ${max}].`
          );
        });
    });
  });
  const config = configFor(exhibits[0], { drawHold: 3, drawSeconds: 10 });
  check(exhibit.drawProgress(config, 0) === 0, 'a draw does not start at 0.');
  check(exhibit.drawProgress(config, 10) === 1, 'a draw does not reach 1.');
  check(exhibit.drawProgress(config, 12) === 1, 'a draw does not hold at 1.');
  check(exhibit.drawProgress(config, 13) === 0, 'a draw does not restart.');
}

async function checkHeadlessCalls(barrels) {
  await Promise.all(
    HEADLESS.map(async (file) => {
      const source = await readFile(
        path.join(REPO_ROOT, 'scripts', file),
        'utf8'
      );
      [...source.matchAll(/\b(?:kernel\.)?(exhibit|look|post)\.(\w+)/gu)]
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
  await checkWorkbenchPage(PAGE_FIELDS, RENDER_OPTIONS, check);
}

const DRAW_OPTIONS = {
  height: DRAW_SIZE,
  margin: 0.1,
  projection: 'perspective',
  fov: 30,
  width: DRAW_SIZE,
};

const spread = (frame) => {
  let edges = 0;
  for (let i = 4; i < frame.data.length; i += 4) {
    const step =
      Math.abs(frame.data[i] - frame.data[i - 4]) +
      Math.abs(frame.data[i + 1] - frame.data[i - 3]) +
      Math.abs(frame.data[i + 2] - frame.data[i - 2]);
    edges += step > 6 ? 1 : 0;
  }
  return edges;
};

// Every exhibit with every material must build its pipeline without a WGSL
// validation error and light something. Field materials compile per
// exhibit and material, so this is the whole cross product.
async function checkDraw(kernel) {
  const { exhibit } = kernel;
  const capturer = await createExhibitCapturer(kernel, {
    height: DRAW_SIZE,
    samples: 0,
    width: DRAW_SIZE,
  });
  const { device } = capturer.renderer.backend;
  const quiet = {
    postBloomEnabled: false,
    postGradeEnabled: false,
  };
  // eslint-disable-next-line no-restricted-syntax
  for (const entry of exhibits) {
    // eslint-disable-next-line no-restricted-syntax
    for (const material of MATERIALS) {
      const config = configFor(entry, { ...quiet, material });
      const label = `${entry.id} ${material}`;
      device.pushErrorScope('validation');
      let frame = null;
      try {
        const stops = kernel.look.getPaletteStops(config.paletteName);
        const layout = capturer.load({ config, name: label, stops });
        // eslint-disable-next-line no-await-in-loop
        frame = await capturer.capture(
          exhibit.frameView({
            layout,
            options: DRAW_OPTIONS,
            view: 'hero',
          })
        );
      } catch (error) {
        failures.push(`${label} fails to draw: ${error.message}`);
      }
      // eslint-disable-next-line no-await-in-loop
      const error = await device.popErrorScope();
      check(!error, `${label} fails validation: ${error?.message}`);
      if (frame) {
        check(spread(frame) > DRAW_SIZE * 4, `${label} draws a flat frame.`);
      }
    }
  }
  capturer.dispose();
}

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const unit = (a) => {
  const n = Math.hypot(...a);
  return [a[0] / n, a[1] / n, a[2] / n];
};

// Sphere-traces one orthographic ray through the CPU field. 1 = hit,
// 0 = miss, null = never settled.
function castRay({ field, mt, origin, direction, radius, size }) {
  const toObject = (p) => {
    const q = [p[0] / size, p[1] / size, p[2] / size];
    return [
      dot(mt.slice(0, 3), q),
      dot(mt.slice(3, 6), q),
      dot(mt.slice(6, 9), q),
    ];
  };
  const along = dot(origin, direction);
  const miss = Math.hypot(
    ...sub(
      origin,
      direction.map((d) => d * along)
    )
  );
  const reach = radius * size;
  if (miss >= reach) return 0;
  const half = Math.sqrt(reach * reach - miss * miss);
  let t = -along - half;
  const end = -along + half;
  for (let step = 0; step < 400 && t <= end; step += 1) {
    const here = t;
    const p = origin.map((o, k) => o + direction[k] * here);
    const s = field.distance(toObject(p)) * size;
    if (s < 4e-4 * reach) return 1;
    t += Math.max(s * 0.9, 1e-5 * reach);
  }
  return t > end ? 0 : null;
}

// A ray-marched exhibit drawn twice, on black and on white, is covered
// wherever the two frames agree; the CPU field's own orthographic rays must
// cover the same pixels.
async function checkParity(kernel) {
  const { exhibit } = kernel;
  const size = PARITY_SIZE;
  const options = {
    fov: 30,
    height: size,
    margin: 0.05,
    projection: 'orthographic',
    width: size,
  };
  const capturer = await createExhibitCapturer(kernel, {
    height: size,
    samples: 0,
    width: size,
  });
  const bare = {
    floorEnabled: false,
    mount: false,
    plinth: 'none',
    postBloomEnabled: false,
    postGradeEnabled: false,
  };
  // eslint-disable-next-line no-restricted-syntax
  for (const entry of exhibits.filter(
    ({ family }) => FAMILY_KINDS[family] === 'field'
  )) {
    const config = configFor(entry, bare);
    const layout = capturer.load({
      config,
      name: entry.id,
      stops: kernel.look.getPaletteStops(config.paletteName),
    });
    const aimed = exhibit.frameView({ layout, options, view: 'front' });
    const frames = [];
    // Only the backdrop changes between the frames: the studio lighting was
    // baked from the config's own background by `load`.
    // eslint-disable-next-line no-restricted-syntax
    for (const background of ['#000000', '#ffffff']) {
      capturer.scene.background = new kernel.THREE.Color(background);
      // eslint-disable-next-line no-await-in-loop
      frames.push(await capturer.capture(aimed));
    }
    const view = aimed;
    const forward = unit(sub(view.target, view.eye));
    const right = unit(cross(forward, view.up));
    const up = cross(right, forward);
    const m = exhibit.objectRotation(config.objectTilt, config.objectSpin);
    const mt = [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];
    const field = exhibit.createExhibitField(config);
    const radius = layout.radius / layout.size;
    const cpu = new Array(size * size);
    for (let j = 0; j < size; j += 1) {
      for (let i = 0; i < size; i += 1) {
        const x = ((i + 0.5) / size) * 2 - 1;
        const y = 1 - ((j + 0.5) / size) * 2;
        const origin = view.eye.map(
          (e, k) =>
            e + right[k] * x * view.halfWidth + up[k] * y * view.halfHeight
        );
        cpu[j * size + i] = castRay({
          direction: forward,
          field,
          mt,
          origin,
          radius,
          size: layout.size,
        });
      }
    }
    let agree = 0;
    let decided = 0;
    let covered = 0;
    for (let j = 1; j < size - 1; j += 1) {
      for (let i = 1; i < size - 1; i += 1) {
        const at = j * size + i;
        const mine = cpu[at];
        // An edge pixel could go either way; only interior and exterior
        // pixels, whose neighbours agree, are decided.
        const settled =
          mine !== null &&
          [at - 1, at + 1, at - size, at + size].every((n) => cpu[n] === mine);
        if (settled) {
          const gap =
            Math.abs(frames[0].data[at * 4] - frames[1].data[at * 4]) +
            Math.abs(frames[0].data[at * 4 + 1] - frames[1].data[at * 4 + 1]);
          const gpu = gap < 100 ? 1 : 0;
          decided += 1;
          covered += mine;
          if (gpu === mine) agree += 1;
        }
      }
    }
    const share = decided > 0 ? agree / decided : 0;
    check(
      covered > size * 2,
      `${entry.id}: the CPU field covers almost nothing (${covered} px).`
    );
    check(
      share >= PARITY_AGREEMENT,
      `${entry.id}: the GPU silhouette agrees with the CPU field on only ${(share * 100).toFixed(1)}% of pixels.`
    );
  }
  capturer.dispose();
}

async function main() {
  await checkKernelPurity();
  await checkPageFields();

  const kernel = await loadKernel();
  const scene = await loadModules([PRESETS]);
  const barrels = {
    exhibit: kernel.exhibit,
    look: kernel.look,
    post: kernel.post,
  };
  checkRigDefaults(barrels);
  checkPresets(scene[PRESETS]);
  checkRegistry(barrels);
  checkRolls(barrels);
  checkMotion(barrels);
  await checkHeadlessCalls(barrels);
  await checkDraw(kernel);
  await checkParity(kernel);

  if (failures.length > 0) {
    console.error(`exhibit-a:check failed (${failures.length}):\n`);
    failures.forEach((message) => console.error(`  ✗ ${message}`));
    process.exit(1);
  }
  console.log(
    'exhibit-a:check — kernel, rig, scene, CLIs and workbench agree.'
  );
  process.exit(0);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
