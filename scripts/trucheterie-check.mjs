#!/usr/bin/env node

/* eslint-disable no-console */
// Drift alarm for the Trucheterie blob-field pipeline: the scene, the CLI
// and the workbench must agree with the kernel they share. See
// docs/flora-pipeline.md for the arrangement this mirrors. Scoped to the
// Blob Field folder and the Colors folder only — Composition, Grid, Motif,
// Multiscale, Stroke and Retile belong to the square/triangular grid modes,
// which this pipeline does not cover yet.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  PALETTE_NONE,
  RENDER_OPTIONS,
  SCENE_KEYS,
} from '../src/modules/trucheterieBlob/renderOptions.mjs';
import loadModules, { REPO_ROOT } from './lib/loadModules.mjs';

const KERNEL_DIR = path.join(REPO_ROOT, 'src', 'modules', 'trucheterieBlob');
const SCENE = '/src/components/scenes/WebGPU/Trucheterie/components';
const CONTROL_BUILDERS = [
  `${SCENE}/getBlobFieldControls.js`,
  `${SCENE}/getColorControls.js`,
];
const HEADLESS = [
  'lib/trucheterieBlobRender.mjs',
  'lib/trucheterieDesigns.mjs',
  'trucheterie-generate.mjs',
  'trucheterie-video.mjs',
];
const BARRELS = {
  blob: '/src/modules/trucheterieBlob/index.js',
  look: '/src/modules/trucheterieBlobRender/index.js',
};

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

// The generator has no renderer, no React and no Leva reachable from it.
async function checkKernelPurity() {
  const files = (await readdir(KERNEL_DIR)).filter((name) =>
    /\.(js|mjs)$/u.test(name)
  );
  const forbidden =
    /from '(three[^']*|react[^']*|leva|@react-three\/[^']+|node:[^']+|@utils\/[^']+)'/gu;
  await Promise.all(
    files.map(async (name) => {
      const source = await readFile(path.join(KERNEL_DIR, name), 'utf8');
      [...source.matchAll(forbidden)].forEach(([, offender]) =>
        failures.push(
          `kernel purity: ${name} imports "${offender}" — rendering code belongs in @modules/trucheterieBlobRender.`
        )
      );
    })
  );
  const schema = await readFile(
    path.join(KERNEL_DIR, 'renderOptions.mjs'),
    'utf8'
  );
  [...schema.matchAll(/^import .* from '([^']+)';$/gmu)]
    .map(([, specifier]) => specifier)
    .filter((specifier) => specifier !== '../optionSchema/index.mjs')
    .forEach((specifier) =>
      failures.push(
        `renderOptions.mjs imports "${specifier}" — it must stay dependency-free.`
      )
    );
}

function collectControls(schema, out = {}) {
  Object.entries(schema ?? {}).forEach(([key, value]) => {
    if (value?.schema) collectControls(value.schema, out);
    else if (value && typeof value === 'object' && 'value' in value) {
      // eslint-disable-next-line no-param-reassign
      out[key] = value;
    }
  });
  return out;
}

// The scene's Leva schema is hand-written; this holds its keys and ranges to
// the declaration a preset is written against.
function checkSceneControls(builders) {
  const controls = {};
  builders.forEach((builder) => {
    collectControls(builder.default({}, {}), controls);
  });
  const sceneNames = new Map(
    SCENE_KEYS.map((key) => [RENDER_OPTIONS[key].sceneKey ?? key, key])
  );

  Object.entries(controls).forEach(([key, control]) => {
    const spec = RENDER_OPTIONS[sceneNames.get(key)];
    if (!spec) return;
    if (control.min === undefined) return;
    ['min', 'max', 'step'].forEach((bound) =>
      check(
        control[bound] === spec[bound],
        `"${key}" ${bound} is ${control[bound]} in the scene but ${spec[bound]} in renderOptions.mjs.`
      )
    );
    check(
      control.value === spec.default,
      `"${key}" defaults to ${control.value} in the scene but ${spec.default} in renderOptions.mjs.`
    );
  });
}

async function checkHeadlessCalls(barrels) {
  await Promise.all(
    HEADLESS.map(async (file) => {
      const source = await readFile(
        path.join(REPO_ROOT, 'scripts', file),
        'utf8'
      );
      [...source.matchAll(/\bkernel\.(blob|look)\.(\w+)/gu)].forEach(
        ([, barrel, name]) =>
          check(
            name in barrels[barrel],
            `${file} calls kernel.${barrel}.${name}, which ${BARRELS[barrel]} does not export.`
          )
      );
    })
  );
}

const DESIGN_SEEDS = ['alpha', 'blob-42', 'kink-9001'];
const designKey = (blob, design) => JSON.stringify(blob.designToJson(design));

