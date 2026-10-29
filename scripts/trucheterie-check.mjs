#!/usr/bin/env node

/* eslint-disable no-console */
// Drift alarm for the Trucheterie blob-field pipeline: the scene, the CLI
// and the workbench must agree with the kernel they share. See
// docs/flora-pipeline.md for the arrangement this mirrors. Scoped to the
// Blob Field folder and the Colors folder only — Composition, Grid, Motif,
// Multiscale, Stroke and Retile belong to the square/triangular grid modes,
// which this pipeline does not cover yet.
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

import {
  PALETTE_NONE,
  RENDER_OPTIONS,
  SCENE_KEYS,
} from '../src/modules/trucheterieBlob/renderOptions.mjs';
import loadModules, { REPO_ROOT } from './lib/loadModules.mjs';
import { withResolvedDesign } from './lib/trucheterieDesigns.mjs';

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
// The design's frame crops to its extent, so only the cells' layout relative to the first must match.
const layoutKey = (field) => {
  const [first] = field.cells;
  return field.cells
    .map(({ cell }) => [
      cell.column - first.cell.column,
      cell.row - first.cell.row,
    ])
    .join();
};

function legacyCode(gridSize, cells) {
  const bytes = [gridSize, ...cells.flat()];
  return `tb1.${Buffer.from(bytes).toString('base64url')}`;
}

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
        ['conn0', 'conn1', 'connectorMask', 'sizes'].forEach((name) =>
          check(
            rebuilt[name].join() === field[name].join(),
            `design ${label}: fieldFromDesign rebuilds different ${name}.`
          )
        );
        check(
          layoutKey(rebuilt) === layoutKey(field),
          `design ${label}: fieldFromDesign moves cells relative to each other.`
        );
      })
    )
  );

  let far = blob.placeCell(blob.emptyDesign(), -40, 300, 3);
  far = blob.placeCell(far, -37, 300, 3);
  const farDecoded = blob.decodeDesign(blob.encodeDesign(far));
  check(
    far.cells.length === 2 &&
      blob.isSideOpen(far, 0, 1) &&
      farDecoded &&
      designKey(blob, farDecoded) === designKey(blob, far),
    'design: cells at negative or large coordinates do not place, connect or round-trip.'
  );
  const farField = blob.fieldFromDesign(far, 8);
  const farFrame = blob.designFrame(far);
  check(
    farField.gridSize === farFrame.size &&
      farField.cells.every(
        ({ cell }) =>
          cell.column >= 0 &&
          cell.row >= 0 &&
          cell.column + cell.size <= farField.gridSize &&
          cell.row + cell.size <= farField.gridSize
      ),
    'design: fieldFromDesign does not frame the cells inside its grid.'
  );

  const legacyCells = [
    [5, 3, 2, 6],
    [7, 3, 1, 8],
  ];
  const legacy = blob.decodeDesign(legacyCode(18, legacyCells));
  check(
    legacy &&
      JSON.stringify(blob.designToJson(legacy).cells) ===
        JSON.stringify(
          blob.designToJson(blob.designFromJson({ cells: legacyCells })).cells
        ),
    'design: a legacy tb1 code no longer decodes to its cells.'
  );

  // A 12 turning right-to-bottom leaves its top-left corner free of arcs.
  let host = blob.emptyDesign();
  host = blob.placeCell(host, 12, 0, 12);
  host = blob.placeCell(host, 0, 12, 12);
  host = blob.placeCell(host, 0, 0, 12);
  const hostIndex = host.cells.length - 1;
  check(
    blob.isSideOpen(host, hostIndex, 1) && blob.isSideOpen(host, hostIndex, 2),
    'design: the host 12 does not connect right and bottom.'
  );
  const squatted = blob.placeCell(host, 0, 0, 3);
  check(
    squatted !== host &&
      blob.inkClashes(squatted) === 0 &&
      blob.cellIndexAt(squatted, 1, 1) === squatted.cells.length - 1 &&
      blob.cellIndexAt(squatted, 8, 8) === hostIndex,
    'design: a 3 does not fit in the free corner of a corner-turning 12.'
  );
  check(
    blob.placeCell(host, 0, 0, 5) === host &&
      blob.placeCell(host, 6, 6, 1) === host,
    "design: a cell is placed where a bigger cell's arcs reach."
  );
  check(
    [0, 1, 2, 3].every(
      (side) => !blob.isSideOpen(squatted, hostIndex + 1, side)
    ),
    'design: a cell in a free corner connects into the cell around it.'
  );
  const stub = blob.setSide(squatted, hostIndex, 1, false);
  check(
    stub !== squatted &&
      blob.setSide(stub, hostIndex, 2, false) === stub &&
      blob.eraseCell(stub, 1) === stub,
    'design: an edit that grows arcs into a cell sitting inside them is not refused.'
  );
  const squattedField = blob.fieldFromDesign(squatted, 8);
  check(
    squattedField.count === squatted.cells.length,
    'design: fieldFromDesign drops a cell sitting in a free corner.'
  );
  let around = blob.emptyDesign();
  around = blob.placeCell(around, 12, 0, 12);
  around = blob.placeCell(around, 0, 12, 12);
  around = blob.placeCell(around, 0, 0, 3);
  const wrapped = blob.placeCell(around, 0, 0, 12);
  check(
    wrapped !== around && blob.inkClashes(wrapped) === 0,
    'design: a 12 cannot be placed around a 3 that its arcs would miss.'
  );
  check(
    blob.placeCell(around, 0, 0, 12, { connect: false }) === around,
    'design: an unconnected 12 (rings) is placed over a 3.'
  );
  check(
    blob.decodeDesign(blob.encodeDesign(squatted)) !== null &&
      blob.designFromJson({
        cells: [
          [0, 0, 12, 0],
          [0, 0, 3, 0],
        ],
      }) === null,
    'design: the codec rejects overlaps the arcs reach, or refuses a valid one.'
  );

  let block = blob.emptyDesign();
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

  let built = blob.emptyDesign();
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

