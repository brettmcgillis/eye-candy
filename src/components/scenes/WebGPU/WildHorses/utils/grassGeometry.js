import * as THREE from 'three/webgpu';

const RAD = Math.PI / 180;
const CROSS_ANGLES = [0, 120 * RAD, 240 * RAD];

function rotateY([x, y, z], angle) {
  const s = Math.sin(angle);
  const c = Math.cos(angle);

  return [x * c + z * s, y, -x * s + z * c];
}

// wolf2 builds one clump from three quads at 0/120/240 degrees so a billboard
// reads from any orbit angle, then instances that clump across the field.
function buildClump(halfWidth, height) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  CROSS_ANGLES.forEach((angle, quad) => {
    const corners = [
      [-halfWidth, 0, 0],
      [halfWidth, 0, 0],
      [halfWidth, height, 0],
      [-halfWidth, height, 0],
    ];

    corners.forEach((corner) => positions.push(...rotateY(corner, angle)));
    for (let i = 0; i < 4; i += 1) normals.push(...rotateY([0, 0, 1], angle));
    uvs.push(0, 0, 1, 0, 1, 1, 0, 1);

    const base = quad * 4;
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  });

  return { indices, normals, positions, uvs };
}

function tooClose(placed, x, z, minSq) {
  return placed.some(([px, pz]) => {
    const dx = px - x;
    const dz = pz - z;

    return dx * dx + dz * dz < minSq;
  });
}

// Poisson-ish rejection: retry a candidate up to `attempts` times while it
// lands closer than minDistance to an accepted blade, then accept regardless.
function scatter({ attempts, count, minDistance, random, range }) {
  const placed = [];
  const minSq = minDistance * minDistance;

  for (let i = 0; i < count; i += 1) {
    let x = 0;
    let z = 0;
    let tries = 0;

    do {
      x = (random() * 2 - 1) * range;
      z = (random() * 2 - 1) * range;
      tries += 1;
    } while (tries < attempts && tooClose(placed, x, z, minSq));

    placed.push([x, z]);
  }

  return placed;
}

export default function createGrassGeometry({
  bladeHeight,
  bladeWidth,
  count,
  heightJitter,
  minDistance,
  random = Math.random,
  range,
}) {
  const clump = buildClump(bladeWidth * 0.5, bladeHeight);
  const geometry = new THREE.InstancedBufferGeometry();

  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(clump.positions, 3)
  );
  geometry.setAttribute(
    'normal',
    new THREE.Float32BufferAttribute(clump.normals, 3)
  );
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(clump.uvs, 2));
  geometry.setIndex(clump.indices);

  const placed = scatter({
    attempts: 100,
    count,
    minDistance,
    random,
    range,
  });

  const offsets = new Float32Array(count * 3);
  const extras = new Float32Array(count * 2);

  placed.forEach(([x, z], i) => {
    offsets[i * 3 + 0] = x;
    offsets[i * 3 + 1] = 1 + (random() * 2 - 1) * heightJitter;
    offsets[i * 3 + 2] = z;

    extras[i * 2 + 0] = random();
    extras[i * 2 + 1] = random() * Math.PI * 2;
  });

  geometry.setAttribute(
    'posOffset',
    new THREE.InstancedBufferAttribute(offsets, 3)
  );
  geometry.setAttribute('extra', new THREE.InstancedBufferAttribute(extras, 2));
  geometry.instanceCount = count;
  geometry.boundingSphere = new THREE.Sphere(
    new THREE.Vector3(),
    range * 2 + bladeHeight * 2
  );

  return geometry;
}
