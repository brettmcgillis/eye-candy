import { vertexCount, vertexNormals } from './mesh';

export const FACE_FRONT = 0;
export const FACE_BACK = 1;
export const FACE_EDGE = 2;

// Thickens an open surface into a closed shell centred on it: the front skin
// (the side its winding faces) at +t/2 along the vertex normals, the back at
// −t/2 with the winding reversed, and a wall stitched along every boundary
// edge. A manifold surface in gives a watertight solid out. `colors` names a
// per-side colour attribute ({ front, back }) carried onto each skin.
export default function solidify(mesh, thickness, { colors } = {}) {
  const count = vertexCount(mesh);
  const normals = vertexNormals(mesh);
  const half = thickness / 2;
  const positions = new Float64Array(count * 6);
  for (let v = 0; v < count; v += 1) {
    for (let k = 0; k < 3; k += 1) {
      const p = mesh.positions[v * 3 + k];
      const n = normals[v * 3 + k] * half;
      positions[v * 3 + k] = p + n;
      positions[(count + v) * 3 + k] = p - n;
    }
  }

  const { indices } = mesh;
  const edges = new Map();
  for (let t = 0; t < indices.length; t += 3) {
    for (let k = 0; k < 3; k += 1) {
      const a = indices[t + k];
      const b = indices[t + ((k + 1) % 3)];
      const key = Math.min(a, b) * count + Math.max(a, b);
      const seen = edges.get(key);
      edges.set(key, seen ? null : [a, b]);
    }
  }
  const boundary = [...edges.values()].filter(Boolean);

  const triangles = indices.length / 3;
  const out = new Uint32Array((triangles * 2 + boundary.length * 2) * 3);
  const faces = new Uint8Array(triangles * 2 + boundary.length * 2);
  let f = 0;
  const emit = (a, b, c, face) => {
    out[f * 3] = a;
    out[f * 3 + 1] = b;
    out[f * 3 + 2] = c;
    faces[f] = face;
    f += 1;
  };
  for (let t = 0; t < indices.length; t += 3) {
    emit(indices[t], indices[t + 1], indices[t + 2], FACE_FRONT);
    emit(
      count + indices[t],
      count + indices[t + 2],
      count + indices[t + 1],
      FACE_BACK
    );
  }
  boundary.forEach(([a, b]) => {
    emit(a, count + a, count + b, FACE_EDGE);
    emit(a, count + b, b, FACE_EDGE);
  });

  let vertexColors = null;
  if (colors) {
    const front = mesh.attributes[colors.front].array;
    const back = mesh.attributes[colors.back].array;
    vertexColors = new Float64Array(count * 6);
    vertexColors.set(front, 0);
    vertexColors.set(back, count * 3);
  }

  return {
    boundaryEdges: boundary.length,
    faces,
    indices: out,
    positions,
    vertexColors,
  };
}