// Move drags a whole connected group, intact, and refuses a landing that touches arcs or changes a side.
function checkMove(blob) {
  let design = blob.emptyDesign();
  design = blob.placeCell(design, 0, 0, 2);
  design = blob.placeCell(design, 2, 0, 2);
  design = blob.placeCell(design, 10, 0, 2);
  const group = blob.connectedGroup(design, 0);
  check(
    group.join() === '0,1' && blob.connectedGroup(design, 2).join() === '2',
    'design: connectedGroup does not follow open sides (or crosses closed ones).'
  );
  const moved = blob.moveCells(design, group, 3, 5);
  const drawn = (d) =>
    blob
      .fieldFromDesign(d, 8)
      .cells.map(({ connections, cell }) =>
        JSON.stringify([cell.size, cell.connectors, connections])
      )
      .sort()
      .join();
  check(
    moved !== design &&
      moved.cells[0].column === 3 &&
      moved.cells[1].row === 5 &&
      moved.cells[2].column === 10 &&
      drawn(moved) === drawn(design),
    'design: moveCells does not move the group intact.'
  );
  const beside = blob.moveCells(design, group, 6, 0);
  check(
    blob.moveCells(design, group, 9, 0) === design &&
      beside !== design &&
      !blob.isSideOpen(beside, 1, 1) &&
      !blob.isSideOpen(beside, 2, 3),
    'design: moveCells lands a group on another cell, or connects it to a cell it lands beside.'
  );
}

const SIDE_MAPS = {
  antidiagonal: [1, 0, 3, 2],
  diagonal: [3, 2, 1, 0],
  horizontal: [2, 1, 0, 3],
  vertical: [0, 3, 2, 1],
};

function mirrorPlace(axis, { column, row, size }, n) {
  if (axis === 'vertical') return [n - column - size, row];
  if (axis === 'horizontal') return [column, n - row - size];
  if (axis === 'diagonal') return [row, column];
  return [n - row - size, n - column - size];
}

function mirrorConnection(axis, [type, edge]) {
  const map = SIDE_MAPS[axis];
  if (type === 0) return [0, 0];
  if (type === 1) return [1, map[edge]];
  if (type === 3) return [3, map[edge] % 2];
  const a = map[edge];
  const b = map[(edge + 3) % 4];
  return [2, (b + 1) % 4 === a ? a : b];
}

// Every drawn cell has a twin across the axis drawing the mirrored families, in the same order (as a set, on the axis).
function checkSymmetry(blob) {
  const base = {
    ...blob.sceneDefaults(),
    blobCanvasSize: 8,
    blobConnectivity: 0.85,
    blobDistribution: 0.15,
    blobStraights: 0.5,
  };
  blob.SYMMETRY_AXES.filter((axis) => axis !== 'none').forEach((axis) =>
    ['mirror-a', 'mirror-b', 'mirror-c'].forEach((seed) =>
      [20, 25].forEach((gridSize) =>
        [0, 2].forEach((meatballs) => {
          const label = `symmetry ${axis}/${seed}/${gridSize}/${meatballs}`;
          const field = blob.fieldFromConfig({
            ...base,
            blobGridSize: gridSize,
            blobMeatballs: meatballs,
            blobSeed: seed,
            blobSymmetry: axis,
          });
          const n = field.gridSize;
          const byPlace = new Map(
            field.cells.map((entry) => [
              `${entry.cell.column},${entry.cell.row},${entry.cell.size}`,
              entry,
            ])
          );
          const broken = field.cells.filter(({ cell, connections }) => {
            const [column, row] = mirrorPlace(axis, cell, n);
            const twin = byPlace.get(`${column},${row},${cell.size}`);
            if (!twin) return true;
            const mirrored = connections.map((c) => mirrorConnection(axis, c));
            const self = twin.cell === cell;
            const key = (list) =>
              (self ? [...list].sort() : list).map(String).join('|');
            return key(mirrored) !== key(twin.connections);
          });
          const design = blob.designFromField(field);
          check(
            field.count > 4 &&
              n === gridSize &&
              broken.length === 0 &&
              designKey(blob, blob.normalizeDesign(design)) ===
                designKey(blob, design),
            `${label}: ${broken.length} cells lack a mirrored twin, or the field breaks the neighbour rule (${field.count} cells).`
          );
        })
      )
    )
  );

  const rolls = Array.from({ length: 400 }, (_, i) =>
    blob.rollBlobConfig(`sym-${i}`)
  );
  const on = rolls.filter(({ blobSymmetry }) => blobSymmetry !== 'none');
  check(
    on.length > 400 * blob.SYMMETRY_CHANCE * 0.5 &&
      on.length < 400 * blob.SYMMETRY_CHANCE * 1.6 &&
      on.every(
        ({ blobSymmetry, planeRotation }) =>
          (planeRotation === 45 || planeRotation === 30) ===
          (blobSymmetry === 'diagonal' || blobSymmetry === 'antidiagonal')
      ),
    `symmetry: ${on.length}/400 rolls are symmetric, or an axis ignores the rotation.`
  );
  const turned = blob.rollBlobConfig(
    rolls.indexOf(on.find((c) => c.planeRotation === 0)) >= 0
      ? `sym-${rolls.indexOf(on.find((c) => c.planeRotation === 0))}`
      : 'sym-0',
    { pinned: { blobGridShape: 'square', planeRotation: 45 } }
  );
  const off = blob.rollBlobConfig(`sym-${rolls.indexOf(on[0])}`, {
    pinned: { blobSymmetry: 'none' },
  });
  check(
    ['diagonal', 'antidiagonal'].includes(turned.blobSymmetry) &&
      off.blobSymmetry === 'none',
    'symmetry: a pinned rotation does not realign the axis, or pinning none does not turn it off.'
  );
  check(
    blob.SYMMETRY.join() === blob.SYMMETRY_AXES.join(),
    'symmetry: renderOptions SYMMETRY and design SYMMETRY_AXES disagree.'
  );
}

function checkDuplicate(blob) {
  let design = blob.emptyDesign();
  design = blob.placeCell(design, 0, 0, 2);
  design = blob.placeCell(design, 2, 0, 2);
  const group = blob.connectedGroup(design, 0);
  const copied = blob.duplicateCells(design, group, 0, 4);
  const drawn = (d, indices) =>
    indices
      .map((i) =>
        JSON.stringify([
          [0, 1, 2, 3].map((side) => blob.isSideOpen(d, i, side)),
          blob.cellConnections(d, i),
        ])
      )
      .join();
  check(
    copied.cells.length === 4 &&
      copied.cells[2].row === 4 &&
      copied.cells[0].row === 0 &&
      drawn(copied, [2, 3]) === drawn(design, [0, 1]) &&
      blob.connectedGroup(copied, 2).join() === '2,3',
    'design: duplicateCells does not copy the group intact beside the original.'
  );
  check(
    blob.duplicateCells(design, group, 1, 0) === design &&
      blob.duplicateCells(design, group, 0, 0) === design,
    'design: duplicateCells lands a copy on the original.'
  );
}

