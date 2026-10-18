import * as THREE from 'three/webgpu';

import { SRGB_TO_LINEAR } from '@modules/isoMeterRender';

const MIN_CAPACITY = 3 * 1024;

function createBuffer(withColor) {
  let capacity = 0;
  let geometry = null;

  const allocate = (vertices) => {
    capacity = Math.max(MIN_CAPACITY, 2 ** Math.ceil(Math.log2(vertices)));
    geometry = new THREE.BufferGeometry();
    const position = new THREE.BufferAttribute(
      new Float32Array(capacity * 3),
      3
    );
    position.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('position', position);
    if (withColor) {
      const color = new THREE.BufferAttribute(
        new Float32Array(capacity * 3),
        3
      );
      color.setUsage(THREE.DynamicDrawUsage);
      geometry.setAttribute('color', color);
    }
  };

  const write = (positions2d, colors) => {
    const vertices = positions2d.length / 2;
    const replaced = !geometry || vertices > capacity;
    if (replaced) allocate(vertices);
    const position = geometry.getAttribute('position');
    const pos = position.array;
    for (let v = 0; v < vertices; v += 1) {
      pos[v * 3] = positions2d[v * 2];
      pos[v * 3 + 1] = positions2d[v * 2 + 1];
      pos[v * 3 + 2] = 0;
    }
    if (withColor) {
      const color = geometry.getAttribute('color');
      const col = color.array;
      for (let n = 0; n < vertices * 3; n += 1) {
        col[n] = SRGB_TO_LINEAR[colors[n]];
      }
      color.needsUpdate = true;
    }
    if (vertices === 0) pos.fill(0, 0, 9);
    position.needsUpdate = true;
    geometry.setDrawRange(0, Math.max(vertices, 3));
    return replaced;
  };

  return {
    get geometry() {
      return geometry;
    },
    write,
  };
}

export default function createLatticeGeometry() {
  const fill = createBuffer(true);
  const ink = createBuffer(false);
  return {
    geometries: () => ({ fill: fill.geometry, ink: ink.geometry }),
    write(data) {
      const fillReplaced = fill.write(data.fillPositions, data.fillColors);
      const inkReplaced = ink.write(data.inkPositions);
      return fillReplaced || inkReplaced;
    },
  };
}
