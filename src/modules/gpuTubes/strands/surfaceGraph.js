import createSpatialHash from './spatialHash';

// Merges vertices within `tolerance` by sorting quantised positions, keeping
// first-appearance order for the welded ids.
function weld(position, index, tolerance) {
  const count = position.length / 3;
  const q = new Int32Array(count * 3);
  for (let i = 0; i < count * 3; i += 1) {
    q[i] = Math.round(position[i] / tolerance);
  }
  const order = new Int32Array(count).map((_, i) => i);
  order.sort(
    (a, b) =>
      q[a * 3] - q[b * 3] ||
      q[a * 3 + 1] - q[b * 3 + 1] ||
      q[a * 3 + 2] - q[b * 3 + 2] ||
      a - b
  );
  const representative = new Int32Array(count);
  for (let k = 0; k < count; k += 1) {
    const i = order[k];
    const prev = k > 0 ? order[k - 1] : -1;
    const same =
      prev >= 0 &&
      q[i * 3] === q[prev * 3] &&
      q[i * 3 + 1] === q[prev * 3 + 1] &&
      q[i * 3 + 2] === q[prev * 3 + 2];
    representative[i] = same ? representative[prev] : i;
  }

  const remap = new Int32Array(count).fill(-1);
  const welded = [];
  for (let i = 0; i < count; i += 1) {
    const r = representative[i];
    if (remap[r] < 0) {
      remap[r] = welded.length / 3;
      welded.push(position[r * 3], position[r * 3 + 1], position[r * 3 + 2]);
    }
    remap[i] = remap[r];
  }

  const triangles = new Int32Array(index.length);
  for (let t = 0; t < index.length; t += 1) triangles[t] = remap[index[t]];

  return { positions: new Float32Array(welded), triangles };
}

// Deduplicated vertex adjacency straight into typed arrays: a Set per vertex
// is what made million-vertex graphs take seconds.
function triangleAdjacency(count, triangles) {
  const degree = new Int32Array(count + 1);
  for (let t = 0; t < triangles.length; t += 1) degree[triangles[t] + 1] += 2;
  for (let v = 0; v < count; v += 1) degree[v + 1] += degree[v];
  const raw = new Int32Array(degree[count]);
  const fill = degree.slice(0, count);
  for (let t = 0; t < triangles.length; t += 3) {
    const tri = [triangles[t], triangles[t + 1], triangles[t + 2]];
    for (let k = 0; k < 3; k += 1) {
      const v = tri[k];
      raw[fill[v]] = tri[(k + 1) % 3];
      raw[fill[v] + 1] = tri[(k + 2) % 3];
      fill[v] += 2;
    }
  }
  const offsets = new Int32Array(count + 1);
  const neighbors = new Int32Array(raw.length);
  let write = 0;
  for (let v = 0; v < count; v += 1) {
    offsets[v] = write;
    const list = raw.subarray(degree[v], degree[v + 1]).sort();
    for (let k = 0; k < list.length; k += 1) {
      if (k === 0 || list[k] !== list[k - 1]) {
        neighbors[write] = list[k];
        write += 1;
      }
    }
  }
  offsets[count] = write;
  return { neighbors: neighbors.subarray(0, write), offsets };
}

function components(count, triangles) {
  const parent = new Int32Array(count).map((_, i) => i);
  const find = (a) => {
    let r = a;
    while (parent[r] !== r) {
      parent[r] = parent[parent[r]];
      r = parent[r];
    }
    return r;
  };
  for (let t = 0; t < triangles.length; t += 3) {
    const a = find(triangles[t]);
    parent[find(triangles[t + 1])] = a;
    parent[find(triangles[t + 2])] = a;
  }
  return Int32Array.from({ length: count }, (_, v) => find(v));
}

function vertexNormals(positions, triangles) {
  const normals = new Float32Array(positions.length);
  for (let t = 0; t < triangles.length; t += 3) {
    const [a, b, c] = [triangles[t], triangles[t + 1], triangles[t + 2]];
    const ux = positions[b * 3] - positions[a * 3];
    const uy = positions[b * 3 + 1] - positions[a * 3 + 1];
    const uz = positions[b * 3 + 2] - positions[a * 3 + 2];
    const vx = positions[c * 3] - positions[a * 3];
    const vy = positions[c * 3 + 1] - positions[a * 3 + 1];
    const vz = positions[c * 3 + 2] - positions[a * 3 + 2];
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    [a, b, c].forEach((v) => {
      normals[v * 3] += nx;
      normals[v * 3 + 1] += ny;
      normals[v * 3 + 2] += nz;
    });
  }
  for (let v = 0; v < normals.length; v += 3) {
    const l = Math.hypot(normals[v], normals[v + 1], normals[v + 2]) || 1;
    normals[v] /= l;
    normals[v + 1] /= l;
    normals[v + 2] /= l;
  }
  return normals;
}

// Welded vertex graph of a mesh: UV and normal seams split vertices, and a
// walk has to cross them. Meshes built from separate parts (a skull is dozens
// of bones) get bridge edges wherever two parts come within `bridgeRadius` of
// each other, so one walk can cross a suture.
export default function buildSurfaceGraph({
  bridgeRadius = 0,
  index,
  position,
  weldTolerance = 1e-5,
}) {
  // A null tolerance keeps the caller's vertex order, for meshes that are
  // already welded and carry per-vertex data aligned to it.
  const { positions, triangles } =
    weldTolerance === null
      ? { positions: position, triangles: Int32Array.from(index) }
      : weld(position, index, weldTolerance);
  const count = positions.length / 3;
  const adjacency = triangleAdjacency(count, triangles);
  const neighborsOf = (v) =>
    adjacency.neighbors.subarray(
      adjacency.offsets[v],
      adjacency.offsets[v + 1]
    );

  const edgeLengths = [];
  for (let v = 0; v < count; v += 97) {
    neighborsOf(v).forEach((n) =>
      edgeLengths.push(
        Math.hypot(
          positions[v * 3] - positions[n * 3],
          positions[v * 3 + 1] - positions[n * 3 + 1],
          positions[v * 3 + 2] - positions[n * 3 + 2]
        )
      )
    );
  }
  edgeLengths.sort((a, b) => a - b);
  const edgeLength = edgeLengths[Math.floor(edgeLengths.length / 2)] || 1;

  if (bridgeRadius <= 0) {
    return {
      count,
      edgeLength,
      neighbors: adjacency.neighbors,
      normals: vertexNormals(positions, triangles),
      offsets: adjacency.offsets,
      positions,
      triangles,
    };
  }

  const sets = Array.from({ length: count }, (_, v) => new Set(neighborsOf(v)));
  const part = components(count, triangles);
  const hash = createSpatialHash(positions, bridgeRadius);
  for (let v = 0; v < count; v += 1) {
    hash.forEachNear(
      positions[v * 3],
      positions[v * 3 + 1],
      positions[v * 3 + 2],
      bridgeRadius,
      (n) => {
        if (part[n] !== part[v] && sets[v].size < 24) {
          sets[v].add(n);
          sets[n].add(v);
        }
      }
    );
  }

  const offsets = new Int32Array(count + 1);
  for (let v = 0; v < count; v += 1) offsets[v + 1] = offsets[v] + sets[v].size;
  const neighbors = new Int32Array(offsets[count]);
  for (let v = 0; v < count; v += 1) {
    let k = offsets[v];
    sets[v].forEach((n) => {
      neighbors[k] = n;
      k += 1;
    });
  }

  return {
    count,
    edgeLength,
    neighbors,
    normals: vertexNormals(positions, triangles),
    offsets,
    positions,
    triangles,
  };
}