// A 1 against part of a 3's closed side: a pocket mid-side, a bend at a corner whose other side is open.
function checkIrregular(blob) {
  const build = (irregular) => {
    let d = blob.emptyDesign({ irregular });
    d = blob.placeCell(d, 0, 0, 3);
    d = blob.placeCell(d, 0, 3, 3);
    d = blob.placeCell(d, -1, 0, 1);
    d = blob.placeCell(d, -1, 2, 1);
    return d;
  };
  const plain = build(false);
  const design = build(true);
  check(
    !blob.isSideOpen(plain, 2, 1) &&
      blob.isSideOpen(design, 2, 1) &&
      blob.isSideOpen(design, 3, 1) &&
      !blob.isSideOpen(design, 0, 3),
    'irregular: a small cell does not connect to part of a closed side only when the toggle is on.'
  );
  const families = blob.irregularFamilies(design).get(0) ?? [];
  check(
    families.length === 2 &&
      families[0].connection.join() === '1,3' &&
      families[1].connection.join() === '2,3',
    `irregular: expected a pocket then a bottom-left bend on the 3, got ${JSON.stringify(families.map((f) => f.connection))}.`
  );
  const field = blob.fieldFromDesign(design, 8);
  const virtual = field.cells.filter((entry) => entry.virtual);
  const firstVirtual = field.cells.findIndex((entry) => entry.virtual);
  check(
    virtual.length === 2 &&
      field.count === design.cells.length + 2 &&
      field.cells.slice(firstVirtual).every((entry) => entry.virtual) &&
      field.cells.some(
        (entry) => !entry.virtual && entry.occluders.length === 2
      ),
    'irregular: pockets and bends are not appended after every cell, covering their host.'
  );
  const lanes = blob.buildLaneChannels(field.cells, 4);
  const channelOf = (index) => lanes.channelOf[index * lanes.slotStride];
  const guest = field.cells.findIndex(
    ({ cell, virtual: v }) => !v && cell.size === 1 && cell.connectors[1]
  );
  check(
    guest >= 0 &&
      [firstVirtual, firstVirtual + 1].some(
        (index) => channelOf(index) === channelOf(guest)
      ),
    "irregular: a pocket or bend does not continue the small cell's lanes."
  );
  const svg = blob.renderBlobSvg(field, {
    height: 200,
    pathDiv: 4,
    width: 200,
  });
  check(svg.includes('<path'), 'irregular: renderBlobSvg draws nothing.');
  const decoded = blob.decodeDesign(blob.encodeDesign(design));
  check(
    blob.encodeDesign(design).startsWith('tb3.') &&
      decoded?.irregular === true &&
      designKey(blob, decoded) === designKey(blob, design) &&
      blob.designFromJson(blob.designToJson(design))?.irregular === true,
    'irregular: the codec or JSON drops the irregular flag.'
  );
  const off = blob.setIrregular(design, false);
  check(
    !off.irregular &&
      !blob.isSideOpen(off, 2, 1) &&
      blob.irregularFamilies(off).size === 0,
    'irregular: turning it off leaves irregular sides open.'
  );
  let opened = blob.emptyDesign({ irregular: true });
  opened = blob.placeCell(opened, 0, 0, 3, { connect: false });
  opened = blob.placeCell(opened, -1, 1, 1, { connect: false });
  check(
    blob.isSideOpen(blob.setSide(opened, 1, 1, true), 1, 1) &&
      !blob.isSideOpen(
        blob.setSide(blob.setIrregular(opened, false), 1, 1, true),
        1,
        1
      ),
    'irregular: Connect does not open a side onto part of a closed side (or does with the toggle off).'
  );

  let seen = 0;
  ['irr-a', 'irr-b', 'irr-c'].forEach((seed) => {
    const config = {
      ...blob.sceneDefaults(),
      blobCanvasSize: 8,
      blobIrregular: true,
      blobSeed: seed,
    };
    const seeded = blob.fieldFromConfig(config);
    seen += seeded.cells.filter((entry) => entry.virtual).length;
    const again = blob.fieldFromDesign(blob.designFromField(seeded), 8, {
      column: 0,
      row: 0,
      size: seeded.gridSize,
    });
    check(
      ['conn0', 'conn1', 'connectorMask', 'sizes'].every(
        (name) => again[name].join() === seeded[name].join()
      ),
      `irregular ${seed}: a seeded irregular field does not round-trip through a design.`
    );
    const mirrored = blob.fieldFromConfig({
      ...config,
      blobSymmetry: 'vertical',
    });
    check(
      mirrored.cells.filter((entry) => entry.virtual).length % 2 === 0,
      `irregular ${seed}: a symmetric irregular field has an unpaired pocket or bend.`
    );
  });
  check(seen > 0, 'irregular: seeded fields never produce a pocket or bend.');
  const rolled = Array.from({ length: 400 }, (_, i) =>
    blob.rollBlobConfig(`irr-roll-${i}`)
  ).filter((c) => c.blobIrregular).length;
  check(
    rolled > 400 * blob.IRREGULAR_ROLL_CHANCE * 0.6 &&
      rolled < 400 * blob.IRREGULAR_ROLL_CHANCE * 1.4,
    `irregular: ${rolled}/400 rolls turn it on.`
  );
}

