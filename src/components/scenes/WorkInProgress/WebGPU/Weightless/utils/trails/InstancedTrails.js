/* eslint-disable no-underscore-dangle, no-param-reassign */
import * as THREE from 'three/webgpu';

// Ring-buffer trail renderer, ported from three-sketches
// common/objects/InstancedTrails.js (MIT). Differences from the original:
// - three r182: BufferAttribute.updateRange is gone — dirty segments are
//   tracked per frame and flushed once via addUpdateRange (flush()).
// - creationSec (float seconds) replaces creationMs (uint) — friendlier to
//   TSL and float attribute plumbing.
// - Optional per-vertex skin indices/weights so the material can re-skin
//   trail vertices against live bone matrices (ride-surface mode).
//
// One global ring of trailCount * segmentsPerTrail line segments shared by
// all trails; pushPoint(i, p) links to trail i's previous segment unless
// breakTrail is set.

const DEAD_SEC = -1e9;
const _vec = new THREE.Vector3();

export default class InstancedTrails extends THREE.LineSegments {
  constructor(trailCount, segmentsPerTrail, material) {
    const totalSegments = trailCount * segmentsPerTrail;
    const geometry = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(
      new Float32Array(totalSegments * 2 * 3),
      3
    );
    const creationAttr = new THREE.BufferAttribute(
      new Float32Array(totalSegments * 2).fill(DEAD_SEC),
      1
    );
    const skinIndexAttr = new THREE.BufferAttribute(
      new Float32Array(totalSegments * 2 * 4),
      4
    );
    const skinWeightAttr = new THREE.BufferAttribute(
      new Float32Array(totalSegments * 2 * 4),
      4
    );
    posAttr.setUsage(THREE.DynamicDrawUsage);
    creationAttr.setUsage(THREE.DynamicDrawUsage);
    skinIndexAttr.setUsage(THREE.DynamicDrawUsage);
    skinWeightAttr.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('position', posAttr);
    geometry.setAttribute('creationSec', creationAttr);
    geometry.setAttribute('tSkinIndex', skinIndexAttr);
    geometry.setAttribute('tSkinWeight', skinWeightAttr);

    super(geometry, material);

    this.frustumCulled = false;
    this.totalSegments = totalSegments;
    this.previousSegments = new Uint32Array(trailCount);
    this.nextSegment = 0;
    // Per-frame dirty window (segment indices), flushed by flush().
    this.dirtyMin = Infinity;
    this.dirtyMax = -Infinity;
    this.dirtyWrapped = false;
  }

  _writeVertex(segment, isStart, point, sec, skin) {
    const { position, creationSec, tSkinIndex, tSkinWeight } =
      this.geometry.attributes;
    const offset = segment * 2 + (isStart ? 0 : 1);
    position.setXYZ(offset, point.x, point.y, point.z);
    creationSec.setX(offset, sec);
    if (skin) {
      tSkinIndex.setXYZW(
        offset,
        skin.si[0],
        skin.si[1],
        skin.si[2],
        skin.si[3]
      );
      tSkinWeight.setXYZW(
        offset,
        skin.sw[0],
        skin.sw[1],
        skin.sw[2],
        skin.sw[3]
      );
    }
  }

  _copyVertex(fromSegment, fromStart, toSegment, toStart) {
    const { position, creationSec, tSkinIndex, tSkinWeight } =
      this.geometry.attributes;
    const from = fromSegment * 2 + (fromStart ? 0 : 1);
    const to = toSegment * 2 + (toStart ? 0 : 1);
    _vec.fromBufferAttribute(position, from);
    position.setXYZ(to, _vec.x, _vec.y, _vec.z);
    creationSec.setX(to, creationSec.getX(from));
    tSkinIndex.setXYZW(
      to,
      tSkinIndex.getX(from),
      tSkinIndex.getY(from),
      tSkinIndex.getZ(from),
      tSkinIndex.getW(from)
    );
    tSkinWeight.setXYZW(
      to,
      tSkinWeight.getX(from),
      tSkinWeight.getY(from),
      tSkinWeight.getZ(from),
      tSkinWeight.getW(from)
    );
  }

  init(index, point, sec, skin) {
    const seg = this.nextSegment;
    this.previousSegments[index] = seg;
    this._writeVertex(seg, true, point, sec, skin);
    this._writeVertex(seg, false, point, sec, skin);
    this._markDirty(seg);
    this._increment();
  }

  pushPoint(index, point, sec, skin, breakTrail = false) {
    const seg = this.nextSegment;

    if (breakTrail) {
      this._writeVertex(seg, true, point, sec, skin);
    } else {
      this._copyVertex(this.previousSegments[index], false, seg, true);
    }
    this._writeVertex(seg, false, point, sec, skin);

    this.previousSegments[index] = seg;
    this._markDirty(seg);
    this._increment();
  }

  _markDirty(segment) {
    this.dirtyMin = Math.min(this.dirtyMin, segment);
    this.dirtyMax = Math.max(this.dirtyMax, segment);
  }

  _increment() {
    this.nextSegment += 1;
    if (this.nextSegment >= this.totalSegments) {
      this.nextSegment = 0;
      this.dirtyWrapped = true;
    }
  }

  // Upload this frame's writes. Call once per frame after stepping.
  flush() {
    if (this.dirtyMin === Infinity) return;

    const attrs = [
      [this.geometry.attributes.position, 3],
      [this.geometry.attributes.creationSec, 1],
      [this.geometry.attributes.tSkinIndex, 4],
      [this.geometry.attributes.tSkinWeight, 4],
    ];

    attrs.forEach(([attr, itemSize]) => {
      attr.clearUpdateRanges();
      if (this.dirtyWrapped) {
        // Wrapped the ring this frame — upload everything once.
        attr.addUpdateRange(0, this.totalSegments * 2 * itemSize);
      } else {
        const start = this.dirtyMin * 2 * itemSize;
        const count = (this.dirtyMax - this.dirtyMin + 1) * 2 * itemSize;
        attr.addUpdateRange(start, count);
      }
      attr.needsUpdate = true;
    });

    this.dirtyMin = Infinity;
    this.dirtyMax = -Infinity;
    this.dirtyWrapped = false;
  }

  // Wipe all trails (used when switching trail space so stale vertices in
  // the other coordinate space never render).
  reset() {
    this.geometry.attributes.creationSec.array.fill(DEAD_SEC);
    this.nextSegment = 0;
    this.previousSegments.fill(0);
    this.dirtyMin = 0;
    this.dirtyMax = this.totalSegments - 1;
    this.dirtyWrapped = true;
    this.flush();
  }

  dispose() {
    this.geometry.dispose();
  }
}
