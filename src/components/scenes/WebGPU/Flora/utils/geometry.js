import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import * as THREE from 'three/webgpu';

import { DICE } from '@modules/flora';

const TUBE_SIDES = 6;

function attachInstances(geometry, attributes, count) {
  Object.entries(attributes).forEach(([name, array]) => {
    geometry.setAttribute(name, new THREE.InstancedBufferAttribute(array, 4));
  });
  geometry.instanceCount = count; // eslint-disable-line no-param-reassign
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Infinity); // eslint-disable-line no-param-reassign

  return geometry;
}

function fromTemplate(template) {
  const geometry = new THREE.InstancedBufferGeometry();

  geometry.setAttribute('position', template.getAttribute('position'));

  if (template.getAttribute('normal')) {
    geometry.setAttribute('normal', template.getAttribute('normal'));
  }

  if (template.index) {
    geometry.setIndex(template.index);
  }

  return geometry;
}

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
    const a = side;
    const b = next;
    const c = TUBE_SIDES + side;
    const d = TUBE_SIDES + next;

    index.push(a, b, c, b, d, c);
  }

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setIndex(index);

  return geometry;
}

export function createTubeGeometry(segments) {
  return attachInstances(
    fromTemplate(tubeTemplate()),
    {
      aEnd: segments.end,
      aFrameEnd: segments.frameEnd,
      aFrameStart: segments.frameStart,
      aStart: segments.start,
      aTime: segments.time,
      aTone: segments.tone,
    },
    segments.count
  );
}

function solidTemplate(shape) {
  if (shape === 'sphere') {
    return new THREE.IcosahedronGeometry(1, 2);
  }

  return new ConvexGeometry(
    DICE[shape].vertices.map((v) => new THREE.Vector3(...v))
  );
}

export function createSolidGeometry(group) {
  return attachInstances(
    fromTemplate(solidTemplate(group.shape)),
    { sInfo: group.info, sPos: group.position },
    group.count
  );
}

export function createCardGeometry(cards) {
  return attachInstances(
    fromTemplate(new THREE.PlaneGeometry(2, 2, 6, 6)),
    { cDir: cards.dir, cInfo: cards.info, cPos: cards.position },
    cards.count
  );
}
