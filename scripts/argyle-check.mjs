#!/usr/bin/env node

/* eslint-disable no-console, no-restricted-syntax, no-await-in-loop */
import { readFile, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import process from 'node:process';

import {
  RENDER_OPTIONS,
  defaultsFor,
} from '../src/modules/argyle/renderOptions.mjs';
import loadModules from './lib/loadModules.mjs';
import schemaControlCoverage from './lib/schemaControlCoverage.mjs';
import checkWorkbenchPage from './lib/workbenchPage.mjs';

// Scene controls whose schema folders the presets are applied through.
const CONTROLS = ['/src/components/scenes/WebGPU/Argyle/utils/controls.js'];

const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};
const entry = '/src/modules/argyle/index.js';
const presetEntry = '/src/components/scenes/WebGPU/Argyle/presets/presets.js';
const controlsEntry = '/src/components/scenes/WebGPU/Argyle/utils/controls.js';
const lookEntry = '/src/modules/argyleRender/index.js';
const cameraEntry = '/src/modules/cameraRig/index.js';
const lightingEntry = '/src/modules/lightingRig/index.js';
const loaded = await loadModules([
  entry,
  presetEntry,
  controlsEntry,
  lookEntry,
  cameraEntry,
  lightingEntry,
]);
const {
  [entry]: k,
  [presetEntry]: presets,
  [lookEntry]: look,
  [cameraEntry]: camera,
  [lightingEntry]: lighting,
} = loaded;
const leva = createRequire(import.meta.url)('leva');
const [, mappedPaths] = leva.levaStore.getDataFromSchema({
  preset: {
    value: presets.DEFAULT_PRESET,
    options: Object.keys(presets.PRESETS),
  },
  Camera: leva.folder(
    camera.buildSceneCameraControls({
      camera: look.CAMERA,
      includeCopyCurrentCamera: false,
    }),
    { collapsed: true }
  ),
  Lighting: leva.folder(
    lighting.buildSceneLightingControls({ lighting: look.LIGHTING }),
    { collapsed: true }
  ),
  ...loaded[controlsEntry].default({}, () => {}),
});
const checkPresetKeys = (name, values) =>
  Object.keys(values).forEach((key) =>
    check(key in mappedPaths, `${name}: ${key} has no registered Leva control`)
  );
