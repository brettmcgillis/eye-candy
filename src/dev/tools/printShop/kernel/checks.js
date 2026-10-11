import { bounds, triangleArea, triangleNormal } from './mesh';

// Möller–Trumbore against every triangle; mounts cast a handful of rays, so
// brute force beats building an acceleration structure.
export function castRayHits(mesh, origin, direction) {
  const { indices, positions } = mesh;
  const hits = [];
  const [ox, oy, oz] = origin;
  const [dx, dy, dz] = direction;
  for (let t = 0; t < indices.length; t += 3) {
    const a = indices[t] * 3;
    const b = indices[t + 1] * 3;
    const c = indices[t + 2] * 3;
    const e1x = positions[b] - positions[a];
    const e1y = positions[b + 1] - positions[a + 1];
    const e1z = positions[b + 2] - positions[a + 2];
    const e2x = positions[c] - positions[a];
    const e2y = positions[c + 1] - positions[a + 1];
    const e2z = positions[c + 2] - positions[a + 2];
    const px = dy * e2z - dz * e2y;
    const py = dz * e2x - dx * e2z;
    const pz = dx * e2y - dy * e2x;
    const det = e1x * px + e1y * py + e1z * pz;
    if (Math.abs(det) > 1e-12) {
      const inv = 1 / det;
      const tx = ox - positions[a];
      const ty = oy - positions[a + 1];
      const tz = oz - positions[a + 2];
      const u = (tx * px + ty * py + tz * pz) * inv;
      if (u >= 0 && u <= 1) {
        const qx = ty * e1z - tz * e1y;
        const qy = tz * e1x - tx * e1z;
        const qz = tx * e1y - ty * e1x;
        const v = (dx * qx + dy * qy + dz * qz) * inv;
        if (v >= 0 && u + v <= 1) {
          const distance = (e2x * qx + e2y * qy + e2z * qz) * inv;
          if (distance > 0) hits.push({ distance, triangle: t / 3 });
        }
      }
    }
  }
  // A ray through a shared vertex or edge hits every triangle there.
  return hits
    .sort((left, right) => left.distance - right.distance)
    .filter(
      (hit, i, list) => i === 0 || hit.distance - list[i - 1].distance > 1e-6
    );
}

export const castRay = (mesh, origin, direction) =>
  castRayHits(mesh, origin, direction).map((hit) => hit.distance);

function shells(indices, vertices) {
  const parent = Int32Array.from({ length: vertices }, (_, i) => i);
  const find = (v) => {
    let root = v;
    while (parent[root] !== root) root = parent[root];
    parent[v] = root;
    return root;
  };
  for (let t = 0; t < indices.length; t += 3) {
    const a = find(indices[t]);
    parent[find(indices[t + 1])] = a;
    parent[find(indices[t + 2])] = a;
  }
  const roots = new Set();
  for (let i = 0; i < indices.length; i += 1) roots.add(find(indices[i]));
  return { count: roots.size, find };
}

// What a print service's upload check looks at: closed and consistently
// wound, no slivers, a positive volume, and how many separate bodies.
export function analyzeSolid({ indices, positions }) {
  const vertices = positions.length / 3;
  const directed = new Map();
  let degenerate = 0;
  let area = 0;
  let volume = 0;
  let cx = 0;
  let cy = 0;
  let cz = 0;
  for (let t = 0; t < indices.length; t += 3) {
    const tri = [indices[t], indices[t + 1], indices[t + 2]];
    const triArea = triangleArea(positions, ...tri);
    area += triArea;
    if (triArea < 1e-10) degenerate += 1;
    for (let k = 0; k < 3; k += 1) {
      const key = tri[k] * vertices + tri[(k + 1) % 3];
      directed.set(key, (directed.get(key) ?? 0) + 1);
    }
    const [a, b, c] = tri.map((v) => [
      positions[v * 3],
      positions[v * 3 + 1],
      positions[v * 3 + 2],
    ]);
    const signed =
      (a[0] * (b[1] * c[2] - b[2] * c[1]) -
        a[1] * (b[0] * c[2] - b[2] * c[0]) +
        a[2] * (b[0] * c[1] - b[1] * c[0])) /
      6;
    volume += signed;
    cx += signed * (a[0] + b[0] + c[0]) * 0.25;
    cy += signed * (a[1] + b[1] + c[1]) * 0.25;
    cz += signed * (a[2] + b[2] + c[2]) * 0.25;
  }
  let open = 0;
  let overused = 0;
  let flipped = 0;
  directed.forEach((uses, key) => {
    const a = Math.floor(key / vertices);
    const b = key % vertices;
    const back = directed.get(b * vertices + a) ?? 0;
    if (uses > 1) flipped += 1;
    if (back === 0) open += 1;
    else if (uses + back > 2) overused += 1;
  });
  const box = bounds(positions);
  return {
    area,
    bounds: box,
    centroid: volume ? [cx / volume, cy / volume, cz / volume] : null,
    degenerate,
    flippedEdges: flipped,
    nonManifoldEdges: overused,
    openEdges: open,
    shells: shells(indices, vertices).count,
    triangles: indices.length / 3,
    volume,
    watertight: open === 0 && overused === 0 && flipped === 0,
  };
}

function convexHull(points) {
  const sorted = [...points].sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  if (sorted.length < 3) return sorted;
  const cross = (o, a, b) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list) => {
    const hull = [];
    list.forEach((p) => {
      while (hull.length >= 2 && cross(hull.at(-2), hull.at(-1), p) <= 0) {
        hull.pop();
      }
      hull.push(p);
    });
    hull.pop();
    return hull;
  };
  return [...half(sorted), ...half([...sorted].reverse())];
}

// Does the centre of mass sit over the footprint, and by how much? Negative
// margin means it tips.
export function standingStability(
  positions,
  centroid,
  floorY,
  tolerance = 0.05
) {
  const contact = [];
  for (let i = 0; i < positions.length; i += 3) {
    if (positions[i + 1] <= floorY + tolerance) {
      contact.push([positions[i], positions[i + 2]]);
    }
  }
  const hull = convexHull(contact);
  if (hull.length < 3 || !centroid) {
    return { contactPoints: contact.length, margin: -Infinity, stable: false };
  }
  const point = [centroid[0], centroid[2]];
  let margin = Infinity;
  hull.forEach((a, i) => {
    const b = hull[(i + 1) % hull.length];
    const ex = b[0] - a[0];
    const ez = b[1] - a[1];
    const length = Math.hypot(ex, ez) || 1;
    const side = (ex * (point[1] - a[1]) - ez * (point[0] - a[0])) / length;
    margin = Math.min(margin, side);
  });
  return { contactPoints: contact.length, margin, stable: margin > 0 };
}

export function faceNormal(positions, a, b, c) {
  const n = triangleNormal(positions, a, b, c);
  const length = Math.hypot(...n) || 1;
  return n.map((value) => value / length);
}
