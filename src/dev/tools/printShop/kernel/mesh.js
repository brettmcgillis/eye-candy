// An indexed triangle mesh: `positions` (xyz per vertex), `indices` (three
// per triangle) and named per-vertex `attributes` ({ size, array }). Every
// stage of the print pipeline takes and returns this shape, in millimetres
// and Y-up once a piece has been scaled.

export function createMesh(positions, indices, attributes = {}) {
  return { attributes, indices, positions };
}

export const vertexCount = (mesh) => mesh.positions.length / 3;
export const triangleCount = (mesh) => mesh.indices.length / 3;

export function growable(size, initial = 1024) {
  let array = new Float64Array(initial * size);
  let count = 0;
  return {
    get count() {
      return count;
    },
    push(...values) {
      if ((count + 1) * size > array.length) {
        const next = new Float64Array(array.length * 2);
        next.set(array);
        array = next;
      }
      array.set(values, count * size);
      count += 1;
      return count - 1;
    },
    pushFrom(source, index) {
      if ((count + 1) * size > array.length) {
        const next = new Float64Array(array.length * 2);
        next.set(array);
        array = next;
      }
      for (let k = 0; k < size; k += 1) {
        array[count * size + k] = source[index * size + k];
      }
      count += 1;
      return count - 1;
    },
    result: () => array.slice(0, count * size),
  };
}

export function bounds(positions) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3) {
    for (let k = 0; k < 3; k += 1) {
      min[k] = Math.min(min[k], positions[i + k]);
      max[k] = Math.max(max[k], positions[i + k]);
    }
  }
  return { max, min, size: max.map((value, k) => value - min[k]) };
}

export function transformPositions(positions, fn) {
  const out = new Float64Array(positions.length);
  for (let i = 0; i < positions.length; i += 3) {
    const [x, y, z] = fn(positions[i], positions[i + 1], positions[i + 2]);
    out[i] = x;
    out[i + 1] = y;
    out[i + 2] = z;
  }
  return out;
}

export function scaleMesh(mesh, scale, attributesToScale = []) {
  const attributes = { ...mesh.attributes };
  attributesToScale.forEach((name) => {
    const attribute = attributes[name];
    if (attribute) {
      attributes[name] = {
        ...attribute,
        array: attribute.array.map((value) => value * scale),
      };
    }
  });
  return createMesh(
    mesh.positions.map((value) => value * scale),
    mesh.indices,
    attributes
  );
}

export function triangleNormal(positions, a, b, c) {
  const ax = positions[a * 3];
  const ay = positions[a * 3 + 1];
  const az = positions[a * 3 + 2];
  const ux = positions[b * 3] - ax;
  const uy = positions[b * 3 + 1] - ay;
  const uz = positions[b * 3 + 2] - az;
  const vx = positions[c * 3] - ax;
  const vy = positions[c * 3 + 1] - ay;
  const vz = positions[c * 3 + 2] - az;
  return [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
}

// Area-weighted: the unnormalised face normal is twice the area.
export function vertexNormals(mesh) {
  const { indices, positions } = mesh;
  const normals = new Float64Array(positions.length);
  for (let t = 0; t < indices.length; t += 3) {
    const n = triangleNormal(
      positions,
      indices[t],
      indices[t + 1],
      indices[t + 2]
    );
    for (let k = 0; k < 3; k += 1) {
      const o = indices[t + k] * 3;
      normals[o] += n[0];
      normals[o + 1] += n[1];
      normals[o + 2] += n[2];
    }
  }
  for (let i = 0; i < normals.length; i += 3) {
    const length = Math.hypot(normals[i], normals[i + 1], normals[i + 2]) || 1;
    normals[i] /= length;
    normals[i + 1] /= length;
    normals[i + 2] /= length;
  }
  return normals;
}

export function triangleArea(positions, a, b, c) {
  return Math.hypot(...triangleNormal(positions, a, b, c)) / 2;
}

// Keeps only referenced vertices, remapping indices and attributes.
export function compactMesh(mesh) {
  const count = vertexCount(mesh);
  const remap = new Int32Array(count).fill(-1);
  let next = 0;
  const indices = new Uint32Array(mesh.indices.length);
  for (let i = 0; i < mesh.indices.length; i += 1) {
    const v = mesh.indices[i];
    if (remap[v] < 0) {
      remap[v] = next;
      next += 1;
    }
    indices[i] = remap[v];
  }
  const pick = (array, size) => {
    const out = new Float64Array(next * size);
    for (let v = 0; v < count; v += 1) {
      if (remap[v] >= 0) {
        for (let k = 0; k < size; k += 1) {
          out[remap[v] * size + k] = array[v * size + k];
        }
      }
    }
    return out;
  };
  const attributes = Object.fromEntries(
    Object.entries(mesh.attributes).map(([name, attribute]) => [
      name,
      { ...attribute, array: pick(attribute.array, attribute.size) },
    ])
  );
  return createMesh(pick(mesh.positions, 3), indices, attributes);
}
