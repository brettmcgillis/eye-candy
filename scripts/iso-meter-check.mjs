#!/usr/bin/env node

/* eslint-disable no-bitwise, no-console */
// Invariants for the IsoMeter kernel: it stays three-free, and each ported
// piece reproduces the original p5 sketch bit for bit. The goldens were read
// out of the live originals (Highlight, p5 1.2.0) at the same h/tid: the
// triangle map, p5-rounded fill colours, and the outline/line segment sets.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  RENDER_OPTIONS,
  SCENE_KEYS,
} from '../src/modules/isoMeter/renderOptions.mjs';
import loadModules, { REPO_ROOT } from './lib/loadModules.mjs';
import checkWorkbenchPage from './lib/workbenchPage.mjs';

const KERNEL_DIR = path.join(REPO_ROOT, 'src', 'modules', 'isoMeter');
const ENTRY = '/src/modules/isoMeter/index.js';
const PRESETS_ENTRY =
  '/src/components/scenes/WebGPU/IsoMeter/presets/presets.js';
const PALETTES_ENTRY = '/src/utils/gradientPalette.js';
const WORKBENCH_PAGE = path.join(
  REPO_ROOT,
  'src/dev/tools/isoMeter/IsoMeterWorkbenchPage.jsx'
);

const GOLDENS = [
  {
    col: '83ee1be',
    geo: 'a3430764',
    hash: `0x${'1'.repeat(64)}`,
    l: '394ef298',
    n: 22118,
    o: 'ea93476f',
    piece: 'ambifeuille',
    tokenId: '7',
  },
  {
    col: '334100db',
    geo: '3ae13da4',
    hash: `0x${'4'.repeat(64)}`,
    l: 'a1d192dc',
    n: 23779,
    o: 'ce01f08d',
    piece: 'ambifeuille',
    tokenId: '4',
  },
  {
    col: '90162ca8',
    geo: '396eb62f',
    hash: `0x${'2'.repeat(64)}`,
    l: '815d6810',
    n: 31712,
    o: '2aee4d3a',
    piece: 'dixfeuille',
    tokenId: '12',
  },
  {
    col: '57d5fb3',
    geo: 'b4f69ae8',
    hash: `0x${'3'.repeat(64)}`,
    l: '39aad51b',
    n: 36342,
    o: '1044d49',
    piece: 'dixfeuille',
    tokenId: '15',
  },
];

const WINTERKAMMER = {
  aspect: 1440 / 668,
  background: {
    col: '8973b2e2',
    geo: '1f9713a1',
    l: '11b186ac',
    n: 10968,
    o: 'b8036687',
  },
  hash: '0xb5eaf49fa8ff11cc6cdd43f5675d5278e204c539255c2c062b27c11af21d08d5',
  regrowths: {
    0: ['10048:e4f9e38f:433f8967'],
    1: ['4112:74c3976b:3a40da9e'],
    2: ['4018:32214cb6:1f6280ff', '3752:d46299ea:2c99d4d8'],
    9: ['1118:64b13374:37409b1a'],
    11: ['1076:2c9e2a3e:537fa212', '724:f0cb86eb:a68edfdf'],
    13: ['1260:69056ae0:adde3116', '1364:967ff747:5fd27884'],
    15: ['1034:c70a262:b3a0be2'],
  },
  tiles: {
    0: {
      col: 'fb608f6a',
      geo: '9b3c8aa3',
      l: 'e4be9684',
      n: 9652,
      o: '8d089257',
    },
    1: {
      col: 'ba44c9e',
      geo: 'ebac04c3',
      l: 'd7ba93ea',
      n: 3810,
      o: '9753bc62',
    },
    2: {
      col: '90381f6a',
      geo: '4520c7a8',
      l: '571779e8',
      n: 3963,
      o: 'bf923098',
    },
    5: {
      col: '852aa99b',
      geo: '970b4545',
      l: 'd44afa57',
      n: 456,
      o: '709deab9',
    },
    6: {
      col: '263eb30f',
      geo: '116da421',
      l: '25188b7f',
      n: 412,
      o: '9cccf081',
    },
    9: {
      col: '9a03b148',
      geo: 'e38233ef',
      l: 'e306e5a0',
      n: 1144,
      o: '35815d17',
    },
    11: {
      col: 'c42765bc',
      geo: '44ffd9ff',
      l: '9197ec0e',
      n: 1054,
      o: '369f23b7',
    },
    13: {
      col: '4bdb5841',
      geo: '56399cc1',
      l: '4e961545',
      n: 1135,
      o: 'fe3065fa',
    },
    15: {
      col: '42b6a926',
      geo: '345d368b',
      l: '9bb13f65',
      n: 823,
      o: '701cf70d',
    },
  },
};

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

const fnv = (lines) => {
  let h = 2166136261;
  const s = lines.join('\n');
  for (let i = 0; i < s.length; i += 1) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  }
  return (h >>> 0).toString(16);
};

const segmentSet = (segments) =>
  [
    ...new Set(
      segments.map(([p, q]) => [p.join(','), q.join(',')].sort().join('|'))
    ),
  ].sort();

