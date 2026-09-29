import * as THREE from 'three/webgpu';

import { hashSeed } from '@modules/flora';

import entryGeometry from './entry';
import { MM } from './prism';

const nextCapacity = (n) => 2 ** Math.ceil(Math.log2(Math.max(16, n)));
const hash01 = (id) => (hashSeed(id) % 100003) / 100003;

// Every leaf of a panel as an instance of its baked entry, tracked by
// where it is. A leaf whose cell changes keeps its place: the old cell eases
// out through the paper while the new one eases in.
export default function createCellLayer(group, materials) {
  const layers = new Map();
  let entries = new Map();
  let records = new Map();
  let leaving = [];
  let geometryKey = '';
  let config = null;
  let origin = [0, 0];
  let dirty = true;

  const dropLayer = (key) => {
    const layer = layers.get(key);
    group.remove(layer.wood, layer.paper);
    layer.wood.geometry.dispose();
    layer.paper.geometry.dispose();
    layers.delete(key);
  };

  function layerFor(key, needed) {
    const existing = layers.get(key);
    if (existing && existing.capacity >= needed) return existing;
    if (existing) dropLayer(key);
    const capacity = nextCapacity(needed);
    const { paper, wood } = entryGeometry(entries.get(key), config);
    const data = new THREE.InstancedBufferAttribute(
      new Float32Array(capacity * 4),
      4
    );
    const source = new THREE.InstancedBufferAttribute(
      new Float32Array(capacity * 3),
      3
    );
    const matrices = new THREE.StorageInstancedBufferAttribute(
      new Float32Array(capacity * 16),
      16
    );
    const make = (geometry, material) => {
      geometry.setAttribute('cellData', data);
      geometry.setAttribute('cellSource', source);
      const mesh = new THREE.InstancedMesh(geometry, material, capacity);
      Object.assign(mesh, {
        castShadow: material === materials.wood,
        frustumCulled: false,
        instanceMatrix: matrices,
        receiveShadow: true,
      });
      group.add(mesh);
      return mesh;
    };
    const layer = {
      capacity,
      data,
      matrices,
      paper: make(paper, materials.paper),
      source,
      wood: make(wood, materials.wood),
    };
    layers.set(key, layer);
    return layer;
  }

  function write() {
    const byEntry = new Map();
    [...records.values(), ...leaving].forEach((rec) => {
      if (!entries.has(rec.entry)) return;
      if (!byEntry.has(rec.entry)) byEntry.set(rec.entry, []);
      byEntry.get(rec.entry).push(rec);
    });
    [...layers.keys()]
      .filter((key) => !byEntry.has(key))
      .forEach((key) => {
        const layer = layers.get(key);
        layer.wood.visible = false;
        layer.paper.visible = false;
      });
    byEntry.forEach((recs, key) => {
      const layer = layerFor(key, recs.length);
      const m = layer.matrices.array;
      recs.forEach((rec, i) => {
        const cos = Math.cos(-rec.angle);
        const sin = Math.sin(-rec.angle);
        m.set(
          [
            cos,
            sin,
            0,
            0,
            -sin,
            cos,
            0,
            0,
            0,
            0,
            1,
            0,
            (rec.x - origin[0]) * MM,
            (origin[1] - rec.y) * MM,
            0,
            1,
          ],
          i * 16
        );
        layer.data.array.set([rec.tone, rec.random, rec.fade, rec.luma], i * 4);
        layer.source.array.set(rec.rgb ?? [1, 1, 1], i * 3);
      });
      layer.matrices.needsUpdate = true;
      layer.data.needsUpdate = true;
      layer.source.needsUpdate = true;
      [layer.wood, layer.paper].forEach((mesh) => {
        Object.assign(mesh, { count: recs.length, visible: true });
      });
    });
    dirty = false;
  }

  return {
    // `immediate` places every cell at once; otherwise changes ease.
    setLeaves(result, nextConfig, { geometry, immediate = false } = {}) {
      config = nextConfig;
      origin = [result.width / 2, result.height / 2];
      result.entries.forEach((entry, key) => entries.set(key, entry));
      if (geometry !== geometryKey) {
        [...layers.keys()].forEach(dropLayer);
        geometryKey = geometry;
      }
      const next = new Map();
      result.leaves.forEach((leaf) => {
        const prev = records.get(leaf.id);
        const same = prev && prev.entry === leaf.entry;
        if (prev && !same) leaving.push({ ...prev, target: 0 });
        next.set(leaf.id, {
          ...leaf,
          fade: immediate || same ? (prev?.fade ?? 1) : 0,
          random: hash01(leaf.id),
          target: 1,
        });
        records.delete(leaf.id);
      });
      records.forEach((rec) => leaving.push({ ...rec, target: 0 }));
      records = next;
      if (immediate) {
        leaving = [];
        records.forEach((rec) => Object.assign(rec, { fade: 1 }));
      }
      const live = new Set(
        [...records.values(), ...leaving].map((r) => r.entry)
      );
      entries = new Map([...entries].filter(([key]) => live.has(key)));
      dirty = true;
    },

    tick(dt, ease) {
      const step = ease > 0 ? dt / ease : 1;
      let moving = false;
      const approach = (rec) => {
        if (rec.fade === rec.target) return;
        moving = true;
        Object.assign(rec, {
          fade:
            rec.target > rec.fade
              ? Math.min(rec.target, rec.fade + step)
              : Math.max(rec.target, rec.fade - step),
        });
      };
      records.forEach(approach);
      leaving.forEach(approach);
      leaving = leaving.filter((rec) => rec.fade > 0);
      if (moving || dirty) write();
    },

    dispose() {
      [...layers.keys()].forEach(dropLayer);
    },
  };
}
