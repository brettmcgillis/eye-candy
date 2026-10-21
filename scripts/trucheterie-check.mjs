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
          (planeRotation === 45) ===
          (blobSymmetry === 'diagonal' || blobSymmetry === 'antidiagonal')
      ),
    `symmetry: ${on.length}/400 rolls are symmetric, or an axis ignores the rotation.`
  );
  const turned = blob.rollBlobConfig(
    rolls.indexOf(on.find((c) => c.planeRotation === 0)) >= 0
      ? `sym-${rolls.indexOf(on.find((c) => c.planeRotation === 0))}`
      : 'sym-0',
    { pinned: { planeRotation: 45 } }
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
  checkSymmetry(loaded[BARRELS.blob]);
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
