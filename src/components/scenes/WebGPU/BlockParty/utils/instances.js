/* eslint-disable no-param-reassign */
import * as THREE from 'three/webgpu';

import { pickStairVariant } from './variants';

const NEON_SLOTS = {
  amber: '#ffcc00',
  cyan: '#00ffcc',
  magenta: '#ff0066',
};

const scratchMatrix = new THREE.Matrix4();
const scratchPosition = new THREE.Vector3();
const scratchQuaternion = new THREE.Quaternion();
const scratchScale = new THREE.Vector3();

function hash(cell) {
  const value = Math.sin(cell.rect.w * 41.17 + cell.rect.h * 289.3) * 21374.53;

  return value - Math.floor(value);
}

function centre(rect) {
  return [rect.x + rect.w / 2, rect.y + rect.h / 2];
}

function makeMatrix(rect, height, y) {
  const [cx, cz] = centre(rect);

  scratchPosition.set(cx, y, cz);
  scratchScale.set(rect.w, height, rect.h);

  return scratchMatrix
    .compose(scratchPosition, scratchQuaternion, scratchScale)
    .clone();
}

// A tower quad is small enough that the street inset can leave a 2px sliver.
// The reference strokes those as thin spikes; a solid that thin would alias
// away, so the footprint gets a floor while the placement stays exact.
function atLeast(rect, minimum) {
  const w = Math.max(rect.w, minimum);
  const h = Math.max(rect.h, minimum);

  return {
    h,
    w,
    x: rect.x - (w - rect.w) / 2,
    y: rect.y - (h - rect.h) / 2,
  };
}

function insetRect(rect, amount) {
  return {
    h: Math.max(rect.h - amount * 2, 0.001),
    w: Math.max(rect.w - amount * 2, 0.001),
    x: rect.x + amount,
    y: rect.y + amount,
  };
}

function place(target, rect, rise, cell) {
  target.push({
    matrix: makeMatrix(rect, rise, 0),
    reveal: cell.birth,
    seed: hash(cell),
    size: [rect.w, rect.h, rise],
  });
}

// Cards float on blank paper, the way the reference draws them — there is no
// plate, so the gaps between cells carry no material and each cell's own
// thickness is the grey band the reference gets from an offset fill.
export default function buildLayers({ cells, metrics, variants }) {
  const towers = variants.towers.map(() => []);
  const stairs = variants.stairs.map(() => []);
  const plazas = [];
  const darkCards = [];
  const glowCards = [];
  const neon = [];

  cells.forEach((cell) => {
    if (cell.role === 'tower') {
      const rect = atLeast(cell.rect, metrics.minTowerFootprint);
      const rise = cell.height * metrics.towerHeightScale;

      place(towers[cell.variant % towers.length], rect, rise, cell);
      return;
    }

    if (cell.role === 'plaza') {
      const rise = cell.rise * metrics.plazaRiseScale;

      place(plazas, cell.rect, rise, cell);

      if (cell.neon) {
        const pad = insetRect(cell.rect, cell.neon.inset);

        neon.push({
          matrix: makeMatrix(pad, metrics.neonThickness, rise),
          reveal: cell.birth,
          seed: hash(cell),
          size: [pad.w, pad.h, metrics.neonThickness],
          tint: NEON_SLOTS[cell.neon.slot],
        });
      }
      return;
    }

    if (cell.role === 'dark') {
      place(
        cell.glow ? glowCards : darkCards,
        cell.rect,
        metrics.darkCardRise,
        cell
      );
      return;
    }

    if (cell.role === 'stair') {
      const variant = pickStairVariant(variants.stairs, cell);

      if (variant >= 0) {
        place(
          stairs[variant],
          cell.rect,
          cell.rise * metrics.stairRiseScale,
          cell
        );
      }
    }
  });

  return { darkCards, glowCards, neon, plazas, stairs, towers };
}

export function createLayerBuffers(capacity, hasTint) {
  return {
    reveal: new THREE.InstancedBufferAttribute(new Float32Array(capacity), 1),
    seed: new THREE.InstancedBufferAttribute(new Float32Array(capacity), 1),
    size: new THREE.InstancedBufferAttribute(new Float32Array(capacity * 3), 3),
    tint: hasTint
      ? new THREE.InstancedBufferAttribute(new Float32Array(capacity * 3), 3)
      : null,
  };
}

export function attachLayerBuffers(geometry, buffers) {
  geometry.setAttribute('aReveal', buffers.reveal);
  geometry.setAttribute('aSeed', buffers.seed);
  geometry.setAttribute('aSize', buffers.size);

  if (buffers.tint) {
    geometry.setAttribute('aTint', buffers.tint);
  }
}

// The material's TSL nodes hold these attribute objects by reference, so the
// arrays are written in place — replacing an attribute would leave the shader
// reading the one it was built against.
export function writeLayer(mesh, buffers, instances) {
  const color = new THREE.Color();
  const count = Math.min(instances.length, buffers.reveal.count);

  for (let index = 0; index < count; index += 1) {
    const instance = instances[index];

    mesh.setMatrixAt(index, instance.matrix);
    buffers.reveal.array[index] = instance.reveal;
    buffers.seed.array[index] = instance.seed;
    buffers.size.array.set(instance.size, index * 3);

    if (buffers.tint) {
      color.set(instance.tint);
      buffers.tint.array[index * 3] = color.r;
      buffers.tint.array[index * 3 + 1] = color.g;
      buffers.tint.array[index * 3 + 2] = color.b;
    }
  }

  mesh.count = count;
  mesh.instanceMatrix.needsUpdate = true;
  buffers.reveal.needsUpdate = true;
  buffers.seed.needsUpdate = true;
  buffers.size.needsUpdate = true;

  if (buffers.tint) {
    buffers.tint.needsUpdate = true;
  }
}