// A 2-cell between two others runs straight; a third neighbour makes it a T.
function checkStraights(blob) {
  let column = blob.emptyDesign();
  column = blob.placeCell(column, 0, 0, 2);
  column = blob.placeCell(column, 0, 2, 2);
  column = blob.placeCell(column, 0, 4, 2);
  const straight = blob.toggleStraight(column, 1);
  check(
    blob.canStraighten(column, 1) &&
      !blob.canStraighten(column, 0) &&
      JSON.stringify(blob.cellConnections(straight, 1)) === '[[3,0]]' &&
      blob.toggleStraight(straight, 1).cells[1].mask === column.cells[1].mask,
    'straights: a cell open top and bottom does not toggle to one straight family.'
  );
  const tee = blob.placeCell(straight, 2, 2, 2);
  check(
    JSON.stringify(blob.cellConnections(tee, 1)) === '[[1,1],[3,0]]',
    `straights: a third open side is not a T-junction (stub first), got ${JSON.stringify(blob.cellConnections(tee, 1))}.`
  );
  let cross = blob.emptyDesign();
  [
    [2, 2],
    [2, 0],
    [2, 4],
    [0, 2],
    [4, 2],
  ].forEach(([c, r]) => {
    cross = blob.placeCell(cross, c, r, 2);
  });
  check(
    !blob.canStraighten(cross, 0) && blob.toggleStraight(cross, 0) === cross,
    'straights: a four-way cell can be made straight (crosses are not supported).'
  );
  const decoded = blob.decodeDesign(blob.encodeDesign(tee));
  check(
    decoded &&
      designKey(blob, decoded) === designKey(blob, tee) &&
      blob.cellConnections(decoded, 1).some(([type]) => type === 3),
    'straights: the codec drops the straight bit.'
  );

  [straight, tee].forEach((design, i) => {
    const label = i === 0 ? 'straight' : 'T-junction';
    const field = blob.fieldFromDesign(design, 8);
    const lanes = blob.buildLaneChannels(field.cells, 4);
    const at = (cellIndex, slot, lane) =>
      lanes.channelOf[
        cellIndex * lanes.slotStride + slot * lanes.maxLanes + lane
      ];
    const middle = field.cells.findIndex(({ connections }) =>
      connections.some(([type]) => type === 3)
    );
    const slot = field.cells[middle].connections.findIndex(([t]) => t === 3);
    const { column: midColumn, row: midRow } = field.cells[middle].cell;
    const ends = field.cells
      .map((entry, index) => [entry.cell, index])
      .filter(
        ([cell]) =>
          cell.column === midColumn && Math.abs(cell.row - midRow) === 2
      )
      .map(([, index]) => index);
    const joined = Array.from({ length: 8 }, (_, j) => at(middle, slot, j));
    const reached = (index) =>
      Array.from({ length: 8 }, (_, j) => at(index, 0, j)).filter((c) =>
        joined.includes(c)
      ).length;
    check(
      ends.length === 2 && ends.every((index) => reached(index) > 0),
      `straights ${label}: the straight lanes do not join the cells above and below.`
    );
    const svg = blob.renderBlobSvg(field, {
      height: 200,
      pathDiv: 4,
      width: 200,
    });
    const radii = [...svg.matchAll(/ A ([\d.]+) /gu)].map(([, r]) => Number(r));
    check(
      svg.includes(' L ') && radii.every((r) => r < 1000),
      `straights ${label}: the SVG writes straight lanes as huge arcs instead of lines.`
    );
  });

  let seen = 0;
  ['str-a', 'str-b', 'str-c'].forEach((seed) => {
    const seeded = blob.fieldFromConfig({
      ...blob.sceneDefaults(),
      blobCanvasSize: 8,
      blobSeed: seed,
      blobStraights: 0.6,
    });
    seen += seeded.cells.filter(({ connections }) =>
      connections.some(([type]) => type === 3)
    ).length;
    const again = blob.fieldFromDesign(blob.designFromField(seeded), 8, {
      column: 0,
      row: 0,
      size: seeded.gridSize,
    });
    check(
      ['conn0', 'conn1', 'connectorMask', 'sizes'].every(
        (name) => again[name].join() === seeded[name].join()
      ),
      `straights ${seed}: a seeded field with straights does not round-trip through a design.`
    );
  });
  check(seen > 0, 'straights: seeded fields never draw a straight cell.');
  const rolled = Array.from({ length: 400 }, (_, i) =>
    blob.rollBlobConfig(`str-roll-${i}`)
  ).map((c) => c.blobStraights);
  const on = rolled.filter((v) => v > 0);
  check(
    on.length > 400 * blob.STRAIGHTS_ROLL_CHANCE * 0.6 &&
      on.length < 400 * blob.STRAIGHTS_ROLL_CHANCE * 1.4 &&
      on.every((v) => v >= 0.2 && v <= 0.7),
    `straights: ${on.length}/400 rolls turn them on, or a rolled chance leaves [0.2, 0.7].`
  );
}

function strokeContains(a, p) {
  if (a.line) {
    const dx = a.to[0] - a.from[0];
    const dy = a.to[1] - a.from[1];
    const d = dx * dx + dy * dy;
    const t = ((p[0] - a.from[0]) * dx + (p[1] - a.from[1]) * dy) / d;
    return (
      t >= -1e-6 &&
      t <= 1 + 1e-6 &&
      Math.abs((p[0] - a.from[0]) * dy - (p[1] - a.from[1]) * dx) <
        1e-5 * Math.sqrt(d)
    );
  }
  if (Math.abs(Math.hypot(p[0] - a.x, p[1] - a.y) - a.radius) > 1e-5)
    return false;
  const t =
    (((Math.atan2(p[1] - a.y, p[0] - a.x) - a.start) % (2 * Math.PI)) +
      2 * Math.PI) %
    (2 * Math.PI);
  return t < a.span + 1e-5 || t > Math.PI * 2 - 1e-5;
}
function unmatchedStrokeEndpoints(arcs) {
  const bin = 0.5;
  const buckets = new Map();
  const pt = (a, t) =>
    a.line
      ? [
          a.from[0] + (a.to[0] - a.from[0]) * t,
          a.from[1] + (a.to[1] - a.from[1]) * t,
        ]
      : [
          a.x + a.radius * Math.cos(a.start + a.span * t),
          a.y + a.radius * Math.sin(a.start + a.span * t),
        ];
  arcs.forEach((a, i) => {
    const n = Math.max(
      1,
      Math.ceil(
        ((a.line
          ? Math.hypot(a.to[0] - a.from[0], a.to[1] - a.from[1])
          : a.radius * a.span) /
          bin) *
          3
      )
    );
    for (let k = 0; k <= n; k += 1) {
      const [x, y] = pt(a, k / n);
      const key = `${Math.floor(x / bin)},${Math.floor(y / bin)}`;
      if (!buckets.has(key)) buckets.set(key, new Set());
      buckets.get(key).add(i);
    }
  });
  const bad = [];
  arcs.forEach((a, i) => {
    if (!a.line && a.span > Math.PI * 2 - 1e-5) return;
    [0, 1].forEach((t) => {
      const p = pt(a, t);
      const cx = Math.floor(p[0] / bin);
      const cy = Math.floor(p[1] / bin);
      const ids = new Set(
        [-1, 0, 1].flatMap((dx) =>
          [-1, 0, 1].flatMap((dy) => [
            ...(buckets.get(`${cx + dx},${cy + dy}`) ?? []),
          ])
        )
      );
      if (![...ids].some((j) => j !== i && strokeContains(arcs[j], p)))
        bad.push({ i, p, arc: a });
    });
  });
  return bad;
}

