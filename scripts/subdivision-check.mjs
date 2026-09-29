#!/usr/bin/env node

/* eslint-disable no-console */
// Invariants for the Subdivision pipeline: the kernel's leaves tile the
// canvas on every lattice and driver, every colour mode renders non-empty
// finite geometry, and scene presets stay inside the schema's ranges (Leva
// clamps an out-of-range preset silently).
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  COLOR_MODES,
  DRIVERS,
  LATTICES,
  RENDER_OPTIONS,
  SCENE_KEYS,
  defaultsFor,
  plotOptionsFrom,
  sceneDefaults,
} from '../src/modules/subdivision/renderOptions.mjs';
import loadModules, { REPO_ROOT } from './lib/loadModules.mjs';

const KERNEL_DIR = path.join(REPO_ROOT, 'src', 'modules', 'subdivision');
const ENTRIES = {
  palettes: '/src/utils/gradientPalette.js',
  presets: '/src/components/scenes/WebGPU/Subdivision/presets/presets.js',
  subdivision: '/src/modules/subdivision/index.js',
};

const CANVAS = { height: 1350, width: 1080 };
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

function polyArea(poly) {
  let area = 0;
  for (let i = 0; i < poly.length; i += 2) {
    const j = (i + 2) % poly.length;
    area += poly[i] * poly[j + 1] - poly[j] * poly[i + 1];
  }
  return Math.abs(area) / 2;
}

function clipArea(poly, width, height) {
  let out = poly;
  [
    [0, 0, false],
    [0, width, true],
    [1, 0, false],
    [1, height, true],
  ].forEach(([axis, bound, below]) => {
    const next = [];
    const n = out.length / 2;
    for (let i = 0; i < n; i += 1) {
      const j = (i + 1) % n;
      const a = [out[i * 2], out[i * 2 + 1]];
      const b = [out[j * 2], out[j * 2 + 1]];
      const inA = below ? a[axis] <= bound : a[axis] >= bound;
      const inB = below ? b[axis] <= bound : b[axis] >= bound;
      if (inA) next.push(...a);
      if (inA !== inB) {
        const t = (bound - a[axis]) / (b[axis] - a[axis]);
        next.push(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t);
      }
    }
    out = next;
  });
  return out.length >= 6 ? polyArea(out) : 0;
}

async function checkThreeFree() {
  const files = (await readdir(KERNEL_DIR)).filter((f) => /\.m?js$/u.test(f));
  await Promise.all(
    files.map(async (file) => {
      const source = await readFile(path.join(KERNEL_DIR, file), 'utf8');
      check(
        !/from '(three|react|leva)[/']/u.test(source) &&
          !/@utils\/gradientPalette/u.test(source),
        `${file} imports three, React, Leva or gradientPalette; the kernel is three-free`
      );
    })
  );
}

function checkPieces({ palettes, subdivision }) {
  const stops = palettes.getPaletteStops('Combi');
  LATTICES.forEach((lattice) => {
    DRIVERS.forEach((driver) => {
      const config = {
        ...sceneDefaults(),
        ...plotOptionsFrom(defaultsFor('still')),
        driver,
        lattice,
        seed: 'check',
      };
      const piece = subdivision.buildPiece(config, { canvas: CANVAS, stops });
      const { height, width } = piece.canvas;
      const leaves = piece.nodes.filter((node) => node.leaf);
      const covered = leaves.reduce(
        (sum, node) => sum + clipArea(node.poly, width, height),
        0
      );
      const label = `${lattice}/${driver}`;
      check(leaves.length > 0, `${label}: no leaves`);
      check(
        Math.abs(covered - width * height) / (width * height) < 1e-6,
        `${label}: leaves cover ${covered.toFixed(1)} of ${width * height} — the tree does not tile the canvas`
      );
      check(
        piece.nodes.every((node) => node.depth <= config.levels),
        `${label}: a node is deeper than levels`
      );
      check(
        piece.nodes.some((node) => !node.leaf),
        `${label}: nothing split at the defaults`
      );

      COLOR_MODES.forEach((colorMode) => {
        const shaded = subdivision.buildPiece(
          { ...config, colorMode },
          { canvas: CANVAS, stops }
        );
        const fill = subdivision.renderFillSvg(shaded, config);
        const plot = subdivision.renderPlotSvg(shaded, config);
        const tag = `${label}/${colorMode}`;
        check(
          !/NaN|Infinity|undefined/u.test(fill + plot),
          `${tag}: non-finite SVG`
        );
        check(
          (fill.match(/<path/gu) ?? []).length > 0,
          `${tag}: the fill SVG draws no cells`
        );
        check(
          /id="pen-outline"/u.test(plot),
          `${tag}: the plot SVG has no outline layer`
        );
        const top = subdivision.fullyGrown(shaded);
        check(
          subdivision.renderFillSvg(shaded, config, { grow: top }) === fill,
          `${tag}: a fully grown frame differs from the still`
        );
        const roots = shaded.nodes.filter((node) => node.depth === 0).length;
        const atZero = subdivision.renderFillSvg(shaded, config, { grow: 0 });
        check(
          (atZero.match(/Z/gu) ?? []).length === roots * 2,
          `${tag}: grow 0 is not exactly the root grid`
        );
      });
    });
  });
}

