// Posed meshes as line work in 3D: welded triangle meshes in world space,
// and the strokes a pen can draw on them — occluding contours, creases and
// boundaries, and section cuts in an object's own frame.
import { simplifyLoop } from './lines';

const DEG = Math.PI / 180;
const SAMPLE_PX = 1.5;

// Vertices sharing a rest position become one, so seams split for UVs or
// hard normals still read as connected surface.
export function weldMesh({ index, position, rest }) {
  const vertexCount = rest.length / 3;
  let span = 0;
  for (let k = 0; k < 3; k += 1) {
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = k; i < rest.length; i += 3) {
      lo = Math.min(lo, rest[i]);
      hi = Math.max(hi, rest[i]);
    }
    span = Math.max(span, hi - lo);
  }
  const quantum = (span || 1) * 1e-5;
  const ids = new Map();
  const remap = new Uint32Array(vertexCount);
  const world = [];
  for (let i = 0; i < vertexCount; i += 1) {
    const key = `${Math.round(rest[i * 3] / quantum)},${Math.round(rest[i * 3 + 1] / quantum)},${Math.round(rest[i * 3 + 2] / quantum)}`;
    let id = ids.get(key);
    if (id === undefined) {
      id = ids.size;
      ids.set(key, id);
      world.push(position[i * 3], position[i * 3 + 1], position[i * 3 + 2]);
    }
    remap[i] = id;
  }
  const corners = index ?? Array.from({ length: vertexCount }, (_, i) => i);
  const tris = [];
  for (let t = 0; t + 2 < corners.length; t += 3) {
    const a = remap[corners[t]];
    const b = remap[corners[t + 1]];
    const c = remap[corners[t + 2]];
    if (a !== b && b !== c && a !== c) tris.push(a, b, c);
  }
  return {
    count: ids.size,
    tris: Uint32Array.from(tris),
    world: Float64Array.from(world),
  };
}

const pointOf = (world, i) => [
  world[i * 3],
  world[i * 3 + 1],
  world[i * 3 + 2],
];

function faceNormals({ tris, world }) {
  const normals = new Float64Array(tris.length);
  for (let t = 0; t < tris.length; t += 3) {
    const a = pointOf(world, tris[t]);
    const b = pointOf(world, tris[t + 1]);
    const c = pointOf(world, tris[t + 2]);
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const n = [
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0],
    ];
    const length = Math.hypot(...n) || 1;
    normals[t] = n[0] / length;
    normals[t + 1] = n[1] / length;
    normals[t + 2] = n[2] / length;
  }
  return normals;
}

// +1 where a triangle faces the eye, −1 where it faces away.
function facings({ tris, world }, normals, eye) {
  const facing = new Int8Array(tris.length / 3);
  for (let t = 0; t < tris.length; t += 3) {
    const a = tris[t] * 3;
    const d =
      normals[t] * (eye[0] - world[a]) +
      normals[t + 1] * (eye[1] - world[a + 1]) +
      normals[t + 2] * (eye[2] - world[a + 2]);
    facing[t / 3] = d > 0 ? 1 : -1;
  }
  return facing;
}

function edgeFaces({ count, tris }) {
  const edges = new Map();
  for (let t = 0; t < tris.length; t += 3) {
    for (let e = 0; e < 3; e += 1) {
      const a = tris[t + e];
      const b = tris[t + ((e + 1) % 3)];
      const key = a < b ? a * count + b : b * count + a;
      const faces = edges.get(key);
      if (faces) faces.push(t / 3);
      else edges.set(key, [t / 3]);
    }
  }
  return edges;
}

// Contours (one face toward the eye, one away) and creases (two faces bent
// past `creaseAngle`, at least one visible, or an open boundary), as
// segments between welded vertices keyed for chaining.
export function meshEdges(mesh, { creaseAngle, eye }) {
  const normals = faceNormals(mesh);
  const facing = facings(mesh, normals, eye);
  const creaseCos = Math.cos(creaseAngle * DEG);
  const contours = [];
  const creases = [];
  edgeFaces(mesh).forEach((faces, key) => {
    const a = Math.floor(key / mesh.count);
    const b = key - a * mesh.count;
    const segment = [
      [`v${a}`, pointOf(mesh.world, a)],
      [`v${b}`, pointOf(mesh.world, b)],
    ];
    if (faces.length === 1) {
      if (facing[faces[0]] > 0) creases.push(segment);
      return;
    }
    if (faces.length !== 2) return;
    const [f0, f1] = faces;
    if (facing[f0] !== facing[f1]) {
      contours.push(segment);
      return;
    }
    if (facing[f0] < 0) return;
    const cos =
      normals[f0 * 3] * normals[f1 * 3] +
      normals[f0 * 3 + 1] * normals[f1 * 3 + 1] +
      normals[f0 * 3 + 2] * normals[f1 * 3 + 2];
    if (cos < creaseCos) creases.push(segment);
  });
  return { contours, creases, facing };
}

const transform = (m, [x, y, z]) => [
  m[0] * x + m[4] * y + m[8] * z + m[12],
  m[1] * x + m[5] * y + m[9] * z + m[13],
  m[2] * x + m[6] * y + m[10] * z + m[14],
];