// Every arc crossing a triangle's side where nothing drawn above it covers
// it, keyed by position: each must be drawn by cells on both sides of the
// line. Above a cell's own families sit its pockets and bends, last on top.
function unmatchedTriangleCrossings(blob, field, pathDiv) {
  if (field.layout === 'subdivide')
    return unmatchedStrokeEndpoints(blob.triangleSegments(field, pathDiv))
      .length;
  const byPoint = new Map();
  const groups = new Map();
  field.cells.forEach((entry) => {
    if (!groups.has(entry.group)) groups.set(entry.group, []);
    groups.get(entry.group).push(entry);
  });
  const add = (x, y, who) => {
    // Keep exact half-grid ties together after trigonometric roundoff.
    const key = `${Math.round(x * 1e4 + 1e-7)},${Math.round(y * 1e4 + 1e-7)}`;
    if (!byPoint.has(key)) byPoint.set(key, new Set());
    byPoint.get(key).add(who);
  };
  groups.forEach((entries) => {
    const { cell } = entries[0];
    if (entries[0].cap) {
      const [type, edge] = entries[0].connections[0];
      const { rMax, x, y } = blob.familySector(cell, type, edge, pathDiv);
      const { start, span } = blob.fanFrame(cell, edge, type);
      [start, start + span].forEach((angle) =>
        add(
          x + Math.cos(angle) * rMax,
          y + Math.sin(angle) * rMax,
          `cap:${entries[0].group}`
        )
      );
      return;
    }
    const own = [
      ...entries
        .filter((e) => !e.under && !e.virtual)
        .flatMap((e) => e.connections),
      ...entries.filter((e) => e.under).flatMap((e) => e.connections),
    ];
    const extras = entries
      .filter((e) => e.virtual)
      .flatMap((e) => e.connections)
      .reverse();
    const stack = [...extras, ...own];
    const who = `${cell.column},${cell.row},${cell.up}`;
    const points = blob.cornerPoints(cell);
    stack.forEach(([type, edge], slot) => {
      const hidden = (x, y) =>
        stack.slice(0, slot).some(([t, e]) => {
          const o = blob.familySector(cell, t, e, pathDiv);
          return Math.hypot(x - o.x, y - o.y) < o.rMax - 1e-9;
        });
      const corner = edge % 3;
      const [px, py] = points[corner];
      if (type === 4 || type === 7 || type === 10) {
        const bands = blob.laneCount(type, cell.size, pathDiv, edge);
        [1, 2].forEach((step) => {
          const [qx, qy] = points[(corner + step) % 3];
          for (let k = 0; k < bands; k += 1) {
            const d = (k + 0.5) / pathDiv / cell.size;
            const x = px + (qx - px) * d;
            const y = py + (qy - py) * d;
            if (!hidden(x, y)) add(x, y, `${who}:${slot}`);
          }
        });
      }
      if (type === 9) {
        const a = points[corner];
        const b = points[(corner + 1) % 3];
        const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        const radii = blob.returnRadii(type, cell.size, pathDiv);
        radii.forEach((r) =>
          [-1, 1].forEach((sign) =>
            add(
              mid[0] + ((b[0] - a[0]) / cell.size) * r * sign,
              mid[1] + ((b[1] - a[1]) / cell.size) * r * sign,
              `${who}:${slot}`
            )
          )
        );
        if (Math.round(cell.size * pathDiv) % 2 === 1)
          add(...mid, `${who}:${slot}`);
      }
      if (type === 6) {
        const { x: cx, y: cy } = blob.familySector(cell, type, edge, pathDiv);
        const [qx, qy] = points[(corner + 1) % 3];
        const ux = (qx - px) / cell.size;
        const uy = (qy - py) / cell.size;
        const m = Math.floor(Math.floor(edge / 6) / 512);
        // An odd stretch's middle crossing ends at the pocket's centre.
        if ((m * pathDiv) % 2 === 1) add(cx, cy, `${who}:${slot}`);
        blob.laneRadii(type, cell.size, pathDiv, edge).forEach(([, r]) =>
          [1, -1].forEach((sign) => {
            const x = cx + ux * r * sign;
            const y = cy + uy * r * sign;
            if (!hidden(x, y)) add(x, y, `${who}:${slot}`);
          })
        );
      }
    });
  });
  return [...byPoint.values()].filter((cells) => cells.size < 2).length;
}

// A size-4 ring cell inside a disc of size-1 triangles, every corner on.
function enclosedDesign(blob) {
  const host = blob.placeCell(
    blob.emptyDesign({ irregular: true, shape: 'triangle' }),
    0,
    0,
    4,
    { connect: false, up: false }
  );
  const centroid = (cell) => {
    const points = blob.cornerPoints({ ...cell, shape: 'triangle' });
    return [0, 1].map(
      (axis) => points.reduce((sum, p) => sum + p[axis], 0) / 3
    );
  };
  const smalls = [];
  for (let b = -6; b <= 9; b += 1) {
    for (let a = -9; a <= 9; a += 1) {
      smalls.push({ column: a, row: b, size: 1, up: false });
      smalls.push({ column: a, row: b, size: 1, up: true });
    }
  }
  const cells = smalls
    .filter((cell) => {
      const [x, y] = centroid(cell);
      return (
        blob.triIndexAt(host, x, y) < 0 && Math.hypot(x - 2, y - 1.5) < 6.5
      );
    })
    .map(({ column, row, up }) => ({
      column,
      mask: (up ? 8 : 0) + 7,
      row,
      size: 1,
    }));
  return blob.normalizeDesign({ ...host, cells: [...host.cells, ...cells] });
}

