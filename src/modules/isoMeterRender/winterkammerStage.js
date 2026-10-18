/* eslint-disable no-param-reassign */
import * as THREE from 'three/webgpu';

import { createVoxelSet } from '@modules/isoMeter';

import { VIEW_AXIS, boxEdges } from './stage';
import { createChunkGroup, createChunkObjects } from './voxelChunks';

const SETTLE_BUDGET = 3000;
const CHUNK_CUBES = 1500;
const BACKGROUND_MARGIN = 200;

const isDone = (tile) => {
  if (tile.kind === 'sigil') return !tile.active;
  if (tile.kind === 'background') return true;
  return tile.built;
};

function placeTile(group, tile, depth) {
  const { i, j, k } = tile.center;
  group.scale.setScalar(tile.zoom);
  group.position
    .set(-i * tile.zoom, -j * tile.zoom, -k * tile.zoom)
    .addScaledVector(VIEW_AXIS, depth);
}

export default function createWinterkammerStage(piece, materials) {
  const stage = new THREE.Group();
  stage.matrixAutoUpdate = false;
  const count = piece.tiles.length;
  const slots = [...piece.tiles, piece.backgroundTile]
    .filter((tile) => tile.kind !== 'placeholder')
    .map((tile) => {
      const chunks = createChunkGroup();
      stage.add(chunks.group);
      return {
        chunks,
        lattice: null,
        read: 0,
        set: createVoxelSet(),
        settling: false,
        tile,
      };
    });
  const boxes = piece.tiles
    .filter((tile) => tile.kind === 'placeholder')
    .map((tile) => {
      const group = new THREE.Group();
      const { I, J, K } = tile.dims;
      createChunkObjects(
        { faces: 0, lines: new Float32Array(), outlines: boxEdges(I, J, K) },
        materials.tiles
      ).forEach((object) => group.add(object));
      stage.add(group);
      return { group, tile };
    });

  const backgroundPush = (stackDepth) => {
    const { dims, zoom } = piece.backgroundTile;
    const reach = ((dims.I + dims.J + dims.K) * zoom) / Math.sqrt(3);
    return reach + (count / 2) * stackDepth + BACKGROUND_MARGIN;
  };

  const layout = (stackDepth, aspect) => {
    slots.forEach(({ chunks, tile }) => {
      const n = piece.tiles.indexOf(tile);
      const depth =
        n < 0 ? -backgroundPush(stackDepth) : (n - count / 2) * stackDepth;
      placeTile(chunks.group, tile, depth);
      chunks.group.visible =
        tile.kind === 'background' || tile.visibleAt(aspect);
    });
    boxes.forEach(({ group, tile }) => {
      placeTile(
        group,
        tile,
        (piece.tiles.indexOf(tile) - count / 2) * stackDepth
      );
      group.visible = tile.visibleAt(aspect);
    });
  };

  const sync = () => {
    let budget = SETTLE_BUDGET;
    slots.forEach((slot) => {
      const { set, tile } = slot;
      const lattice = tile.lattice ?? null;
      const log = lattice?.cubeLog ?? [];
      if (lattice !== slot.lattice || log.length < slot.read) {
        set.clear();
        slot.chunks.clear();
        Object.assign(slot, { chunk: 0, lattice, read: 0, settling: false });
      }
      if (slot.read < log.length) {
        for (; slot.read < log.length; slot.read += 1) {
          set.add(log[slot.read], slot.chunk, { settled: false });
          if (slot.read % CHUNK_CUBES === CHUNK_CUBES - 1) slot.chunk += 1;
        }
        slot.chunk += 1;
      }
      if (isDone(tile) && !slot.settling && set.size) {
        slot.settling = true;
        set.markAll();
      }
      if (!set.dirtyCount || (slot.settling && budget <= 0)) return;
      const flushed = set.flush(tile.shade, slot.settling ? budget : Infinity);
      if (slot.settling) {
        flushed.forEach((data) => {
          budget -= Math.max(1, data.cubes);
        });
      }
      const ink =
        tile.kind === 'background' ? materials.background : materials.tiles;
      slot.chunks.apply(flushed, ink);
    });
  };

  const dispose = () => {
    slots.forEach(({ chunks }) => chunks.clear());
    boxes.forEach(({ group }) =>
      group.children.forEach((object) => object.geometry.dispose())
    );
  };

  const pending = () =>
    slots.some(
      ({ set, settling, tile }) =>
        set.dirtyCount > 0 || (isDone(tile) && !settling && set.size > 0)
    );

  return { dispose, layout, pending, stage, sync };
}
