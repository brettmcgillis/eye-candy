/* eslint-disable no-underscore-dangle, no-param-reassign */
import * as THREE from 'three/webgpu';

const DEAD_SEC = -1e9;
const _vec = new THREE.Vector3();

// Ring-buffer trail renderer for field lines: one global ring of
// walkerCount * segmentsPerTrail line segments; pushPoint(i, p) links to
// walker i's previous segment unless breakTrail is set. Trimmed from the
// same pattern as Weightless's InstancedTrails (docs/scene-conventions.md
// §6 — no cross-scene imports, so this is a local, simpler copy) — no
// skinning, since field lines advect through free space rather than riding
// a skinned surface.
export default class FieldLineTrails extends THREE.LineSegments {
  constructor(walkerCount, segmentsPerTrail, material) {
    const totalSegments = walkerCount * segmentsPerTrail;
    const geometry = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(
      new Float32Array(totalSegments * 2 * 3),
      3
    );
    const creationAttr = new THREE.BufferAttribute(
      new Float32Array(totalSegments * 2).fill(DEAD_SEC),
      1
    );
    posAttr.setUsage(THREE.DynamicDrawUsage);
    creationAttr.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('position', posAttr);
    geometry.setAttribute('creationSec', creationAttr);

    super(geometry, material);

    this.frustumCulled = false;
    this.totalSegments = totalSegments;
    this.previousSegments = new Uint32Array(walkerCount);
    this.nextSegment = 0;
    this.dirtyMin = Infinity;
    this.dirtyMax = -Infinity;
    this.dirtyWrapped = false;
  }

  _writeVertex(segment, isStart, point, sec) {
    const { position, creationSec } = this.geometry.attributes;
    const offset = segment * 2 + (isStart ? 0 : 1);
    position.setXYZ(offset, point.x, point.y, point.z);
    creationSec.setX(offset, sec);
  }

  _copyVertex(fromSegment, fromStart, toSegment, toStart) {
    const { position, creationSec } = this.geometry.attributes;
    const from = fromSegment * 2 + (fromStart ? 0 : 1);
    const to = toSegment * 2 + (toStart ? 0 : 1);
    _vec.fromBufferAttribute(position, from);
    position.setXYZ(to, _vec.x, _vec.y, _vec.z);
    creationSec.setX(to, creationSec.getX(from));
  }

  pushPoint(index, point, sec, breakTrail = false) {
    const seg = this.nextSegment;

    if (breakTrail) {
      this._writeVertex(seg, true, point, sec);
    } else {
      this._copyVertex(this.previousSegments[index], false, seg, true);
    }
    this._writeVertex(seg, false, point, sec);

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
    ];

    attrs.forEach(([attr, itemSize]) => {
      attr.clearUpdateRanges();
      if (this.dirtyWrapped) {
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

  dispose() {
    this.geometry.dispose();
  }
}