function checkTriangleReference(blob, look) {
  [4, 160].forEach((extent) =>
    [1, 2, 4, 10, 20].forEach((density) => {
      const { penHalfWidth } = look.penGeometry(extent, density, true);
      check(
        penHalfWidth <= look.penGeometry(extent).penHalfWidth &&
          penHalfWidth * 2 * density <= 0.25,
        'triangle reference: outlines are heavier than square cells or fill the lanes.'
      );
    })
  );
  [1, 2, 3, 6, 12].forEach((size) => {
    [false, true].forEach((up) => {
      const cell = { column: 0, row: 0, size, up };
      const points = blob.cornerPoints(cell);
      const [x, y] = [0, 1].map(
        (axis) => points.reduce((sum, p) => sum + p[axis], 0) / 3
      );
      const picked = blob.brushCell(x, y, size);
      check(
        picked.up === up && picked.column === 0 && picked.row === 0,
        `triangle paint: size ${size} ${up ? 'up' : 'down'} centroid picks the wrong triangle.`
      );
    });
  });
  const isolated = blob.placeCell(
    blob.emptyDesign({ shape: 'triangle', layout: 'subdivide' }),
    0,
    0,
    6
  );
  const paired = blob.placeCell(isolated, 0, 0, 6, { up: true });
  const closure = {
    ...blob.sceneDefaults(),
    blobGridShape: 'triangle',
    blobSeed: 'reference-1',
  };
  [1, 3, 6].forEach((size) => {
    let chain = blob.emptyDesign({ shape: 'triangle', layout: 'subdivide' });
    [
      [0, 0, false],
      [0, 0, true],
      [0, size, false],
      [0, size, true],
      [-size, size, true],
    ].forEach(([column, row, up], step) => {
      chain = blob.placeCell(chain, column, row, size, { up });
      if (step === 1) {
        const pairField = blob.fieldFromDesign(chain, 8);
        check(
          pairField.count === 1 &&
            pairField.cells[0].connections[0][0] === 5 &&
            pairField.cells[0].sources.length === 2,
          'triangle pair: the two editable triangles no longer form one circular motif.'
        );
      }
    });
    for (let pitch = 1; pitch <= 20; pitch += 1) {
      const field = blob.fieldFromDesign(chain, 8, undefined, pitch);
      check(
        unmatchedTriangleCrossings(blob, field, pitch) === 0,
        `triangle fans: size ${size} density ${pitch} leaves an exposed stroke end.`
      );
      if (size * pitch > 1) {
        const fans = field.cells
          .filter((entry) => !entry.cap)
          .flatMap((entry) => entry.connections);
        check(
          fans.length === chain.cells.length * 3 &&
            fans.every(([type]) => type === 4),
          `triangle fans: adding tiles at density ${pitch} replaces the three reference fans.`
        );
      }
      check(
        designKey(blob, blob.designFromField(field)) ===
          designKey(blob, blob.pinChoices(chain)),
        'triangle fans: boundary returns lose editable source tiles.'
      );
    }
  });
  const dense = blob.fieldFromConfig({ ...closure, blobPathsPerUnit: 4 });
  check(
    unmatchedTriangleCrossings(blob, dense, 4) === 0,
    'triangle fans: the dense reference has exposed endpoints.'
  );
  dense.cells
    .filter((entry) => !entry.cap)
    .forEach(({ cell, connections }) =>
      connections.forEach(([type, edge]) => {
        if (type !== 4) return;
        const long = Math.floor(edge / 6) % 2 === 1;
        const expected =
          (long && cell.size > 1 ? cell.size * 3 : cell.size * 2) + 1;
        check(
          blob.laneCount(type, cell.size, 4, edge) === expected,
          'triangle reference: a corner fan differs from the original inclusive arc count.'
        );
      })
    );
  const edgeCode = blob.encodeDesign(paired);
  const migrated = blob.decodeDesign(edgeCode.replace('tb7.', 'tb6.'));
  check(
    migrated &&
      designKey(blob, blob.normalizeDesign(migrated)) ===
        designKey(blob, migrated),
    'triangle migration: a legacy subdivision design leaves an unmatched edge.'
  );

  const leaves = blob.designFromSeed({ ...closure, blobTriangleMinRes: 0 });
  const middle = Math.floor(leaves.cells.length / 2);
  const edits = [
    leaves,
    blob.eraseCell(leaves, middle),
    blob.setCorner(leaves, middle, 0, false),
  ];
  edits.forEach((design, index) =>
    [1, 2, 3, 8, 20].forEach((pitch) => {
      const field = blob.fieldFromDesign(design, 8, undefined, pitch);
      check(
        field.cells.every((entry) =>
          entry.connections.every(([type]) => type !== 8)
        ) && unmatchedTriangleCrossings(blob, field, pitch) === 0,
        `triangle closure: edit ${index} at ${pitch} leaves a lane open.`
      );
    })
  );
  DESIGN_SEEDS.forEach((seed) => {
    const config = {
      ...blob.sceneDefaults(),
      blobGridShape: 'triangle',
      blobSeed: seed,
      blobPathsPerUnit: 4,
    };
    const field = blob.fieldFromConfig(config);
    const design = blob.designFromField(field);
    check(
      design.layout === 'subdivide' &&
        designKey(blob, blob.normalizeDesign(design)) ===
          designKey(blob, design) &&
        design.cells.reduce(
          (sum, cell) => sum + blob.cornersOn(cell.mask).length,
          0
        ) >
          design.cells.length * 1.5,
      `triangle reference ${seed}: subdivision has unmatched edges or loses most of its connections.`
    );
    check(
      design.cells.reduce((sum, cell) => sum + cell.size ** 2, 0) ===
        24 * 16 ** 2 && blob.inkClashes(design) === 0,
      `triangle reference ${seed}: four-way subdivision loses area or overlaps cells.`
    );
    const code = blob.encodeDesign(design);
    const decoded = blob.decodeDesign(code);
    check(
      code.startsWith('tb7.') &&
        decoded &&
        designKey(blob, decoded) === designKey(blob, design),
      `triangle reference ${seed}: tb7 loses the subdivision model or fan ordering.`
    );
    const rebuilt = blob.fieldFromDesign(decoded, 8);
    check(
      rebuilt.count === field.count &&
        rebuilt.conn0.every((v, i) => v === field.conn0[i]) &&
        rebuilt.conn1.every((v, i) => v === field.conn1[i]),
      `triangle reference ${seed}: design/CLI fan geometry drifts from the seeded field.`
    );
    field.cells
      .filter((entry) => !entry.under && !entry.cap)
      .forEach(({ cell, connections }) => {
        connections.forEach(([type, edge]) => {
          if (type !== 4) return;
          const reach = Math.floor(edge / 6) % 2 === 1 ? 0.75 : 0.5;
          check(
            blob.laneCount(type, cell.size, 4, edge) ===
              cell.size * 4 * reach + 1,
            `triangle reference ${seed}: the reference's outer fan band is missing.`
          );
        });
      });
  });
}