async function sourceFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return sourceFiles(full);
      return /\.m?js$/u.test(entry.name) ? [full] : [];
    })
  );
  return nested.flat();
}

async function checkThreeFree() {
  const files = await sourceFiles(KERNEL_DIR);
  await Promise.all(
    files.map(async (file) => {
      const source = await readFile(file, 'utf8');
      check(
        !/from '(three|react|leva)[/']/u.test(source),
        `${path.relative(KERNEL_DIR, file)} imports three, React or Leva; the kernel is three-free`
      );
    })
  );
}

function checkGoldens(kernel) {
  const creators = {
    ambifeuille: kernel.createAmbifeuille,
    dixfeuille: kernel.createDixfeuille,
  };
  GOLDENS.forEach((golden) => {
    const label = `${golden.piece} ${golden.hash.slice(0, 6)}… #${golden.tokenId}`;
    const piece = creators[golden.piece]({
      hash: golden.hash,
      tokenId: golden.tokenId,
    });
    const build = kernel.buildPiece(piece);
    const tris = [...build.lattice.map.values()];
    const heights = build.heights();
    const { lines, outlines } = kernel.collectEdges(build.lattice, {
      threshold: piece.edgeThreshold,
    });
    const actual = {
      col: fnv(
        tris.map((t) => `${t.hash}:${piece.shade(t, heights).join(',')}`).sort()
      ),
      geo: fnv(
        tris.map((t) => `${t.hash}:${t.element}:${t.orientation}:${t.z}`).sort()
      ),
      l: fnv(segmentSet(lines)),
      n: tris.length,
      o: fnv(segmentSet(outlines)),
    };
    ['n', 'geo', 'col', 'o', 'l'].forEach((key) => {
      check(
        actual[key] === golden[key],
        `${label}: ${key} ${actual[key]} ≠ original ${golden[key]}`
      );
    });
  });
}

function tileSignature(kernel, lattice, shade) {
  const tris = [...lattice.map.values()];
  const { lines, outlines } = kernel.collectEdges(lattice, {
    outlineMode: 2,
    threshold: 6,
  });
  return {
    col: fnv(tris.map((t) => `${t.hash}:${shade(t).join(',')}`).sort()),
    geo: fnv(
      tris.map((t) => `${t.hash}:${t.element}:${t.orientation}:${t.z}`).sort()
    ),
    l: fnv(segmentSet(lines)),
    n: tris.length,
    o: fnv(segmentSet(outlines)),
  };
}

function compareSignature(label, actual, golden) {
  ['n', 'geo', 'col', 'o', 'l'].forEach((key) => {
    check(
      actual[key] === golden[key],
      `${label}: ${key} ${actual[key]} ≠ original ${golden[key]}`
    );
  });
}

const NULL_PAINTER = {
  background() {},
  polygon() {},
  segments() {},
  triangles() {},
};

function checkWinterkammer(kernel) {
  const { aspect, hash } = WINTERKAMMER;
  const piece = kernel.createWinterkammer({ aspect, hash });
  const background = piece.backgroundTile;
  compareSignature(
    'winterkammer background',
    tileSignature(kernel, background.lattice, background.shade),
    WINTERKAMMER.background
  );
  const run = kernel.createWinterkammerRun(piece);
  for (let frame = 0; frame < 160; frame += 1) run.step(NULL_PAINTER);
  Object.entries(WINTERKAMMER.tiles).forEach(([n, golden]) => {
    const tile = piece.tiles[n];
    compareSignature(
      `winterkammer tile ${n} (${tile.kind}) first build`,
      tileSignature(kernel, tile.lattice, tile.shade),
      golden
    );
  });

  const fresh = kernel.createWinterkammer({ aspect, hash });
  Object.entries(WINTERKAMMER.regrowths).forEach(([n, builds]) => {
    const tile = fresh.tiles[n];
    for (let r = 0; r < -tile.delay; r += 1) tile.rng.roll();
    builds.forEach((golden, b) => {
      tile.prepare(0);
      kernel.buildWinterkammerTile(tile);
      const tris = [...tile.lattice.map.values()];
      const actual = `${tris.length}:${fnv(
        tris.map((t) => `${t.hash}:${t.element}:${t.orientation}:${t.z}`).sort()
      )}:${fnv(tris.map((t) => `${t.hash}:${tile.shade(t).join(',')}`).sort())}`;
      check(
        actual === golden,
        `winterkammer tile ${n} regrowth ${b + 1}: ${actual} ≠ original ${golden}`
      );
      tile.rng.roll();
    });
  });
}

function voxelSignature(datas) {
  const faces = [];
  const outlines = new Set();
  const lines = new Set();
  const seg = (arr, n) => {
    const a = [arr[n], arr[n + 1], arr[n + 2]].join(',');
    const b = [arr[n + 3], arr[n + 4], arr[n + 5]].join(',');
    return [a, b].sort().join('|');
  };
  datas.forEach((data) => {
    for (let f = 0; f < data.faces; f += 1) {
      faces.push(
        `${data.positions.slice(f * 18, f * 18 + 18).join(',')}:${data.colors.slice(f * 18, f * 18 + 3).join(',')}`
      );
    }
    for (let n = 0; n < data.outlines.length; n += 6)
      outlines.add(seg(data.outlines, n));
    for (let n = 0; n < data.lines.length; n += 6)
      lines.add(seg(data.lines, n));
  });
  return `${faces.length}:${fnv(faces.sort())}:${fnv([...outlines].sort())}:${fnv([...lines].sort())}`;
}

