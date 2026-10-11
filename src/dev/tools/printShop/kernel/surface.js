import { compactMesh, createMesh, triangleArea, vertexCount } from './mesh';

function triangleComponents(mesh) {
  const count = vertexCount(mesh);
  const parent = Int32Array.from({ length: count }, (_, i) => i);
  const find = (v) => {
    let root = v;
    while (parent[root] !== root) root = parent[root];
    let node = v;
    while (parent[node] !== root) {
      const up = parent[node];
      parent[node] = root;
      node = up;
    }
    return root;
  };
  const { indices } = mesh;
  for (let t = 0; t < indices.length; t += 3) {
    const a = find(indices[t]);
    parent[find(indices[t + 1])] = a;
    parent[find(indices[t + 2])] = a;
  }
  return find;
}

// Noise holes and tatters leave crumbs: specks too small to print that would
// only snap off in the box. Dropped by area, reported by count.
export function removeSmallIslands(
  mesh,
  minArea,
  { largestOnly = false } = {}
) {
  const find = triangleComponents(mesh);
  const { indices, positions } = mesh;
  const areas = new Map();
  for (let t = 0; t < indices.length; t += 3) {
    const root = find(indices[t]);
    areas.set(
      root,
      (areas.get(root) ?? 0) +
        triangleArea(positions, indices[t], indices[t + 1], indices[t + 2])
    );
  }
  const largest = Math.max(...areas.values());
  const keep = new Set(
    [...areas]
      .filter(([, area]) => (largestOnly ? area === largest : area >= minArea))
      .map(([root]) => root)
  );
  const kept = [];
  for (let t = 0; t < indices.length; t += 3) {
    if (keep.has(find(indices[t]))) {
      kept.push(indices[t], indices[t + 1], indices[t + 2]);
    }
  }
  return {
    mesh: compactMesh(
      createMesh(positions, Uint32Array.from(kept), mesh.attributes)
    ),
    removed: areas.size - keep.size,
    pieces: keep.size,
  };
}

// Where a fold brings two parts of the sheet closer than the wall, the
// thickened skins would pass through each other. "Parts" means far apart on
// the flat cloth: `rest` holds each vertex's rest-state position, which on a
// near-inextensible sheet bounds the distance along it.
export function findFolds(mesh, rest, clearance, { apart = 3 } = {}) {
  const { positions } = mesh;
  const count = vertexCount(mesh);
  const cell = clearance;
  const grid = new Map();
  const keyOf = (x, y, z) => `${x},${y},${z}`;
  for (let v = 0; v < count; v += 1) {
    const key = keyOf(
      Math.floor(positions[v * 3] / cell),
      Math.floor(positions[v * 3 + 1] / cell),
      Math.floor(positions[v * 3 + 2] / cell)
    );
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(v);
  }
  const far = clearance * apart;
  const spots = [];
  let closest = Infinity;
  for (let v = 0; v < count; v += 1) {
    const cx = Math.floor(positions[v * 3] / cell);
    const cy = Math.floor(positions[v * 3 + 1] / cell);
    const cz = Math.floor(positions[v * 3 + 2] / cell);
    let hit = false;
    for (let dx = -1; dx <= 1 && !hit; dx += 1) {
      for (let dy = -1; dy <= 1 && !hit; dy += 1) {
        for (let dz = -1; dz <= 1 && !hit; dz += 1) {
          const bucket = grid.get(keyOf(cx + dx, cy + dy, cz + dz));
          if (bucket) {
            for (let i = 0; i < bucket.length && !hit; i += 1) {
              const w = bucket[i];
              if (w > v) {
                const d = Math.hypot(
                  positions[w * 3] - positions[v * 3],
                  positions[w * 3 + 1] - positions[v * 3 + 1],
                  positions[w * 3 + 2] - positions[v * 3 + 2]
                );
                if (d < clearance) {
                  const along = Math.hypot(
                    rest[w * 3] - rest[v * 3],
                    rest[w * 3 + 1] - rest[v * 3 + 1],
                    rest[w * 3 + 2] - rest[v * 3 + 2]
                  );
                  if (along > far) {
                    hit = true;
                    closest = Math.min(closest, d);
                    spots.push([
                      positions[v * 3],
                      positions[v * 3 + 1],
                      positions[v * 3 + 2],
                    ]);
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return { closest: spots.length ? closest : null, spots };
}