// Straight two-way cells and per-stretch (irregular) subdivision joins: every
// visible stroke end meets another stroke, and both survive the codecs.
function checkTriangleStraightsAndIrregular(blob) {
  const seeded = blob.designFromSeed({
    ...blob.sceneDefaults(),
    blobGridShape: 'triangle',
    blobSeed: 'reference-1',
    blobTriangleMinRes: 0,
  });
  let straight = seeded;
  seeded.cells.forEach((_, index) => {
    if (blob.canStraighten(straight, index))
      straight = blob.toggleStraight(straight, index);
  });
  check(
    straight !== seeded &&
      seeded.cells.every(
        (cell, index) =>
          cell.mask % 8 !== 7 || !blob.canStraighten(seeded, index)
      ),
    'triangle straights: no two-way cell straightens, or a three-way one does.'
  );
  check(
    designKey(blob, blob.decodeDesign(blob.encodeDesign(straight))) ===
      designKey(blob, straight),
    'triangle straights: the tb7 code drops a straight cell.'
  );
  const index = straight.cells.findIndex((_, i) =>
    blob.canStraighten(straight, i)
  );
  check(
    designKey(
      blob,
      blob.toggleStraight(blob.toggleStraight(straight, index), index)
    ) === designKey(blob, straight),
    'triangle straights: toggling a cell twice does not restore it.'
  );
  [2, 4, 8].forEach((pitch) => {
    const field = blob.fieldFromDesign(straight, 8, undefined, pitch);
    check(
      field.cells.some((entry) => entry.connections[0][0] === 13) &&
        unmatchedTriangleCrossings(blob, field, pitch) === 0,
      `triangle straights @${pitch}: no stripes drawn, or a stroke end is exposed.`
    );
  });

  const holed = blob.eraseCell(seeded, Math.floor(seeded.cells.length / 2));
  let loose = blob.setIrregular(holed, true);
  check(
    loose.irregular &&
      loose.cells.every((cell, i) => cell.mask === holed.cells[i].mask),
    'triangle irregular: turning it on changes a subdivision design.'
  );
  loose.cells.forEach((_, i) =>
    [0, 1, 2].forEach((side) => {
      if (!blob.isCornerOpen(loose, i, side))
        loose = blob.setCorner(loose, i, side, true);
    })
  );
  loose.cells.forEach((cell, i) => {
    if (cell.size === 1 && i % 7 === 0)
      loose = blob.setCorner(loose, i, 0, false);
  });
  const code = blob.encodeDesign(loose);
  check(
    code.startsWith('tb8.') &&
      designKey(blob, blob.decodeDesign(code)) === designKey(blob, loose),
    'triangle irregular: the tb8 code loses per-stretch joins.'
  );
  const partial = (field) =>
    field.cells.filter(
      (entry) => entry.cap && entry.cell.size !== entry.cap.host.size
    ).length;
  [2, 4, 8, 13].forEach((pitch) => {
    const field = blob.fieldFromDesign(loose, 8, undefined, pitch);
    check(
      partial(field) > 0 &&
        unmatchedTriangleCrossings(blob, field, pitch) === 0,
      `triangle irregular @${pitch}: no partial returns, or a stroke end is exposed.`
    );
  });
  check(
    partial(
      blob.fieldFromDesign(blob.setIrregular(loose, false), 8, undefined, 4)
    ) === 0,
    'triangle irregular: turning it off leaves a side partly open.'
  );
}

function checkTriangles(blob) {
  const base = {
    ...blob.sceneDefaults(),
    blobGridShape: 'triangle',
    blobTriangleLayout: 'packed',
  };
  DESIGN_SEEDS.forEach((seed) => {
    [3, 6].forEach((pathDiv) => {
      const field = blob.fieldFromConfig({
        ...base,
        blobConnectivity: 0.8,
        blobHoles: 0.2,
        blobOneFill: 0.8,
        blobSeed: seed,
      });
      check(
        field.shape === 'triangle' && field.count > 0,
        `triangles ${seed}: a triangle grid shape draws no triangle field.`
      );
      const unmatched = unmatchedTriangleCrossings(blob, field, pathDiv);
      check(
        unmatched === 0,
        `triangles ${seed} @${pathDiv}: ${unmatched} arcs meet a side with nothing across it.`
      );
      const design = blob.designFromField(field);
      check(
        designKey(blob, blob.normalizeDesign(design)) ===
          designKey(blob, design),
        `triangles ${seed}: a seeded field breaks the corner rule normalizeDesign enforces.`
      );
      const again = blob.fieldFromDesign(
        blob.decodeDesign(blob.encodeDesign(design)),
        8
      );
      check(
        again.count === field.count &&
          again.conn0.every((v, i) => v === field.conn0[i]) &&
          again.conn1.every((v, i) => v === field.conn1[i]),
        `triangles ${seed}: a seeded field does not survive designFromField and the tb4 code.`
      );
      const json = blob.designFromJson(blob.designToJson(design));
      check(
        json && designKey(blob, json) === designKey(blob, design),
        `triangles ${seed}: a design does not survive designToJson/designFromJson.`
      );
    });
  });

  ['vertical', 'horizontal', 'diagonal', 'antidiagonal'].forEach((axis) => {
    const field = blob.fieldFromConfig({
      ...base,
      blobOneFill: 0.8,
      blobSeed: 'mirror',
      blobSymmetry: axis,
    });
    const design = blob.designFromField(field);
    const corners = (cell) =>
      blob.cellCorners(blob.triangleGeometry(cell)).map(([a, b]) => [a, b]);
    const map = {
      antidiagonal: ([a, b]) => [b, a],
      diagonal: ([a, b]) => [-b, -a],
      horizontal: ([a, b]) => [a + b, -b],
      vertical: ([a, b]) => [-a - b, b],
    }[axis];
    const footprint = (cell, mapped) => {
      const points = corners(cell)
        .map(mapped ? map : (p) => p)
        .map(([a, b]) => `${a},${b}`)
        .sort();
      return `${points.join('|')}:${blob.cornersOn(cell.mask).length}`;
    };
    const cells = new Set(design.cells.map((cell) => footprint(cell, false)));
    const mirrored = design.cells.every((cell) =>
      cells.has(footprint(cell, true))
    );
    check(
      mirrored && unmatchedTriangleCrossings(blob, field, 5) === 0,
      `triangles: a ${axis} symmetric field is not its own mirror, or its arcs dangle.`
    );
  });

  const ring = [
    [0, 0, false],
    [-1, 0, true],
    [-1, 0, false],
    [-1, -1, true],
    [0, -1, false],
    [0, -1, true],
  ];
  let hexagon = blob.emptyDesign({ shape: 'triangle' });
  ring.forEach(([column, row, up]) => {
    hexagon = blob.placeCell(hexagon, column, row, 1, { up });
  });
  const vertexOpen = hexagon.cells.map((cell) =>
    blob.cornersOn(cell.mask).length === 1
      ? blob
          .cellCorners(blob.triangleGeometry(cell))
          [blob.cornersOn(cell.mask)[0]].join()
      : null
  );
  check(
    hexagon.cells.length === 6 && vertexOpen.every((key) => key === '0,0'),
    'triangles: six triangles round a vertex do not open exactly the fan about it.'
  );
  check(
    blob.placeCell(hexagon, 0, 0, 1, { up: false }) === hexagon,
    'triangles: placeCell accepts a triangle over an existing one.'
  );
  const erased = blob.eraseCell(hexagon, 0);
  check(
    erased.cells.every((cell) => blob.cornersOn(cell.mask).length === 0),
    'triangles: erasing one of a vertex’s triangles leaves the others’ fans open.'
  );

  let big = blob.emptyDesign({ shape: 'triangle' });
  [
    [0, 0, 2, false],
    [0, 0, 2, true],
    [-2, 0, 2, true],
    [-2, 0, 2, false],
    [-2, -2, 2, true],
    [0, -2, 2, false],
    [0, -2, 2, true],
  ].forEach(([column, row, size, up]) => {
    big = blob.placeCell(big, column, row, size, { up });
  });
  const threeWay = big.cells.findIndex(
    (cell) => blob.cornersOn(cell.mask).length === 3
  );
  check(
    threeWay < 0 || blob.canReorder(big, threeWay),
    'triangles: a three-way cell has no draw order to choose.'
  );
  const hexIndex = hexagon.cells.findIndex(
    (cell) => blob.cornersOn(cell.mask).length > 0
  );
  check(
    !blob.canReorder(hexagon, hexIndex) &&
      blob.raiseCorner(hexagon, hexIndex, 0) === hexagon,
    'triangles: raiseCorner reorders a cell without three open corners.'
  );

  let cornerHost = blob.placeCell(
    blob.emptyDesign({ shape: 'triangle' }),
    0,
    0,
    6,
    { connect: false, up: false }
  );
  const corner = blob.placeCell(cornerHost, 0, 0, 1, {
    connect: false,
    up: false,
  });
  cornerHost = blob.placeCell(cornerHost, 2, 2, 1, {
    connect: false,
    up: false,
  });
  check(
    corner.cells.length === 2 &&
      blob.inkClashes(corner) === 0 &&
      blob.triIndexAt(corner, 0.5, 0.2) === 1 &&
      cornerHost.cells.length === 1,
    'triangles: a small cell is refused in a cornerHost cell’s empty corner, does not own it, or is let in where the cornerHosts reach.'
  );
  check(
    blob.designFromJson(
      blob.designToJson({
        ...cornerHost,
        cells: [...cornerHost.cells, { column: 2, mask: 0, row: 2, size: 1 }],
      })
    ) === null,
    'triangles: designFromJson accepts a cell overlapping a bigger one’s arcs.'
  );

  const enclosed = enclosedDesign(blob);
  const enclosedField = blob.fieldFromDesign(enclosed, 8);
  const families = new Set(
    enclosedField.cells
      .filter((entry) => entry.virtual)
      .flatMap((entry) => entry.connections.map(([type]) => type))
  );
  check(
    families.has(6) && families.has(7),
    'triangles: a ring cell closed inside small triangles draws no pockets and bends with irregular connections on.'
  );
  [3, 4, 5].forEach((pathDiv) => {
    const unmatched = unmatchedTriangleCrossings(blob, enclosedField, pathDiv);
    check(
      unmatched === 0,
      `triangles irregular @${pathDiv}: ${unmatched} arcs meet a side with nothing across it.`
    );
  });
  const enclosedCode = blob.encodeDesign(enclosed);
  check(
    enclosedCode.startsWith('tb5.') &&
      designKey(blob, blob.decodeDesign(enclosedCode)) ===
        designKey(blob, enclosed) &&
      blob
        .fieldFromDesign(blob.setIrregular(enclosed, false), 8)
        .cells.every((entry) => !entry.virtual),
    'triangles: an irregular design does not survive its tb5 code, or turning irregular off keeps its pockets.'
  );

  const rolls = Array.from({ length: 400 }, (_, i) =>
    blob.rollBlobConfig(`tri-${i}`)
  );
  const triangles = rolls.filter((c) => c.blobGridShape === 'triangle');
  check(
    triangles.length > 400 * blob.TRIANGLE_ROLL_CHANCE * 0.5 &&
      triangles.length < 400 * blob.TRIANGLE_ROLL_CHANCE * 1.6 &&
      triangles.every(
        (c) =>
          !c.blobIrregular &&
          c.blobStraights === 0 &&
          [0, 30].includes(c.planeRotation)
      ),
    `triangles: ${triangles.length}/400 rolls are triangles, or a triangle roll keeps straights, irregular sides or a 45° turn.`
  );
  check(
    blob.gridShapeOf({ blobDesign: blob.encodeDesign(hexagon) }) ===
      'triangle' &&
      blob.gridShapeOf({ blobDesign: '', blobGridShape: 'triangle' }) ===
        'triangle',
    'triangles: gridShapeOf misreads a triangle design or blobGridShape.'
  );
}