function checkVoxelsMatch(kernel, label, cubeBatches, finalCubes, shade) {
  const set = kernel.createVoxelSet();
  const merged = new Map();
  cubeBatches.forEach((batch, chunk) => {
    batch.forEach((cube) => set.add(cube, chunk, { settled: false }));
    set.flush(shade).forEach((data, id) => merged.set(id, data));
  });
  set.markAll();
  while (set.dirtyCount) {
    set.flush(shade, 2500).forEach((data, id) => merged.set(id, data));
  }
  const incremental = voxelSignature([...merged.values()]);
  const whole = voxelSignature([kernel.voxelData(finalCubes, shade)]);
  check(
    incremental === whole,
    `${label} voxels: chunked ${incremental} ≠ whole ${whole}`
  );
}

function checkVoxels(kernel) {
  [
    ['ambifeuille', kernel.createAmbifeuille, `0x${'1'.repeat(64)}`, '7'],
    ['dixfeuille', kernel.createDixfeuille, `0x${'3'.repeat(64)}`, '15'],
  ].forEach(([label, create, hash, tokenId]) => {
    const piece = create({ hash, tokenId });
    const build = kernel.createBuild(piece, { record: true });
    const batches = [];
    let read = 0;
    while (!build.done) {
      build.step(1);
      batches.push(build.lattice.cubeLog.slice(read));
      read = build.lattice.cubeLog.length;
    }
    const heights = build.heights();
    checkVoxelsMatch(kernel, label, batches, build.lattice.cubes, (tri) =>
      piece.shade(tri, heights)
    );
  });
  const wk = kernel.createWinterkammer(WINTERKAMMER);
  const tile = wk.tiles[0];
  kernel.buildWinterkammerTile(tile);
  const log = tile.lattice.cubeLog;
  const batches = [];
  for (let n = 0; n < log.length; n += 700) batches.push(log.slice(n, n + 700));
  checkVoxelsMatch(
    kernel,
    'winterkammer tile 0',
    batches,
    tile.lattice.cubes,
    tile.shade
  );
}

function checkValue(label, key, value, paletteNames) {
  const spec = RENDER_OPTIONS[key];
  check(SCENE_KEYS.includes(key), `${label}: ${key} is not a scene key`);
  if (!spec) return;
  if (spec.type === 'number') {
    check(
      value >= spec.min && value <= spec.max,
      `${label}: ${key}=${value} is outside ${spec.min}..${spec.max}`
    );
  }
  if (spec.type === 'enum') {
    check(
      spec.choices.includes(value),
      `${label}: ${key}=${value} is not one of ${spec.choices.join(', ')}`
    );
  }
  if (key === 'palette') {
    check(
      value === 'None' || paletteNames.includes(value),
      `${label}: palette "${value}" is not in gradients.json`
    );
  }
}

function checkPresetsAndRolls(kernel, presets, palettes) {
  const names = palettes.PALETTE_NAMES;
  Object.entries(presets.PRESETS).forEach(([name, preset]) => {
    Object.entries(preset).forEach(([key, value]) =>
      checkValue(`preset "${name}"`, key, value, names)
    );
  });
  for (let n = 0; n < 40; n += 1) {
    const name = kernel.seedFor('check', n);
    const config = kernel.rollConfig(name, { palettes: names });
    Object.entries(config).forEach(([key, value]) =>
      checkValue(`roll ${name}`, key, value, names)
    );
    if (config.piece !== 'winterkammer') {
      const stops =
        config.palette === 'None'
          ? null
          : palettes.getPaletteStops(config.palette);
      const piece = kernel.pieceFromConfig(config, { stops });
      const sample = piece.palettes.flat(2);
      check(
        sample.every((v) => Number.isFinite(v) && v >= 0 && v <= 255),
        `roll ${name}: palette remap produced an invalid channel`
      );
    }
  }
}

async function main() {
  await checkThreeFree();
  const loaded = await loadModules([ENTRY, PRESETS_ENTRY, PALETTES_ENTRY]);
  const kernel = loaded[ENTRY];
  checkPresetsAndRolls(kernel, loaded[PRESETS_ENTRY], loaded[PALETTES_ENTRY]);
  await checkWorkbenchPage(WORKBENCH_PAGE, RENDER_OPTIONS, check);
  checkGoldens(kernel);
  checkWinterkammer(kernel);
  checkVoxels(kernel);

  if (failures.length > 0) {
    console.error(`iso-meter:check failed:\n  ${failures.join('\n  ')}`);
    process.exit(1);
  }
  console.log('iso-meter:check passed');
  process.exit(0);
}

main().catch((error) => {
  console.error(error.stack ?? error);
  process.exit(1);
});