Object.entries(presets.PRESETS).forEach(([presetName, presetSnapshot]) => {
  const applied = presets.getPresetControls({ presetName, presetSnapshot });
  checkPresetKeys(presetName, applied);
  Object.entries(presetSnapshot).forEach(([key, value]) =>
    check(
      JSON.stringify(applied[key]) === JSON.stringify(value),
      `${presetName}: preset adapter lost ${key}`
    )
  );
});
const defaults = k.sceneDefaults();
const options = {
  ...defaultsFor('still', 'workbench'),
  width: 400,
  height: 400,
};
const signatures = new Set();
const styleCounts = new Map();
let columnRolls = 0;
let houseRolls = 0;
let diamondRolls = 0;
for (let i = 0; i < 2000; i += 1) {
  const c = k.rollConfig(`audit-${i}`);
  signatures.add(JSON.stringify(c));
  const style = `${c.lowerStyle}/${c.upperStyle}`;
  styleCounts.set(style, (styleCounts.get(style) ?? 0) + 1);
  if (c.pattern === 'column') columnRolls += 1;
  if (c.pattern === 'logo') houseRolls += 1;
  if (c.rotation === 45) diamondRolls += 1;
  check(c.rows > c.columns, `roll ${i} is not a vertical column`);
  Object.entries(c).forEach(([key, value]) => {
    const item = RENDER_OPTIONS[key];
    if (item?.type === 'number')
      check(
        Number.isFinite(value) && value >= item.min && value <= item.max,
        `${key} out of range at ${i}`
      );
  });
}
check(signatures.size === 2000, 'batch roll repeats a config');
check(
  columnRolls > 1400 && diamondRolls === 2000,
  'rolls do not preserve upright diamond columns'
);
check(
  houseRolls > 250 && houseRolls < 600,
  'house mark roll frequency drifted'
);
check(
  styleCounts.size === 4 &&
    [...styleCounts.values()].every((count) => count > 250),
  'a filled/hollow layer combination is missing from rolls'
);
console.log(
  `Roll sample: ${columnRolls}/2000 vertical columns, ${houseRolls} house marks, ${diamondRolls} at 45 degrees; layers ${JSON.stringify(Object.fromEntries(styleCounts))}`
);
check(
  k.rollConfig('row-pin', { pinned: { rows: 48 } }).rows === 48,
  'explicit row count was overwritten'
);
check(
  k.rollConfig('both-pins', { pinned: { rows: 8, columns: 24 } }).columns ===
    24,
  'explicit aspect pins were overwritten'
);
const repeated = k.rollConfig('repeat');
check(
  JSON.stringify(repeated) === JSON.stringify(k.rollConfig('repeat')),
  'roll is not reproducible'
);
const a = k.rollConfig('facet-a');
const held = k.rollConfig('facet-b', { base: a, keep: ['color'] });
k.keysInFacet('color').forEach((key) =>
  check(a[key] === held[key], `held colour changed: ${key}`)
);
check(
  k.rollConfig('pin', { pinned: { coverage: 1, dimension: 'flat' } })
    .coverage === 1,
  'pin was lost'
);
for (const motion of k.MOTIONS) {
  const field = k.createField({
    ...defaults,
    dimension: 'extruded',
    motion,
    columns: 8,
    rows: 8,
  });
  const start = field.update(0).slice();
  const end = field.update(defaults.loopSeconds);
  check(
    start.every((v, i) => Math.abs(v - end[i]) < 1e-5),
    `${motion} loop seam`
  );
  check(end.every(Number.isFinite), `${motion} non-finite geometry`);
  const middle = field.update(defaults.loopSeconds * 0.37);
  check(
    start.some((v, i) => Math.abs(v - middle[i]) > 0.01),
    `${motion} has no motion`
  );
}
for (const coverage of [0, 1]) {
  const field = k.createField({ ...defaults, coverage });
  field.tiles.forEach((_, i) =>
    check(
      field.data[i * k.STRIDE + 7] === coverage,
      `coverage ${coverage} endpoint failed`
    )
  );
}
for (const [lowerStyle, upperStyle] of [
  ['filled', 'filled'],
  ['hollow', 'filled'],
  ['filled', 'hollow'],
  ['hollow', 'hollow'],
]) {
  for (const dimension of ['flat', 'relief', 'extruded']) {
    const field = k.createField({
      ...defaults,
      dimension,
      lowerStyle,
      upperStyle,
      columns: 6,
      rows: 6,
      coverage: 1,
    });
    for (const projection of ['orthographic', 'perspective']) {
      const view = k.frameView({
        bounds: field.bounds,
        options: { ...options, projection },
        view: 'hero',
      });
      for (const svgStyle of ['outline', 'hatch', 'filled']) {
        const svg = k.renderSvg(field, view, { ...options, svgStyle });
        check(
          svg.includes('<path'),
          `${dimension}/${projection}/${svgStyle} has no vectors`
        );
        check(
          !/NaN|Infinity/u.test(svg),
          `${dimension}/${projection}/${svgStyle} invalid vector coordinates`
        );
      }
    }
  }
}
const savedView = k.frameView({
  bounds: k.createField(defaults).bounds,
  options,
  view: 'hero',
});
const savedConfig = { ...defaults, cameraFrame: savedView };
checkPresetKeys('Captured camera', k.presetFromConfig(savedConfig));
const reframed = k.frameView({
  bounds: k.createField(savedConfig).bounds,
  options,
  view: 'front',
});
check(
  JSON.stringify(reframed.eye) === JSON.stringify(savedView.eye),
  'captured camera was lost'
);
check(
  JSON.stringify(k.presetFromConfig(savedConfig).orbitDesktopPosition) ===
    JSON.stringify(savedView.eye),
  'scene preset camera adapter drifted'
);
const upright = k.createField({ ...defaults, coverage: 1, amplitude: 0 });
check(
  upright.bounds.max[1] > upright.bounds.max[0] * 1.7,
  'default composition is not portrait'
);
const pointKey = (x, y) =>
  `${Math.round(x * 1e4) / 1e4},${Math.round(y * 1e4) / 1e4}`;
const centers = new Set(
  upright.tiles.map((_, i) =>
    pointKey(upright.data[i * k.STRIDE], upright.data[i * k.STRIDE + 1])
  )
);
upright.tiles.forEach((_, i) => {
  const x = upright.data[i * k.STRIDE];
  const y = upright.data[i * k.STRIDE + 1];
  check(centers.has(pointKey(-x, y)), 'column is not horizontally symmetric');
});
const miniature = k.buildTiles({ ...defaults, columns: 3, rows: 5 });
const housePoints = k
  .buildTiles({ ...defaults, pattern: 'logo' })
  .map((tile) => `${tile.layer}:${pointKey(tile.x, tile.y)}`)
  .sort();
check(
  JSON.stringify(
    miniature.map((tile) => `${tile.layer}:${pointKey(tile.x, tile.y)}`).sort()
  ) === JSON.stringify(housePoints),
  'column does not extend the actual house lattice'
);
const logo = k.buildTiles({ ...defaults, pattern: 'logo' });
check(
  logo.length === 11 && logo.filter((t) => t.layer === 1).length === 4,
  'loader logo topology drifted'
);
const files = await readdir('src/modules/argyle');
for (const file of files) {
  const text = await readFile(`src/modules/argyle/${file}`, 'utf8');
  check(
    !/from ['"](?:three|react)(?:['"/])/u.test(text),
    `${file} imports rendering into the kernel`
  );
}
await checkWorkbenchPage(
  'src/dev/tools/argyle/ArgyleWorkbenchPage.jsx',
  RENDER_OPTIONS,
  check
);
failures.push(...(await schemaControlCoverage(CONTROLS)));
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(
  'Argyle: 2,000 unique deterministic rolls, facet holds, pins, six loop seams, coverage endpoints, loader topology, 72 vector branches and workbench schema passed.'
);
