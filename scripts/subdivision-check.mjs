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
  CUT_DRIVERS,
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
const VARIANTS = LATTICES.flatMap((lattice) =>
  lattice === 'rect'
    ? CUT_DRIVERS.map((cutDriver) => ({ cutDriver, lattice }))
    : [{ lattice }]
);
const variantLabel = ({ cutDriver, lattice }) =>
  cutDriver ? `${lattice}:${cutDriver}` : lattice;
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
  VARIANTS.forEach((variant) => {
    DRIVERS.forEach((driver) => {
      const config = {
        ...sceneDefaults(),
        ...plotOptionsFrom(defaultsFor('still')),
        ...variant,
        driver,
        seed: 'check',
      };
      const piece = subdivision.buildPiece(config, { canvas: CANVAS, stops });
      const { height, width } = piece.canvas;
      const leaves = piece.nodes.filter((node) => node.leaf);
      const covered = leaves.reduce(
        (sum, node) => sum + clipArea(node.poly, width, height),
        0
      );
      const label = `${variantLabel(variant)}/${driver}`;
      check(leaves.length > 0, `${label}: no leaves`);
      check(
        Math.abs(covered - width * height) / (width * height) < 1e-6,
        `${label}: leaves cover ${covered.toFixed(1)} of ${width * height} — the tree does not tile the canvas`
      );
      check(
        piece.nodes.every((node) => node.free <= config.levels),
        `${label}: a node splits past levels`
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
  VARIANTS.forEach((variant) => {
    ['2-fold', '4-fold'].forEach((symmetry) => {
      DRIVERS.forEach((driver) => {
        const config = {
          ...sceneDefaults(),
          ...variant,
          colorMode: 'random',
          driver,
          holeChance: 0.15,
          seed: 'check',
          symmetry,
        };
        const piece = subdivision.buildPiece(config, { canvas: CANVAS, stops });
        const leaves = piece.nodes.filter((node) => node.leaf);
        const look = (n) => (n.hole ? 'hole' : n.fill);
        const bins = new Map();
        const bin = (x, y) => `${Math.round(x)},${Math.round(y)}`;
        leaves.forEach((n) => {
          const k = bin(n.cx, n.cy);
          bins.set(k, [...(bins.get(k) ?? []), n]);
        });
        const lookAt = (x, y) => {
          for (let dx = -1; dx <= 1; dx += 1) {
            for (let dy = -1; dy <= 1; dy += 1) {
              const hit = (bins.get(bin(x + dx, y + dy)) ?? []).find(
                (n) => Math.abs(n.cx - x) < 0.05 && Math.abs(n.cy - y) < 0.05
              );
              if (hit) return look(hit);
            }
          }
          return null;
        };
        const label = `${variantLabel(variant)}/${symmetry}/${driver}`;
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
          return twins.some(([x, y]) => lookAt(x, y) !== look(node));
        });
        check(
          broken.length === 0,
          `${label}: ${broken.length} leaves have no mirror twin of their colour`
        );
      });
    });
  });
}

// Mid-slide, the cells on screen still tile the canvas: a cut sweeping in
// opens one child exactly as much as it closes the other.
function checkSlide({ subdivision }) {
  const { height, width } = CANVAS;
  VARIANTS.filter(({ lattice }) => lattice !== 'tri').forEach((variant) => {
    const config = {
      ...sceneDefaults(),
      ...variant,
      driver: 'variance',
      growStyle: 'slide',
      outlineWidth: 0,
      seed: 'check',
    };
    const piece = subdivision.buildPiece(config, { canvas: CANVAS });
    const top = subdivision.fullyGrown(piece);
    [0, 0.5, 1.25, 2.6, top - 0.4, top].forEach((grow) => {
      const covered = piece.nodes.reduce((sum, node) => {
        const cell = subdivision.grownCell(node, grow, config.growStyle);
        return cell ? sum + clipArea(cell.poly, width, height) : sum;
      }, 0);
      check(
        Math.abs(covered - width * height) / (width * height) < 1e-6,
        `${variantLabel(variant)}/slide at grow ${grow}: cells cover ${covered.toFixed(1)} of ${width * height}`
      );
    });
  });
}

function checkHoles({ subdivision }) {
  const config = {
    ...sceneDefaults(),
    holeChance: 0.2,
    lattice: 'rect',
    seed: 'check',
  };
  const piece = subdivision.buildPiece(config, { canvas: CANVAS });
  const holes = piece.nodes.filter((node) => node.hole);
  check(holes.length > 0, 'holes: holeChance 0.2 left no holes');
  check(
    holes.every((node) => node.leaf),
    'holes: a hole has children'
  );
  const fill = subdivision.renderFillSvg(piece, { ...config, outlineWidth: 0 });
  const drawn = (fill.match(/Z/gu) ?? []).length;
  const shown = piece.nodes.filter((node) => node.leaf && !node.hole).length;
  check(
    drawn === shown,
    `holes: the still draws ${drawn} cells, not the ${shown} non-hole leaves`
  );
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
  checkSlide(modules);
  checkHoles(modules);
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
