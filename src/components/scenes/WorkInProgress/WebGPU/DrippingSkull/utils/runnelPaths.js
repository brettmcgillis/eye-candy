// Traces "runnel" paths — the routes liquid takes flowing down the skull.
//
// From spawn points spread over the upper skull, repeatedly step downward
// and project back onto the mesh surface (three-mesh-bvh closest point).
// The walk follows the real geometry: over the brow, around the orbit,
// down the cheekbone. It ends where gravity wins — an underhang or local
// minimum (chin, teeth, zygomatic edge) — which becomes the drip-off point.
//
// Computed once at load; agents replay the paths at runtime.
import {
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree,
} from 'three-mesh-bvh';
import * as THREE from 'three/webgpu';

if (!THREE.BufferGeometry.prototype.computeBoundsTree) {
  THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
  THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
  THREE.Mesh.prototype.raycast = acceleratedRaycast;
}

// Deterministic pseudo-random — paths must be stable across reloads.
function rand(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function mergeWorldGeometry(root) {
  const positions = [];
  const indices = [];
  let offset = 0;
  const tmp = new THREE.Vector3();

  root.updateWorldMatrix(true, true);
  root.traverse((node) => {
    if (!node.isMesh || !node.geometry) return;
    const pos = node.geometry.attributes.position;
    const idx = node.geometry.index;
    for (let i = 0; i < pos.count; i += 1) {
      tmp.fromBufferAttribute(pos, i).applyMatrix4(node.matrixWorld);
      positions.push(tmp.x, tmp.y, tmp.z);
    }
    if (idx) {
      for (let i = 0; i < idx.count; i += 1) {
        indices.push(idx.getX(i) + offset);
      }
    } else {
      for (let i = 0; i < pos.count; i += 1) indices.push(i + offset);
    }
    offset += pos.count;
  });

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  return geo;
}

// Spawn points: surface vertices spread over the skull, preferring the
// upper half (liquid is poured from above), with greedy spacing.
function pickSpawnPoints(geo, count, minSpacing) {
  const pos = geo.attributes.position;
  const candidates = [];
  const stride = Math.max(1, Math.floor(pos.count / 8000));
  const p = new THREE.Vector3();

  geo.computeBoundingBox();
  const midY = (geo.boundingBox.min.y + geo.boundingBox.max.y) / 2;

  for (let i = 0; i < pos.count; i += stride) {
    p.fromBufferAttribute(pos, i);
    if (p.y > midY - 0.2) {
      candidates.push({ point: p.clone(), score: p.y + rand(i) * 0.8 });
    }
  }
  candidates.sort((a, b) => b.score - a.score);

  const spawns = [];
  const spacingSq = minSpacing * minSpacing;
  for (let i = 0; i < candidates.length && spawns.length < count; i += 1) {
    const c = candidates[i];
    const blocked = spawns.some(
      (s) => s.distanceToSquared(c.point) < spacingSq
    );
    if (!blocked) spawns.push(c.point);
  }
  return spawns;
}

/**
 * @returns array of { points: Vector3[], dripOff: Vector3 }
 */
export default function computeRunnelPaths(
  root,
  { count = 24, step = 0.045, maxSteps = 160, minSpacing = 0.3 } = {}
) {
  const geo = mergeWorldGeometry(root);
  geo.computeBoundsTree();

  const spawns = pickSpawnPoints(geo, count, minSpacing);
  const paths = [];

  const cand = new THREE.Vector3();
  const hit = { point: new THREE.Vector3(), distance: 0, faceIndex: 0 };

  for (let s = 0; s < spawns.length; s += 1) {
    const points = [spawns[s].clone()];
    let prev = spawns[s];
    let stuck = 0;

    for (let i = 0; i < maxSteps; i += 1) {
      // Step down with a little seeded lateral wander so parallel runnels
      // don't look machine-straight.
      const jitter = (rand(s * 97 + i) - 0.5) * step * 0.8;
      const jitterZ = (rand(s * 131 + i) - 0.5) * step * 0.8;
      cand.set(prev.x + jitter, prev.y - step, prev.z + jitterZ);

      hit.distance = Infinity;
      geo.boundsTree.closestPointToPoint(cand, hit, 0, Infinity);
      const p = hit.point;

      // Jumped across a gap (e.g. from jaw to clavicle-less void) —
      // the previous point is where the liquid leaves the surface.
      if (p.distanceTo(prev) > step * 3) break;

      // Not descending → ledge / local minimum. Tolerate briefly
      // (small plateaus), then call it the drip-off.
      if (prev.y - p.y < step * 0.2) {
        stuck += 1;
        if (stuck > 2) break;
      } else {
        stuck = 0;
      }

      points.push(p.clone());
      prev = points[points.length - 1];
    }

    // Discard degenerate paths that never went anywhere.
    if (points.length >= 5) {
      paths.push({ points, dripOff: points[points.length - 1].clone() });
    }
  }

  geo.disposeBoundsTree();
  geo.dispose();
  return paths;
}
