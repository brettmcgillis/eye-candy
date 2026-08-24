import { MeshBVH } from 'three-mesh-bvh';
import {
  Continue,
  If,
  Loop,
  add,
  array,
  bool,
  clamp,
  cross,
  dot,
  float,
  int,
  select,
  uint,
  vec3,
} from 'three/tsl';

import { StructuredArray } from './StructuredArray';

const BYTES_PER_NODE = 6 * 4 + 4 + 4;
const TRI_INTERSECT_EPSILON = 1e-5;

export class BVH {
  geometry = null;

  bvh = null;

  bvhBuffer = null;

  triangleBuffer = null;

  maxDepth = 0;

  constructor(geometry) {
    this.geometry = geometry;
    this.bvh = new MeshBVH(geometry);
    this._buildBuffers();
    this._buildShaderFunctions();
  }

  _buildBuffers() {
    const bvhNodeStruct = {
      boundsMin: 'vec3',
      boundsMax: 'vec3',
      isLeaf: 'uint',
      count: 'uint',
      offset: 'uint',
      rightIndex: 'uint',
      splitAxis: 'uint',
    };
    const triangleStruct = { a: 'vec3', b: 'vec3', c: 'vec3' };

    const roots = this.bvh._roots;
    if (roots.length !== 1) throw new Error('Multi-root BVHs not supported.');

    const root = roots[0];
    const uint16Array = new Uint16Array(root);
    const uint32Array = new Uint32Array(root);
    const float32Array = new Float32Array(root);
    const nodeCount = root.byteLength / BYTES_PER_NODE;

    const depths = Array(nodeCount).fill(0);
    this.bvhBuffer = new StructuredArray(bvhNodeStruct, nodeCount, 'bvhBuffer');

    for (let i = 0; i < nodeCount; i++) {
      depths[i]++;
      this.maxDepth = Math.max(depths[i], this.maxDepth);
      const nodeIndex32 = (i * BYTES_PER_NODE) / 4;
      const nodeIndex16 = nodeIndex32 * 2;

      this.bvhBuffer.set(
        i,
        'boundsMin',
        float32Array.slice(nodeIndex32, nodeIndex32 + 3)
      );
      this.bvhBuffer.set(
        i,
        'boundsMax',
        float32Array.slice(nodeIndex32 + 3, nodeIndex32 + 6)
      );

      if (uint16Array[nodeIndex16 + 15] === 0xffff) {
        this.bvhBuffer.set(i, 'isLeaf', 1);
        this.bvhBuffer.set(i, 'count', uint16Array[nodeIndex16 + 14]);
        this.bvhBuffer.set(i, 'offset', uint32Array[nodeIndex32 + 6]);
      } else {
        const rightIndex = (4 * uint32Array[nodeIndex32 + 6]) / BYTES_PER_NODE;
        this.bvhBuffer.set(i, 'isLeaf', 0);
        this.bvhBuffer.set(i, 'splitAxis', uint32Array[nodeIndex32 + 7]);
        this.bvhBuffer.set(i, 'rightIndex', rightIndex);
        depths[i + 1] = depths[i];
        depths[rightIndex] = depths[i];
      }
    }

    const triangleCount = this.bvh.geometry.getIndex().count / 3;
    const indexArray = this.bvh.geometry.getIndex().array;
    const positionArray = this.bvh.geometry.getAttribute('position').array;

    this.triangleBuffer = new StructuredArray(
      triangleStruct,
      triangleCount,
      'triangleBuffer'
    );
    for (let i = 0; i < triangleCount; i++) {
      const [aIdx, bIdx, cIdx] = indexArray.slice(i * 3, i * 3 + 3);
      this.triangleBuffer.set(
        i,
        'a',
        positionArray.slice(aIdx * 3, aIdx * 3 + 3)
      );
      this.triangleBuffer.set(
        i,
        'b',
        positionArray.slice(bIdx * 3, bIdx * 3 + 3)
      );
      this.triangleBuffer.set(
        i,
        'c',
        positionArray.slice(cIdx * 3, cIdx * 3 + 3)
      );
    }
  }