function checkSymmetry({ palettes, subdivision }) {
  const stops = palettes.getPaletteStops('Combi');
  const { height, width } = CANVAS;
  LATTICES.forEach((lattice) => {
    ['2-fold', '4-fold'].forEach((symmetry) => {
      DRIVERS.forEach((driver) => {
        const config = {
          ...sceneDefaults(),
          colorMode: 'random',
          driver,
          lattice,
          seed: 'check',
          symmetry,
        };
        const piece = subdivision.buildPiece(config, { canvas: CANVAS, stops });
        const leaves = piece.nodes.filter((node) => node.leaf);
        const at = (x, y) =>
          `${Math.round(x * 10 + 0.3)},${Math.round(y * 10 + 0.3)}`;
        const fills = new Map(leaves.map((n) => [at(n.cx, n.cy), n.fill]));
        const label = `${lattice}/${symmetry}/${driver}`;
        const covered = leaves.reduce(
          (sum, node) => sum + clipArea(node.poly, width, height),
          0
        );
        check(
          Math.abs(covered - width * height) / (width * height) < 1e-6,
          `${label}: leaves do not tile the canvas`
        );
        const broken = leaves.filter((node) => {
          const twins = [[width - node.cx, node.cy]];
          if (symmetry === '4-fold') twins.push([node.cx, height - node.cy]);
          return twins.some(([x, y]) => fills.get(at(x, y)) !== node.fill);
        });
        check(
          broken.length === 0,
          `${label}: ${broken.length} leaves have no mirror twin of their colour`
        );
      });
    });
  });
}

function checkPresets({ presets }) {
  Object.entries(presets.PRESETS).forEach(([name, preset]) => {
    Object.entries(preset).forEach(([key, value]) => {
      const spec = RENDER_OPTIONS[key];
      check(
        SCENE_KEYS.includes(key),
        `preset "${name}": ${key} is not a scene key`
      );
      if (!spec) return;
      if (spec.type === 'number') {
        check(
          value >= spec.min && value <= spec.max,
          `preset "${name}": ${key}=${value} is outside ${spec.min}..${spec.max}`
        );
      }
      if (spec.type === 'enum') {
        check(
          spec.choices.includes(value),
          `preset "${name}": ${key}=${value} is not one of ${spec.choices.join(', ')}`
        );
      }
    });
  });
}

async function main() {
  await checkThreeFree();
  const loaded = await loadModules(Object.values(ENTRIES));
  const modules = Object.fromEntries(
    Object.entries(ENTRIES).map(([name, entry]) => [name, loaded[entry]])
  );
  checkPieces(modules);
  checkSymmetry(modules);
  checkPresets(modules);

  if (failures.length > 0) {
    console.error(`subdivision:check failed:\n  ${failures.join('\n  ')}`);
    process.exit(1);
  }
  console.log('subdivision:check passed');
  process.exit(0);
}

main().catch((error) => {
  console.error(error.stack ?? error);
  process.exit(1);
});
