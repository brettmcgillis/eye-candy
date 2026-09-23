/* eslint-disable no-param-reassign */
import * as THREE from 'three/webgpu';

const TUBE_SIDES = 6;
const MIN_CAPACITY = 1024;
const UNBORN = 9;

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

    index.push(
      side,
      next,
      TUBE_SIDES + side,
      next,
      TUBE_SIDES + next,
      TUBE_SIDES + side
    );
  }

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setIndex(index);

  return geometry;
}

export const TUBE_FIELD = {
  attributes: {
    aEnd: 'end',
    aFrameEnd: 'frameEnd',
    aFrameStart: 'frameStart',
    aMeta: 'meta',
    aStart: 'start',
    aTime: 'time',
    aTone: 'tone',
  },
  template: tubeTemplate,
  unborn: ['aTime', 0],
};

export const BEAD_FIELD = {
  attributes: { bExtra: 'extra', bInfo: 'info', bPos: 'position' },
  template: () => new THREE.IcosahedronGeometry(1, 2),
  unborn: ['bInfo', 0],
};

function capacityFor(count) {
  let capacity = MIN_CAPACITY;

  while (capacity < count + 1) capacity *= 2;

  return capacity;
}

// The last drawn instance is never born, so both pipelines (colour and
// shadow) compile at mount rather than when the first specimen lands.
function write(geometry, field, buffers) {
  const count = buffers?.count ?? 0;

  Object.entries(field.attributes).forEach(([name, key]) => {
    const attribute = geometry.getAttribute(name);

    if (count) attribute.array.set(buffers[key].subarray(0, count * 4));
    attribute.array.fill(0, count * 4, (count + 1) * 4);
    attribute.clearUpdateRanges();
    attribute.addUpdateRange(0, (count + 1) * 4);
    attribute.needsUpdate = true;
  });
  const [name, component] = field.unborn;

  geometry.getAttribute(name).array[count * 4 + component] = UNBORN;
  geometry.instanceCount = count + 1;
}

function allocate(field, capacity) {
  const template = field.template();
  const geometry = new THREE.InstancedBufferGeometry();

  ['position', 'normal'].forEach((name) => {
    if (template.getAttribute(name))
      geometry.setAttribute(name, template.getAttribute(name));
  });
  if (template.index) geometry.setIndex(template.index);
  Object.keys(field.attributes).forEach((name) => {
    geometry.setAttribute(
      name,
      new THREE.InstancedBufferAttribute(new Float32Array(capacity * 4), 4)
    );
  });
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Infinity);
  geometry.userData.capacity = capacity;
  write(geometry, field, null);

  return geometry;
}

// A persistent instanced geometry a specimen is written into; it only
// reallocates when a specimen outgrows it.
export function createSlot(field) {
  const slot = { geometry: allocate(field, capacityFor(0)), mesh: null };

  slot.load = (buffers) => {
    if (capacityFor(buffers?.count ?? 0) > slot.geometry.userData.capacity) {
      const previous = slot.geometry;

      slot.geometry = allocate(field, capacityFor(buffers.count));
      if (slot.mesh) slot.mesh.geometry = slot.geometry;
      previous.dispose();
    }
    write(slot.geometry, field, buffers);
  };
  slot.dispose = () => slot.geometry.dispose();

  return slot;
}

const SURFACE_KEYS = {
  sMeta: 'meta',
  sNormal: 'normal',
  sPosition: 'position',
};

function allocateSurface(vertices, indices) {
  const geometry = new THREE.BufferGeometry();

  Object.keys(SURFACE_KEYS).forEach((name) => {
    geometry.setAttribute(
      name,
      new THREE.BufferAttribute(new Float32Array(Math.max(vertices, 3) * 4), 4)
    );
  });
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(Math.max(vertices, 3) * 3), 3)
  );
  geometry.setIndex(
    new THREE.BufferAttribute(new Uint32Array(Math.max(indices, 3)), 1)
  );
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Infinity);
  geometry.userData.vertices = Math.max(vertices, 3);
  geometry.userData.indices = Math.max(indices, 3);
  geometry.setDrawRange(0, 0);

  return geometry;
}

// The specimen's solid surfaces (the extruded reaction field). Like the
// instanced slots it is persistent and only reallocates when outgrown; an
// empty specimen draws nothing.
export function createSurfaceSlot() {
  const slot = { geometry: allocateSurface(1024, 3072), mesh: null };

  slot.load = (mesh) => {
    const count = mesh?.count ?? 0;
    const indexCount = mesh?.indexCount ?? 0;
    let { geometry } = slot;

    if (
      count > geometry.userData.vertices ||
      indexCount > geometry.userData.indices
    ) {
      const previous = geometry;

      geometry = allocateSurface(
        Math.ceil(count * 1.25),
        Math.ceil(indexCount * 1.25)
      );
      slot.geometry = geometry;
      if (slot.mesh) slot.mesh.geometry = geometry;
      previous.dispose();
    }
    Object.entries(SURFACE_KEYS).forEach(([name, key]) => {
      const attribute = geometry.getAttribute(name);

      if (count) attribute.array.set(mesh[key].subarray(0, count * 4));
      attribute.clearUpdateRanges();
      attribute.addUpdateRange(0, Math.max(count, 1) * 4);
      attribute.needsUpdate = true;
    });
    const index = geometry.getIndex();

    if (indexCount) index.array.set(mesh.index.subarray(0, indexCount));
    index.clearUpdateRanges();
    index.addUpdateRange(0, Math.max(indexCount, 1));
    index.needsUpdate = true;
    geometry.setDrawRange(0, indexCount);
  };
  slot.dispose = () => slot.geometry.dispose();

  return slot;
}