async function checkDesignRotation(blob) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'trucheterie-check-'));
  try {
    const file = path.join(dir, 'turned.json');
    await writeFile(
      file,
      JSON.stringify({ cells: [[0, 0, 2, 0]], name: 'turned', rotation: 135 })
    );
    const resolved = withResolvedDesign(blob, { blobDesign: file });
    const typed = withResolvedDesign(blob, {
      blobDesign: file,
      planeRotation: 10,
    });
    const coded = withResolvedDesign(blob, {
      blobDesign: resolved.blobDesign,
    });
    check(
      resolved.planeRotation === 135 &&
        blob.isDesignCode(resolved.blobDesign) &&
        typed.planeRotation === 10 &&
        coded.planeRotation === undefined,
      "design: a saved design's rotation is not pinned as planeRotation (or overrides a typed one)."
    );
  } finally {
    await rm(dir, { force: true, recursive: true });
  }
}

// The scene's field memo forwards named keys, so a new generator key it misses never reaches the field.
async function checkSceneForwardsGenerator(blob) {
  const file = path.join(
    REPO_ROOT,
    'src/components/scenes/WebGPU/Trucheterie/components/BlobFieldMesh.jsx'
  );
  const source = await readFile(file, 'utf8');
  const missing = blob.GENERATOR_KEYS.filter(
    (key) =>
      key !== 'blobPathsPerUnit' &&
      !new RegExp(`fieldFromConfig\\([^)]*\\b${key}\\b`, 'su').test(source)
  );
  check(
    missing.length === 0,
    `BlobFieldMesh does not pass ${missing.join(', ')} to fieldFromConfig.`
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
        `designs/${name} is not a valid design (out-of-range cells, or cells overlapping where arcs reach).`
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
  checkMove(loaded[BARRELS.blob]);
  checkDuplicate(loaded[BARRELS.blob]);
  checkIrregular(loaded[BARRELS.blob]);
  checkStraights(loaded[BARRELS.blob]);
  checkSymmetry(loaded[BARRELS.blob]);
  checkTriangles(loaded[BARRELS.blob]);
  checkTriangleReference(loaded[BARRELS.blob], loaded[BARRELS.look]);
  checkTriangleStraightsAndIrregular(loaded[BARRELS.blob]);
  await checkSceneForwardsGenerator(loaded[BARRELS.blob]);
  await checkDesignRotation(loaded[BARRELS.blob]);
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
