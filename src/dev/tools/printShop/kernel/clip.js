import { compactMesh, createMesh, growable, vertexCount } from './mesh';

const EPSILON = 1e-9;

// Keeps the part of a surface where `field` ≥ 0, cutting triangles along the
// zero crossing. Crossing points are shared per edge, so the result is still
// one connected manifold with a clean boundary — the outline the print walls
// are stitched along. Attributes interpolate with the positions.
export default function clipMesh(mesh, field) {
  const count = vertexCount(mesh);
  const values = Float64Array.from(field, (value) =>
    Math.abs(value) < EPSILON ? EPSILON : value
  );
  const names = Object.keys(mesh.attributes);
  const positions = growable(3, count * 2);
  const attributes = names.map((name) =>
    growable(mesh.attributes[name].size, count * 2)
  );

  for (let v = 0; v < count; v += 1) {
    positions.pushFrom(mesh.positions, v);
    names.forEach((name, n) => {
      attributes[n].pushFrom(mesh.attributes[name].array, v);
    });
  }

  const crossings = new Map();
  const crossing = (a, b) => {
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    const key = lo * count + hi;
    const known = crossings.get(key);
    if (known !== undefined) return known;
    const t = values[lo] / (values[lo] - values[hi]);
    const lerp = (array, size) =>
      Array.from(
        { length: size },
        (_, k) =>
          array[lo * size + k] +
          (array[hi * size + k] - array[lo * size + k]) * t
      );
    const index = positions.push(...lerp(mesh.positions, 3));
    names.forEach((name, n) => {
      const { array, size } = mesh.attributes[name];
      attributes[n].push(...lerp(array, size));
    });
    crossings.set(key, index);
    return index;
  };

  const out = [];
  const { indices } = mesh;
  for (let t = 0; t < indices.length; t += 3) {
    const tri = [indices[t], indices[t + 1], indices[t + 2]];
    const inside = tri.map((v) => values[v] > 0);
    const kept = inside.filter(Boolean).length;
    if (kept === 3) {
      out.push(...tri);
    } else if (kept > 0) {
      // Rotate so the lone vertex (inside for 1, outside for 2) comes first;
      // rotation keeps the winding.
      const lone = kept === 1 ? inside.indexOf(true) : inside.indexOf(false);
      const a = tri[lone];
      const b = tri[(lone + 1) % 3];
      const c = tri[(lone + 2) % 3];
      const ab = crossing(a, b);
      const ca = crossing(c, a);
      if (kept === 1) {
        out.push(a, ab, ca);
      } else {
        out.push(ab, b, c, ab, c, ca);
      }
    }
  }

  return compactMesh(
    createMesh(
      positions.result(),
      Uint32Array.from(out),
      Object.fromEntries(
        names.map((name, n) => [
          name,
          { ...mesh.attributes[name], array: attributes[n].result() },
        ])
      )
    )
  );
}
