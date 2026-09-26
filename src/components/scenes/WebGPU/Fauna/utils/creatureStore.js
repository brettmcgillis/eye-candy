/* eslint-disable no-param-reassign */
import * as THREE from 'three/webgpu';

import { BEAD_BLOCK, GENE_ROWS, PLAN_CODES, VOXEL_BLOCK } from '@modules/fauna';

const HIDDEN = -1;

function dataTexture(width, height) {
  const texture = new THREE.DataTexture(
    new Float32Array(width * height * 4),
    width,
    height,
    THREE.RGBAFormat,
    THREE.FloatType
  );

  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.needsUpdate = true;

  return texture;
}

function blockGeometry(template, capacity, block, names) {
  const geometry = new THREE.InstancedBufferGeometry();

  geometry.setAttribute('position', template.getAttribute('position'));
  geometry.setAttribute('normal', template.getAttribute('normal'));
  geometry.setIndex(template.index);
  names.forEach((name) => {
    const array = new Float32Array(capacity * block * 4);

    for (let i = 0; i < array.length; i += 4) {
      array[i] = HIDDEN;
    }

    const attribute = new THREE.InstancedBufferAttribute(array, 4);

    attribute.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute(name, attribute);
  });
  geometry.instanceCount = 0;
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Infinity);
  template.dispose();

  return geometry;
}

function writeBlock(geometry, name, slot, block, source, count) {
  const attribute = geometry.getAttribute(name);
  const start = slot * block * 4;

  attribute.array.fill(0, start, start + block * 4);

  if (source) {
    attribute.array.set(source.subarray(0, count * 4), start);
  }

  for (let i = count; i < block; i += 1) {
    attribute.array[start + i * 4] = HIDDEN;
  }

  attribute.addUpdateRange(start, block * 4);
  attribute.needsUpdate = true;
}

function skinGeometry(skin, slot) {
  const geometry = new THREE.BufferGeometry();
  const vertexCount = skin.positions.length / 3;

  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(skin.positions, 3)
  );
  geometry.setAttribute('normal', new THREE.BufferAttribute(skin.normals, 3));
  geometry.setAttribute('aFrame', new THREE.BufferAttribute(skin.frame, 1));
  geometry.setAttribute(
    'aSlot',
    new THREE.BufferAttribute(new Float32Array(vertexCount).fill(slot), 1)
  );

  if (skin.boneA) {
    geometry.setAttribute('aBoneA', new THREE.BufferAttribute(skin.boneA, 4));
    geometry.setAttribute('aBoneB', new THREE.BufferAttribute(skin.boneB, 4));
    geometry.setAttribute('aLocalA', new THREE.BufferAttribute(skin.localA, 3));
    geometry.setAttribute('aLocalB', new THREE.BufferAttribute(skin.localB, 3));
  }

  geometry.setIndex(new THREE.BufferAttribute(skin.index, 1));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Infinity);

  return geometry;
}

export default function createCreatureStore(capacity) {
  const pose = dataTexture(capacity, 1);
  const motion = dataTexture(capacity, 1);
  const genes = dataTexture(capacity, GENE_ROWS);
  const voxels = blockGeometry(
    new THREE.BoxGeometry(1, 1, 1),
    capacity,
    VOXEL_BLOCK,
    ['vLocal', 'vInfo']
  );
  const beads = blockGeometry(
    new THREE.IcosahedronGeometry(1, 1),
    capacity,
    BEAD_BLOCK,
    ['bInfo']
  );
  const skins = new THREE.Group();
  const meshes = new Array(capacity).fill(null);
  const occupied = new Uint8Array(capacity);
  const materials = {};
  let highest = -1;
  let skinMode = 'auto';

  const showSkin = (mesh, slot) => {
    const plan = genes.image.data[(2 * capacity + slot) * 4];
    const wantsSmooth = genes.image.data[(capacity + slot) * 4 + 3] > 0.5;

    mesh.visible =
      plan === PLAN_CODES.blob ||
      skinMode === 'smooth' ||
      (skinMode === 'auto' && wantsSmooth);
  };

  const refreshCounts = () => {
    while (highest >= 0 && !occupied[highest]) highest -= 1;

    voxels.instanceCount = (highest + 1) * VOXEL_BLOCK;
    beads.instanceCount = (highest + 1) * BEAD_BLOCK;
  };

  const removeSkin = (slot) => {
    const mesh = meshes[slot];

    if (!mesh) return;

    skins.remove(mesh);
    mesh.geometry.dispose();
    meshes[slot] = null;
  };

  const store = {
    beads,
    capacity,
    genes,
    motion,
    occupied,
    pose,
    skins,
    voxels,
    add(slot, body) {
      removeSkin(slot);
      occupied[slot] = 1;
      highest = Math.max(highest, slot);

      for (let row = 0; row < GENE_ROWS; row += 1) {
        genes.image.data.set(
          body.genes.subarray(row * 4, row * 4 + 4),
          (row * capacity + slot) * 4
        );
      }

      genes.needsUpdate = true;
      writeBlock(
        voxels,
        'vLocal',
        slot,
        VOXEL_BLOCK,
        body.voxels.local,
        body.voxels.count
      );
      writeBlock(
        voxels,
        'vInfo',
        slot,
        VOXEL_BLOCK,
        body.voxels.info,
        body.voxels.count
      );
      writeBlock(
        beads,
        'bInfo',
        slot,
        BEAD_BLOCK,
        body.beads.info,
        body.beads.count
      );

      if (body.skin) {
        const material =
          body.plan === 'blob' ? materials.blob : materials.invader;
        const mesh = new THREE.Mesh(skinGeometry(body.skin, slot), material);

        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.frustumCulled = false;
        meshes[slot] = mesh;
        showSkin(mesh, slot);
        skins.add(mesh);
      }

      refreshCounts();
    },
    clear() {
      for (let slot = 0; slot < capacity; slot += 1) {
        if (occupied[slot]) store.remove(slot);
      }
    },
    remove(slot) {
      occupied[slot] = 0;
      removeSkin(slot);
      writeBlock(voxels, 'vInfo', slot, VOXEL_BLOCK, null, 0);
      writeBlock(beads, 'bInfo', slot, BEAD_BLOCK, null, 0);
      motion.image.data[slot * 4] = 0;
      motion.needsUpdate = true;
      refreshCounts();
    },
    setSkinMode(mode) {
      skinMode = mode;
      meshes.forEach((mesh, slot) => mesh && showSkin(mesh, slot));
    },
    setMaterials(next) {
      Object.assign(materials, next);
      meshes.forEach((mesh, slot) => {
        if (mesh) {
          mesh.material =
            genes.image.data[(2 * capacity + slot) * 4] === PLAN_CODES.blob
              ? next.blob
              : next.invader;
        }
      });
    },
    dispose() {
      store.clear();
      [pose, motion, genes].forEach((t) => t.dispose());
      voxels.dispose();
      beads.dispose();
    },
  };

  return store;
}
