import * as THREE from 'three/webgpu';

import { PIXEL_RISE } from './elevation';
import terraceRings from './pits';
import layoutSteps, { wellDepth } from './stairs';

const NEON_SLOTS = { amber: 2, cyan: 1, magenta: 0 };
const WALL_OVERLAP = 0.25;
const ALIVE = 1e9;
const MIN_TOWER_SCALE = 0.05;

export const LAYER_KEYS = [
  'glowPits',
  'glowTerraces',
  'neon',
  'pits',
  'plazas',
  'steps',
  'taperWalls',
  'terraces',
  'towers',
  'wells',
];

const scratchPosition = new THREE.Vector3();
const scratchQuaternion = new THREE.Quaternion();
const scratchScale = new THREE.Vector3();

function hash(cell, a = 41.17, b = 289.3) {
  const value = Math.sin(cell.rect.w * a + cell.rect.h * b) * 21374.53;

  return value - Math.floor(value);
}

function makeMatrix(rect, origin, height) {
  scratchPosition.set(rect.x + rect.w / 2, origin, rect.y + rect.h / 2);
  scratchScale.set(rect.w, height, rect.h);

  return new THREE.Matrix4().compose(
    scratchPosition,
    scratchQuaternion,
    scratchScale
  );
}

function atLeast(rect, minimum) {
  const w = Math.max(rect.w, minimum);
  const h = Math.max(rect.h, minimum);

  return { h, w, x: rect.x - (w - rect.w) / 2, y: rect.y - (h - rect.h) / 2 };
}

function grow(rect, amount) {
  return {
    h: Math.max(rect.h + amount * 2, 0.001),
    w: Math.max(rect.w + amount * 2, 0.001),
    x: rect.x - amount,
    y: rect.y - amount,
  };
}

function instance(cell, matrix, info = [0, 0, 0, 0]) {
  return {
    info,
    life: [cell.birth, cell.death ?? ALIVE],
    matrix,
    seed: hash(cell),
  };
}

function addPlaza(layers, cell, metrics) {
  const jitter = (hash(cell, 7.31, 113.9) - 0.5) * 2 * metrics.cardFloatJitter;
  const base =
    cell.rise * PIXEL_RISE * metrics.plazaLift * Math.max(1 + jitter, 0);
  const gap = metrics.cardStackGap * PIXEL_RISE;
  const pivot = [cell.rect.x, cell.rect.y];

  for (let level = 0; level < metrics.cardStack; level += 1) {
    const matrix = makeMatrix(
      cell.rect,
      base + level * gap,
      metrics.cardThickness
    );

    layers.plazas.push(instance(cell, matrix, [...pivot, level, 0]));
  }

  if (cell.neon) {
    const top = base + (metrics.cardStack - 1) * gap + metrics.cardThickness;
    const pad = grow(cell.rect, -cell.neon.inset);
    const matrix = makeMatrix(pad, top, metrics.neonThickness);

    layers.neon.push(
      instance(cell, matrix, [...pivot, NEON_SLOTS[cell.neon.slot], 0])
    );
  }

  return 0;
}

function addTerraces(layers, cell, metrics, depth) {
  const layerDepth = metrics.pitLayerDepth * PIXEL_RISE;
  const target = cell.glow ? layers.glowTerraces : layers.terraces;
  const rings = terraceRings(
    cell.rect,
    metrics.pitLayers,
    metrics.pitTerraceInset
  );

  rings.forEach(({ layer, strips }) => {
    strips.forEach((strip) => {
      const matrix = makeMatrix(strip, -depth, depth - layer * layerDepth);

      target.push(instance(cell, matrix, [metrics.pitLayers, layer, 0, 0]));
    });
  });
}

function addPit(layers, cell, metrics) {
  const depth = metrics.pitLayers * metrics.pitLayerDepth * PIXEL_RISE;
  const shaft = makeMatrix(grow(cell.rect, WALL_OVERLAP), 0, depth);

  (cell.glow ? layers.glowPits : layers.pits).push(
    instance(cell, shaft, [metrics.pitLayers, 0, 0, 0])
  );

  if (metrics.pitStyle === 'terraced') {
    addTerraces(layers, cell, metrics, depth);
  }

  return depth;
}

function addStair(layers, cell, metrics) {
  const depth = wellDepth(cell, metrics);
  const { steps, walls } = layoutSteps(cell, metrics);

  layers.wells.push(
    instance(cell, makeMatrix(grow(cell.rect, WALL_OVERLAP), 0, depth))
  );

  steps.forEach((step) => {
    const matrix = makeMatrix(step.rect, step.bottom, step.top - step.bottom);

    layers.steps.push(instance(cell, matrix, [step.index, cell.steps, 0, 0]));
  });

  walls.forEach((wall) => {
    const matrix = makeMatrix(wall.rect, wall.bottom, -wall.bottom);

    layers.taperWalls.push(instance(cell, matrix));
  });

  return depth;
}

function towerHeight(cell, metrics, radius) {
  const cx = cell.footprint.x + cell.footprint.w / 2;
  const cy = cell.footprint.y + cell.footprint.h / 2;
  const radial = Math.min(Math.hypot(cx, cy) / radius, 1);
  const bias = Math.max(
    1 + metrics.towerCenterBias * (1 - 2 * radial),
    MIN_TOWER_SCALE
  );
  const pixels =
    metrics.towerMinHeight +
    cell.heightRoll ** metrics.towerHeightCurve * metrics.towerHeightRange;

  return pixels * bias * PIXEL_RISE * metrics.towerHeightScale;
}

function addTower(layers, cell, metrics, radius) {
  const rect = atLeast(cell.rect, metrics.minTowerFootprint);
  const height = towerHeight(cell, metrics, radius);

  layers.towers.push(instance(cell, makeMatrix(rect, 0, height)));

  return 0;
}

const BUILDERS = {
  pit: addPit,
  plaza: addPlaza,
  stair: addStair,
  tower: addTower,
};

export function isOpening(cell) {
  return cell.role === 'pit' || cell.role === 'stair';
}

export default function buildLayers({ cells, metrics, radius }) {
  const layers = Object.fromEntries(LAYER_KEYS.map((key) => [key, []]));
  let deepest = 0;

  cells.forEach((cell) => {
    const depth = BUILDERS[cell.role]?.(layers, cell, metrics, radius) ?? 0;

    deepest = Math.max(deepest, depth);
  });

  return { deepest, layers };
}