  _buildShaderFunctions() {
    const distanceSqToBVHNodeBoundsPoint = (point, bvhNode) => {
      const boundsMin = bvhNode.get('boundsMin');
      const boundsMax = bvhNode.get('boundsMax');
      const clampedPoint = clamp(point, boundsMin, boundsMax);
      const delta = point.sub(clampedPoint).toVar();
      return dot(delta, delta);
    };

    const closestPointToTriangle = (point, v0, v1, v2) => {
      const v10 = v1.sub(v0).toVar('v10');
      const v21 = v2.sub(v1).toVar('v21');
      const v02 = v0.sub(v2).toVar('v02');
      const p0 = point.sub(v0).toVar('p0');
      const p1 = point.sub(v1).toVar('p1');
      const p2 = point.sub(v2).toVar('p2');
      const nor = cross(v10, v02).toVar('nor');
      const q = cross(nor, p0).toVar('q');
      const d = float(1.0).div(dot(nor, nor)).toVar('d');
      const u = dot(q, v02).mul(d).toVar('u');
      const v = dot(q, v10).mul(d).toVar('v');
      const w = float(1.0).sub(u).sub(v).toVar('w');
      If(u.lessThan(0), () => {
        w.assign(clamp(dot(p2, v02).div(dot(v02, v02)), 0, 1));
        u.assign(0);
        v.assign(w.oneMinus());
      })
        .ElseIf(v.lessThan(0), () => {
          u.assign(clamp(dot(p0, v10).div(dot(v10, v10)), 0, 1));
          v.assign(0);
          w.assign(u.oneMinus());
        })
        .ElseIf(w.lessThan(0), () => {
          v.assign(clamp(dot(p1, v21).div(dot(v21, v21)), 0, 1));
          w.assign(0);
          u.assign(v.oneMinus());
        });
      return [
        add(u.mul(v1), v.mul(v2), w.mul(v0)).toVar('closestTrianglePoint'),
        nor.negate(),
      ];
    };

    const distanceToTriangles = (point, offset, count) => {
      const end = offset.add(count).toVar('end');
      const closestSqDist = float(1e9).toVar('closestTriangleSqDist');
      const outPoint = vec3().toVar('outPoint');
      const outNormal = vec3().toVar('outNormal');
      Loop(
        {
          start: offset,
          end,
          type: 'uint',
          name: 'triangleIndex',
          condition: '<',
        },
        ({ triangleIndex }) => {
          const a = this.triangleBuffer
            .element(triangleIndex)
            .get('a')
            .toVar('a');
          const b = this.triangleBuffer
            .element(triangleIndex)
            .get('b')
            .toVar('b');
          const c = this.triangleBuffer
            .element(triangleIndex)
            .get('c')
            .toVar('c');
          const [closestPoint, closestNormal] = closestPointToTriangle(
            point,
            a,
            b,
            c
          );
          const delta = point.sub(closestPoint).toVar('triangleDelta');
          const sqDist = dot(delta, delta).toVar();
          If(sqDist.lessThan(closestSqDist), () => {
            closestSqDist.assign(sqDist);
            outPoint.assign(closestPoint);
            outNormal.assign(closestNormal);
          });
        }
      );
      return [closestSqDist, outPoint, outNormal];
    };

    this.findClosestPoint = (point, maxDistanceSquared = float(1e12)) => {
      const ptr = int(0).toVar('ptr');
      const stack = array('uint', this.maxDepth * 2).toVar('stack');
      stack.element(0).assign(uint(0));

      const closestPoint = vec3().toVar();
      const closestNormal = vec3().toVar();
      const closestDistSq = maxDistanceSquared.toVar('closestDistSq');
      const found = bool(false).toVar('found');

      Loop(
        ptr.greaterThan(int(-1)).and(ptr.lessThan(int(this.maxDepth * 2))),
        () => {
          const currNodeIndex = stack.element(ptr).toVar('currNodeIndex');
          ptr.subAssign(int(1));
          const bvhNode = this.bvhBuffer.element(currNodeIndex);
          const boundsHitDistance = distanceSqToBVHNodeBoundsPoint(
            point,
            bvhNode
          );
          If(boundsHitDistance.greaterThan(closestDistSq), () => {
            Continue();
          });

          const isLeaf = bvhNode.get('isLeaf');
          If(isLeaf.equal(uint(1)), () => {
            const offset = bvhNode.get('offset').toVar('offset');
            const count = bvhNode.get('count').toVar('count');
            const [
              closestTriangleSqDist,
              closestTrianglePoint,
              closestTriangleNormal,
            ] = distanceToTriangles(point, offset, count);
            If(closestTriangleSqDist.lessThanEqual(closestDistSq), () => {
              found.assign(true);
              closestDistSq.assign(closestTriangleSqDist);
              closestPoint.assign(closestTrianglePoint);
              closestNormal.assign(closestTriangleNormal);
            });
          }).Else(() => {
            const leftIndex = currNodeIndex.add(uint(1)).toVar('leftIndex');
            const splitAxis = bvhNode.get('splitAxis').toVar('splitAxis');
            const rightIndex = bvhNode.get('rightIndex').toVar('rightIndex');
            const leftNode = this.bvhBuffer.element(leftIndex);
            const rightNode = this.bvhBuffer.element(rightIndex);
            const leftDistance = distanceSqToBVHNodeBoundsPoint(
              point,
              leftNode
            );
            const rightDistance = distanceSqToBVHNodeBoundsPoint(
              point,
              rightNode
            );
            const leftToRight = leftDistance.lessThan(rightDistance).toVar();
            const c1 = select(leftToRight, leftIndex, rightIndex).toVar('c1');
            const c2 = select(leftToRight, rightIndex, leftIndex).toVar('c2');
            ptr.addAssign(1);
            stack.element(ptr).assign(c2);
            ptr.addAssign(1);
            stack.element(ptr).assign(c1);
          });
        }
      );

      return [closestPoint, closestNormal];
    };
  }
}
