import { triangleNormal } from './mesh';

// Smooth normals that stay sharp across creases: each corner averages only
// the faces round its vertex within `angle` of its own face, and corners with
// the same vertex and normal are shared again. Without this a signature's
// walls smear into the floor and top beside them, and the cut reads as
// chunky and low-res even though the geometry is crisp. `source[v]` is the
// original vertex each output vertex came from. Corners whose colours differ
// (a base meeting a textured foot) split too, so colour stays per face.
export default function creasedNormals(
  { cornerColors = null, indices, positions },
  angle = 35
) {
  const limit = Math.cos((angle * Math.PI) / 180);
  const triangles = indices.length / 3;
  const faces = new Float64Array(triangles * 3);
  const unit = new Float64Array(triangles * 3);
  for (let t = 0; t < triangles; t += 1) {
    const n = triangleNormal(
      positions,
      indices[t * 3],
      indices[t * 3 + 1],
      indices[t * 3 + 2]
    );
    const length = Math.hypot(...n) || 1;
    for (let k = 0; k < 3; k += 1) {
      faces[t * 3 + k] = n[k];
      unit[t * 3 + k] = n[k] / length;
    }
  }
  const count = positions.length / 3;
  const around = Array.from({ length: count }, () => []);
  for (let t = 0; t < triangles; t += 1) {
    for (let k = 0; k < 3; k += 1) around[indices[t * 3 + k]].push(t);
  }

  const outPositions = [];
  const outNormals = [];
  const outColors = [];
  const source = [];
  const outIndices = new Uint32Array(indices.length);
  const shared = new Map();
  for (let t = 0; t < triangles; t += 1) {
    for (let k = 0; k < 3; k += 1) {
      const v = indices[t * 3 + k];
      const sum = [0, 0, 0];
      around[v].forEach((f) => {
        const d =
          unit[f * 3] * unit[t * 3] +
          unit[f * 3 + 1] * unit[t * 3 + 1] +
          unit[f * 3 + 2] * unit[t * 3 + 2];
        if (d >= limit) {
          sum[0] += faces[f * 3];
          sum[1] += faces[f * 3 + 1];
          sum[2] += faces[f * 3 + 2];
        }
      });
      const length = Math.hypot(...sum) || 1;
      const n = sum.map((value) => value / length);
      const corner = (t * 3 + k) * 3;
      const color = cornerColors
        ? [
            cornerColors[corner],
            cornerColors[corner + 1],
            cornerColors[corner + 2],
          ]
        : null;
      const key = `${v}:${n.map((value) => Math.round(value * 1000)).join(',')}${color ? `:${color.map((c) => Math.round(c * 255)).join(',')}` : ''}`;
      let index = shared.get(key);
      if (index === undefined) {
        index = source.length;
        shared.set(key, index);
        source.push(v);
        outPositions.push(
          positions[v * 3],
          positions[v * 3 + 1],
          positions[v * 3 + 2]
        );
        outNormals.push(...n);
        if (color) outColors.push(...color);
      }
      outIndices[t * 3 + k] = index;
    }
  }
  return {
    colors: cornerColors ? Float32Array.from(outColors) : null,
    indices: outIndices,
    normals: Float32Array.from(outNormals),
    positions: Float64Array.from(outPositions),
    source: Uint32Array.from(source),
  };
}