// A seeded field read back as a design must rebuild the identical field.
function checkDesigns(blob) {
  DESIGN_SEEDS.forEach((seed) =>
    [15, 30].forEach((gridSize) =>
      [0, 1, 2].forEach((meatballs) => {
        const label = `${seed}/${gridSize}/${meatballs}`;
        const field = blob.buildBlobField({
          canvasSize: 8,
          connectivity: 0.8,
          distributionCount: 0.1,
          gridSize,
          holes: 0.1,
          meatballs,
          oneFill: 0.25,
          seed,
          sizeFunction: '1+(gridSize/9)*Math.random()',
        });
        const design = blob.designFromField(field);
        check(
          designKey(blob, blob.normalizeDesign(design)) ===
            designKey(blob, design),
          `design ${label}: a seeded field breaks the neighbour rule normalizeDesign enforces.`
        );
        const decoded = blob.decodeDesign(blob.encodeDesign(design));
        check(
          decoded && designKey(blob, decoded) === designKey(blob, design),
          `design ${label}: encodeDesign/decodeDesign do not round-trip.`
        );
        const rebuilt = blob.fieldFromConfig({
          blobCanvasSize: 8,
          blobDesign: blob.encodeDesign(design),
        });
        ['conn0', 'conn1', 'connectorMask', 'positions', 'sizes'].forEach(
          (name) =>
            check(
              rebuilt[name].join() === field[name].join(),
              `design ${label}: fieldFromDesign rebuilds different ${name}.`
            )
        );
      })
    )
  );

  const seeded = blob.designFromSeed({
    ...blob.sceneDefaults(),
    blobGridSize: 20,
    blobSeed: 'resize',
  });
  const grown = blob.resizeDesign(seeded, 30);
  const before = blob.fieldFromDesign(seeded, 8);
  const after = blob.fieldFromDesign(grown, 8);
  check(
    grown.cells.length === seeded.cells.length &&
      ['conn0', 'conn1', 'connectorMask'].every(
        (name) => after[name].join() === before[name].join()
      ),
    'design: growing the grid changes cells, connectors or their arcs.'
  );
  const shrunk = blob.resizeDesign(seeded, 10);
  check(
    shrunk.gridSize === 10 &&
      shrunk.cells.every(
        ({ column, row, size }) => column + size <= 10 && row + size <= 10
      ) &&
      JSON.stringify(blob.normalizeDesign(shrunk)) === JSON.stringify(shrunk),
    'design: shrinking the grid keeps cells outside it or breaks the neighbour rule.'
  );

  let block = blob.emptyDesign(6);
  for (let c = 0; c < 3; c += 1) {
    for (let r = 0; r < 3; r += 1) block = blob.placeCell(block, c, r, 1);
  }
  const centre = block.cells.findIndex(
    ({ column, row }) => column === 1 && row === 1
  );
  const pairing = (design) =>
    blob
      .cellConnections(design, centre)
      .map(([, edge]) => edge)
      .sort()
      .join();
  const flipped = blob.flipDiagonal(block, centre);
  check(
    blob.canFlipDiagonal(block, centre) &&
      pairing(flipped) !== pairing(block) &&
      pairing(blob.flipDiagonal(flipped, centre)) === pairing(block),
    'design: flipDiagonal does not toggle a four-way cell between its two pairings.'
  );
  const swapped = blob.swapOrder(block, centre);
  check(
    JSON.stringify(blob.cellConnections(swapped, centre)) ===
      JSON.stringify([...blob.cellConnections(block, centre)].reverse()),
    'design: swapOrder does not reverse which family draws first.'
  );
  check(
    JSON.stringify(
      blob.decodeDesign(blob.encodeDesign(swapped)).cells[centre]
    ) === JSON.stringify(swapped.cells[centre]),
    'design: the codec drops a pinned choice.'
  );
  const corner = block.cells.findIndex(
    ({ column, row }) => column === 0 && row === 0
  );
  check(
    blob.flipDiagonal(block, corner) === block &&
      blob.swapOrder(block, corner) === block,
    'design: flipDiagonal/swapOrder change a cell they do not apply to.'
  );

  let built = blob.emptyDesign(10);
  built = blob.placeCell(built, 0, 0, 4);
  built = blob.placeCell(built, 4, 0, 2);
  built = blob.placeCell(built, 4, 2, 2);
  check(
    blob.isSideOpen(built, 0, 1) && blob.isSideOpen(built, 2, 3),
    'design: auto-connect does not open a side across every neighbour on it.'
  );
  const closed = blob.setSide(built, 1, 3, false);
  check(
    !blob.isSideOpen(closed, 0, 1) && !blob.isSideOpen(closed, 2, 3),
    'design: closing one neighbour does not close the rest of that side.'
  );
  check(
    blob.placeCell(built, 3, 3, 2) === built,
    'design: placeCell accepts an overlapping cell.'
  );
}

async function checkSavedDesigns(blob) {
  const dir = path.join(KERNEL_DIR, 'designs');
  const files = (await readdir(dir).catch(() => [])).filter((name) =>
    name.endsWith('.json')
  );
  await Promise.all(
    files.map(async (name) => {
      const json = JSON.parse(await readFile(path.join(dir, name), 'utf8'));
      check(
        blob.designFromJson(json) !== null,
        `designs/${name} is not a valid design (overlapping or out-of-grid cells).`
      );
    })
  );
}

async function main() {
  await checkKernelPurity();

  const loaded = await loadModules([
    ...CONTROL_BUILDERS,
    ...Object.values(BARRELS),
    '/src/utils/gradientPalette.js',
  ]);
  checkSceneControls(CONTROL_BUILDERS.map((entry) => loaded[entry]));
  await checkHeadlessCalls(
    Object.fromEntries(
      Object.entries(BARRELS).map(([name, entry]) => [name, loaded[entry]])
    )
  );
  checkDesigns(loaded[BARRELS.blob]);
  await checkSavedDesigns(loaded[BARRELS.blob]);
  check(
    loaded['/src/utils/gradientPalette.js'].PALETTE_NONE === PALETTE_NONE,
    'PALETTE_NONE in renderOptions.mjs no longer matches @utils/gradientPalette.'
  );

  if (failures.length > 0) {
    console.error(`trucheterie:check failed (${failures.length}):\n`);
    failures.forEach((message) => console.error(`  ✗ ${message}`));
    process.exit(1);
  }
  console.log(
    'trucheterie:check — blob-field kernel, scene, CLI and workbench agree.'
  );
  process.exit(0);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
