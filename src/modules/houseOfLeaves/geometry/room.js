import * as THREE from 'three/webgpu';

import { archHeightAt, orientInward } from './geometryUtils';

export const ROOM_DEFAULTS = {
  depth: 9,
  width: 10,
  height: 8,
  doorWidth: 4.5,
  doorHeight: 7,
  doorArchRise: 2.25,
  doorColumns: 48,
};

// A closed box seen from the inside. The near wall carries an arched doorway
// built on the same profile as the corridor entrance, so the two openings are
// the same shape and size rather than merely similar.
export default function createRoom(options = {}) {
  const o = { ...ROOM_DEFAULTS, ...options };
  const hw = o.width * 0.5;
  const positions = [];
  const indices = [];

  const quad = (p0, p1, p2, p3) => {
    const base = positions.length / 3;
    [p0, p1, p2, p3].forEach((p) => positions.push(p[0], p[1], p[2]));
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };

  quad([0, 0, -hw], [o.depth, 0, -hw], [o.depth, 0, hw], [0, 0, hw]);
  quad(
    [0, o.height, -hw],
    [o.depth, o.height, -hw],
    [o.depth, o.height, hw],
    [0, o.height, hw]
  );
  quad(
    [0, 0, -hw],
    [0, o.height, -hw],
    [o.depth, o.height, -hw],
    [o.depth, 0, -hw]
  );
  quad(
    [0, 0, hw],
    [0, o.height, hw],
    [o.depth, o.height, hw],
    [o.depth, 0, hw]
  );
  quad(
    [o.depth, 0, -hw],
    [o.depth, o.height, -hw],
    [o.depth, o.height, hw],
    [o.depth, 0, hw]
  );

  const columns = Math.max(4, Math.round(o.doorColumns));
  const doorTop = (z) =>
    archHeightAt(z, {
      width: o.doorWidth,
      height: o.doorHeight,
      archRise: o.doorArchRise,
    });

  const nearBase = positions.length / 3;
  for (let i = 0; i <= columns; i += 1) {
    const z = -hw + (i / columns) * o.width;
    positions.push(0, Math.min(doorTop(z), o.height), z);
    positions.push(0, o.height, z);
  }
  for (let i = 0; i < columns; i += 1) {
    const a = nearBase + i * 2;
    indices.push(a, a + 1, a + 3, a, a + 3, a + 2);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setIndex(indices);
  return orientInward(
    geometry,
    new THREE.Vector3(o.depth * 0.5, o.height * 0.5, 0)
  );
}