// Level cuts through one object's meshes along its own `axis` (1: height,
// 2: length), `count` planes spread across its extent, drawn on the faces
// toward the eye only.
export function sectionCuts(meshes, { axis, count, inverse }) {
  const locals = meshes.map(({ mesh }) => {
    const values = new Float64Array(mesh.count);
    for (let i = 0; i < mesh.count; i += 1) {
      values[i] = transform(inverse, pointOf(mesh.world, i))[axis];
    }
    return values;
  });
  let lo = Infinity;
  let hi = -Infinity;
  locals.forEach((values) =>
    values.forEach((v) => {
      lo = Math.min(lo, v);
      hi = Math.max(hi, v);
    })
  );
  if (!(hi > lo)) return [];
  const levels = Array.from(
    { length: count },
    (_, k) => lo + ((hi - lo) * (k + 0.5)) / count + 1e-7
  );
  const segments = [];
  meshes.forEach(({ facing, mesh }, m) => {
    const values = locals[m];
    const { tris, world } = mesh;
    for (let t = 0; t < tris.length; t += 3) {
      if (facing[t / 3] > 0) {
        const corner = [tris[t], tris[t + 1], tris[t + 2]];
        const vs = corner.map((i) => values[i]);
        const min = Math.min(...vs);
        const max = Math.max(...vs);
        levels.forEach((level, k) => {
          if (level <= min || level >= max) return;
          const hits = [];
          for (let e = 0; e < 3; e += 1) {
            const i = corner[e];
            const j = corner[(e + 1) % 3];
            const vi = values[i];
            const vj = values[j];
            if (vi < level !== vj < level) {
              const s = (level - vi) / (vj - vi);
              const pi = pointOf(world, i);
              const pj = pointOf(world, j);
              const key = i < j ? `${m}:${i}:${j}:${k}` : `${m}:${j}:${i}:${k}`;
              hits.push([
                key,
                [
                  pi[0] + (pj[0] - pi[0]) * s,
                  pi[1] + (pj[1] - pi[1]) * s,
                  pi[2] + (pj[2] - pi[2]) * s,
                ],
              ]);
            }
          }
          if (hits.length === 2) segments.push(hits);
        });
      }
    }
  });
  return segments;
}

// Segments whose ends share a key, joined into polylines of 3D points.
export function chainKeyed(segments) {
  const ends = new Map();
  segments.forEach((segment, index) => {
    segment.forEach(([key]) => {
      if (!ends.has(key)) ends.set(key, []);
      ends.get(key).push(index);
    });
  });
  const used = new Uint8Array(segments.length);
  const next = (key) => (ends.get(key) ?? []).find((index) => !used[index]);
  const lines = [];
  segments.forEach((segment, start) => {
    if (used[start]) return;
    used[start] = 1;
    const line = [...segment];
    for (let grow = 0; grow < 2; grow += 1) {
      for (;;) {
        const [tailKey] = line[line.length - 1];
        const index = next(tailKey);
        if (index === undefined) break;
        used[index] = 1;
        const [a, b] = segments[index];
        line.push(a[0] === tailKey ? b : a);
      }
      line.reverse();
    }
    lines.push(line.map(([, point]) => point));
  });
  return lines;
}

const strokeLength = (run) =>
  run.reduce(
    (sum, p, i) =>
      i ? sum + Math.hypot(p.x - run[i - 1].x, p.y - run[i - 1].y) : 0,
    0
  );

// Polylines of world points → screen runs, sampled about every 1.5 px and
// cut wherever a sample leaves the frame, is hidden (`visible`) or, for
// edge-like strokes, sits on the silhouette the outline layer draws.
export function traceRuns(
  lines,
  { height, hidden, minLength, project, width }
) {
  const runs = [];
  lines.forEach((line) => {
    let run = [];
    const flush = () => {
      if (run.length > 1) {
        const simple = simplifyLoop(
          run.map((p) => [p.x, p.y]),
          0.2
        ).map(([x, y]) => ({ x, y }));
        if (strokeLength(simple) >= minLength) runs.push(simple);
      }
      run = [];
    };
    const visit = (point) => {
      const p = project(...point);
      const shown =
        p.depth > 0 &&
        p.x >= -1 &&
        p.y >= -1 &&
        p.x <= width + 1 &&
        p.y <= height + 1 &&
        !hidden(p);
      if (shown) run.push(p);
      else flush();
    };
    for (let i = 0; i < line.length - 1; i += 1) {
      const a = line[i];
      const b = line[i + 1];
      const pa = project(...a);
      const pb = project(...b);
      const steps = Math.max(
        1,
        Math.ceil(Math.hypot(pb.x - pa.x, pb.y - pa.y) / SAMPLE_PX)
      );
      for (let s = i === 0 ? 0 : 1; s <= steps; s += 1) {
        const t = s / steps;
        visit([
          a[0] + (b[0] - a[0]) * t,
          a[1] + (b[1] - a[1]) * t,
          a[2] + (b[2] - a[2]) * t,
        ]);
      }
    }
    flush();
  });
  return runs;
}
