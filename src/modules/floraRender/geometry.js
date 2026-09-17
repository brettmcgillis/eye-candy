/* eslint-disable no-param-reassign */
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import * as THREE from 'three/webgpu';

import { DICE, SOLID_SHAPES } from '@modules/flora';

const TUBE_SIDES = 6;
const MIN_CAPACITY = 256;
const UNBORN = 2;

function tubeTemplate() {
  const positions = [];
  const index = [];

  for (let ring = 0; ring < 2; ring += 1) {
    for (let side = 0; side < TUBE_SIDES; side += 1) {
      positions.push(ring, side / TUBE_SIDES, 0);
    }
  }

  for (let side = 0; side < TUBE_SIDES; side += 1) {
    const next = (side + 1) % TUBE_SIDES;
    const c = TUBE_SIDES + side;
    const d = TUBE_SIDES + next;

    index.push(side, next, c, next, d, c);
  }

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setIndex(index);

  return geometry;
}

function solidTemplate(shape) {
  if (shape === 'sphere') {
    return new THREE.IcosahedronGeometry(1, 2);
  }

  return new ConvexGeometry(
    DICE[shape].vertices.map((v) => new THREE.Vector3(...v))
  );
}

export const TUBE_FIELD = {
  attributes: {
    aEnd: 'end',
    aFrameEnd: 'frameEnd',
    aFrameStart: 'frameStart',
    aStart: 'start',
    aTime: 'time',
    aTone: 'tone',
  },
  template: tubeTemplate,
  unborn: [['aTime', 0, UNBORN]],
};

export const SOLID_FIELDS = Object.fromEntries(
  SOLID_SHAPES.map((shape) => [
    shape,
    {
      attributes: { sInfo: 'info', sPos: 'position' },
      template: () => solidTemplate(shape),
      unborn: [['sInfo', 0, UNBORN]],
    },
  ])
);

export const CARD_FIELD = {
  attributes: { cDir: 'dir', cInfo: 'info', cPos: 'position' },
  template: () => new THREE.PlaneGeometry(2, 2, 6, 6),
  unborn: [
    ['cDir', 1, 1],
    ['cDir', 3, UNBORN],
  ],
};

export function capacityFor(count) {
  let capacity = MIN_CAPACITY;

  while (capacity < count + 1) {
    capacity *= 2;
  }

  return capacity;
}

// The last drawn instance is never born, so every pipeline (colour and shadow)
// compiles when the scene mounts instead of the first time a shape shows up.
export function writeField(geometry, field, buffers) {
  const count = buffers?.count ?? 0;

  Object.entries(field.attributes).forEach(([name, key]) => {
    const attribute = geometry.getAttribute(name);

    if (count) {
      attribute.array.set(buffers[key].subarray(0, count * 4));
    }

    attribute.array.fill(0, count * 4, (count + 1) * 4);
  });

  field.unborn.forEach(([name, component, value]) => {
    geometry.getAttribute(name).array[count * 4 + component] = value;
  });

  Object.keys(field.attributes).forEach((name) => {
    const attribute = geometry.getAttribute(name);

    attribute.clearUpdateRanges();
    attribute.addUpdateRange(0, (count + 1) * 4);
    attribute.needsUpdate = true;
  });

  geometry.instanceCount = count + 1;
}

export function allocateField(field, capacity) {
  const template = field.template();
  const geometry = new THREE.InstancedBufferGeometry();

  ['position', 'normal'].forEach((name) => {
    if (template.getAttribute(name)) {
      geometry.setAttribute(name, template.getAttribute(name));
    }
  });

  if (template.index) {
    geometry.setIndex(template.index);
  }

  Object.keys(field.attributes).forEach((name) => {
    geometry.setAttribute(
      name,
      new THREE.InstancedBufferAttribute(new Float32Array(capacity * 4), 4)
    );
  });

  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Infinity);
  geometry.userData.capacity = capacity;
  writeField(geometry, field, null);

  return geometry;
}
