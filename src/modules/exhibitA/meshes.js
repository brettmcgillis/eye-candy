import { TAU, cross3, dot3, len3, normalize3, scale3, sub3 } from './math';

// Mesh exhibits arrive at the renderer as plain typed arrays, one part per
// material role. Every vertex carries, besides position and normal:
//   center     where it shrinks to while the exhibit is drawn in (the tube's
//              axis, or the vertex itself for a shell)
//   reveal     0..1, when the draw reaches it
//   structure  0..1, the palette's structure coordinate
function createPartBuilder() {
  const positions = [];
  const normals = [];
  const centers = [];
  const reveal = [];
  const structure = [];
  const indices = [];

  return {
    get vertexCount() {
      return reveal.length;
    },
    vertex(p, n, c, r, s) {
      positions.push(p[0], p[1], p[2]);
      normals.push(n[0], n[1], n[2]);
      centers.push(c[0], c[1], c[2]);
      reveal.push(r);
      structure.push(s);
      return reveal.length - 1;
    },
    triangle(a, b, c) {
      indices.push(a, b, c);
    },
    build() {
      return {
        centers: new Float32Array(centers),
        indices: new Uint32Array(indices),
        normals: new Float32Array(normals),
        positions: new Float32Array(positions),
        reveal: new Float32Array(reveal),
        structure: new Float32Array(structure),
      };
    },
  };
}

function anyPerpendicular(t) {
  const axis = Math.abs(t[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  return normalize3(cross3(axis, t));
}

// Rotation-minimising frames by the double reflection method (Wang et al.
// 2008). A closed curve's leftover twist is spread along it so the seam
// matches.
function transportFrames(points, closed) {
  const count = points.length;
  const tangents = points.map((_, i) => {
    const prev = points[closed ? (i - 1 + count) % count : Math.max(i - 1, 0)];
    const next = points[closed ? (i + 1) % count : Math.min(i + 1, count - 1)];
    return normalize3(sub3(next, prev));
  });
  const normals = [anyPerpendicular(tangents[0])];
  for (let i = 0; i < count - 1; i += 1) {
    const v1 = sub3(points[i + 1], points[i]);
    const c1 = dot3(v1, v1) || 1e-12;
    const rL = sub3(normals[i], scale3(v1, (2 / c1) * dot3(v1, normals[i])));
    const tL = sub3(tangents[i], scale3(v1, (2 / c1) * dot3(v1, tangents[i])));
    const v2 = sub3(tangents[i + 1], tL);
    const c2 = dot3(v2, v2) || 1e-12;
    normals.push(normalize3(sub3(rL, scale3(v2, (2 / c2) * dot3(v2, rL)))));
  }
  if (closed && count > 2) {
    const last = normals[count - 1];
    const first = normals[0];
    const b = cross3(tangents[0], first);
    const twist = Math.atan2(dot3(last, b), dot3(last, first));
    normals.forEach((n, i) => {
      const angle = (-twist * i) / count;
      const t = tangents[i];
      const bn = cross3(t, n);
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      normals[i] = normalize3([
        n[0] * c + bn[0] * s,
        n[1] * c + bn[1] * s,
        n[2] * c + bn[2] * s,
      ]);
    });
  }
  return { normals, tangents };
}

// Adds one swept tube. `reveal`/`structure` (and `radius`, if an array) are
// per point; an open tube gets rounded caps.
export function addTube(
  builder,
  points,
  { caps = true, closed = false, radius, radialSegments = 8, reveal, structure }
) {
  const count = points.length;
  if (count < 2) return;
  const { normals, tangents } = transportFrames(points, closed);
  const radiusAt = (i) => (typeof radius === 'number' ? radius : radius[i]);
  const ring = (center, n, t, r, rv, st) => {
    const b = cross3(t, n);
    const start = builder.vertexCount;
    for (let j = 0; j <= radialSegments; j += 1) {
      const a = (j / radialSegments) * TAU;
      const dir = [
        n[0] * Math.cos(a) + b[0] * Math.sin(a),
        n[1] * Math.cos(a) + b[1] * Math.sin(a),
        n[2] * Math.cos(a) + b[2] * Math.sin(a),
      ];
      builder.vertex(
        [
          center[0] + dir[0] * r,
          center[1] + dir[1] * r,
          center[2] + dir[2] * r,
        ],
        dir,
        center,
        rv,
        st
      );
    }
    return start;
  };
  const stitch = (a, b) => {
    for (let j = 0; j < radialSegments; j += 1) {
      builder.triangle(a + j, b + j, a + j + 1);
      builder.triangle(b + j, b + j + 1, a + j + 1);
    }
  };
  const cap = (index, direction) => {
    const center = points[index];
    const n = normals[index];
    const t = scale3(tangents[index], direction);
    const rv = reveal[index];
    const st = structure[index];
    let previous = null;
    const steps = 3;
    for (let k = 0; k <= steps; k += 1) {
      const angle = (k / steps) * (Math.PI / 2);
      const r = radiusAt(index) * Math.cos(angle);
      const lift = radiusAt(index) * Math.sin(angle);
      const c = [
        center[0] + t[0] * lift,
        center[1] + t[1] * lift,
        center[2] + t[2] * lift,
      ];
      const b = cross3(tangents[index], n);
      const start = builder.vertexCount;
      for (let j = 0; j <= radialSegments; j += 1) {
        const a = (j / radialSegments) * TAU;
        const radial = [
          n[0] * Math.cos(a) + b[0] * Math.sin(a),
          n[1] * Math.cos(a) + b[1] * Math.sin(a),
          n[2] * Math.cos(a) + b[2] * Math.sin(a),
        ];
        const normal = normalize3([
          radial[0] * Math.cos(angle) + t[0] * Math.sin(angle),
          radial[1] * Math.cos(angle) + t[1] * Math.sin(angle),
          radial[2] * Math.cos(angle) + t[2] * Math.sin(angle),
        ]);
        builder.vertex(
          [c[0] + radial[0] * r, c[1] + radial[1] * r, c[2] + radial[2] * r],
          normal,
          center,
          rv,
          st
        );
      }
      if (previous !== null) {
        if (direction > 0) stitch(previous, start);
        else stitch(start, previous);
      }
      previous = start;
    }
  };

  const first = ring(
    points[0],
    normals[0],
    tangents[0],
    radiusAt(0),
    reveal[0],
    structure[0]
  );
  let previous = first;
  for (let i = 1; i < count; i += 1) {
    const current = ring(
      points[i],
      normals[i],
      tangents[i],
      radiusAt(i),
      reveal[i],
      structure[i]
    );
    stitch(previous, current);
    previous = current;
  }
  if (closed) {
    stitch(previous, first);
  } else if (caps) {
    cap(count - 1, 1);
    cap(0, -1);
  }
}

export function addSphere(
  builder,
  center,
  radius,
  { reveal = 0, segments = 10, structure = 0 } = {}
) {
  const rows = Math.max(4, Math.round(segments / 2));
  const start = builder.vertexCount;
  for (let i = 0; i <= rows; i += 1) {
    const theta = (i / rows) * Math.PI;
    for (let j = 0; j <= segments; j += 1) {
      const phi = (j / segments) * TAU;
      const n = [
        Math.sin(theta) * Math.cos(phi),
        Math.cos(theta),
        Math.sin(theta) * Math.sin(phi),
      ];
      builder.vertex(
        [
          center[0] + n[0] * radius,
          center[1] + n[1] * radius,
          center[2] + n[2] * radius,
        ],
        n,
        center,
        reveal,
        structure
      );
    }
  }
  const stride = segments + 1;
  for (let i = 0; i < rows; i += 1) {
    for (let j = 0; j < segments; j += 1) {
      const a = start + i * stride + j;
      const b = a + stride;
      builder.triangle(a, b, a + 1);
      builder.triangle(b, b + 1, a + 1);
    }
  }
}

// A parametric surface thickened into a shell: the surface offset by ±wall/2
// along its normal, and open edges closed by a rim (`rimU`/`rimV` name which
// of each pair of parameter edges is open), so it is a solid. Normals
// come from the parameter derivatives, so a non-orientable surface's flip at
// its seam lands the two offsets on each other instead of tearing.
export function addShell(
  builder,
  surface,
  { rimU = [true, true], rimV = [true, true], segU, segV, u0, u1, v0, v1, wall }
) {
  const h = 1e-4;
  const sample = (u, v) => {
    const p = surface(u, v);
    const du = sub3(
      surface(u + h * (u1 - u0), v),
      surface(u - h * (u1 - u0), v)
    );
    const dv = sub3(
      surface(u, v + h * (v1 - v0)),
      surface(u, v - h * (v1 - v0))
    );
    let n = cross3(du, dv);
    if (len3(n) < 1e-14) {
      const du2 = sub3(
        surface(u + 4 * h * (u1 - u0), v),
        surface(u - 4 * h * (u1 - u0), v)
      );
      const dv2 = sub3(
        surface(u, v + 4 * h * (v1 - v0)),
        surface(u, v - 4 * h * (v1 - v0))
      );
      n = cross3(du2, dv2);
    }
    return { n: normalize3(n), p };
  };

  const grid = [];
  for (let i = 0; i <= segU; i += 1) {
    const row = [];
    const u = u0 + ((u1 - u0) * i) / segU;
    for (let j = 0; j <= segV; j += 1) {
      const v = v0 + ((v1 - v0) * j) / segV;
      row.push({ ...sample(u, v), s: i / segU });
    }
    grid.push(row);
  }

  const layers = [1, -1].map((side) => {
    const ids = grid.map((row) =>
      row.map(({ n, p, s }) => {
        const offset = scale3(n, (side * wall) / 2);
        const q = [p[0] + offset[0], p[1] + offset[1], p[2] + offset[2]];
        return builder.vertex(q, scale3(n, side), q, s, s);
      })
    );
    for (let i = 0; i < segU; i += 1) {
      for (let j = 0; j < segV; j += 1) {
        const a = ids[i][j];
        const b = ids[i + 1][j];
        const c = ids[i + 1][j + 1];
        const d = ids[i][j + 1];
        if (side > 0) {
          builder.triangle(a, b, c);
          builder.triangle(a, c, d);
        } else {
          builder.triangle(a, c, b);
          builder.triangle(a, d, c);
        }
      }
    }
    return ids;
  });

  // A rim strip along one open edge, its normal pointing out of the surface.
  const rim = (cells, outward) => {
    for (let k = 0; k < cells.length - 1; k += 1) {
      const [i0, j0] = cells[k];
      const [i1, j1] = cells[k + 1];
      const a = grid[i0][j0];
      const b = grid[i1][j1];
      const n = normalize3(outward(a, b));
      const make = (cell, side) => {
        const { n: sn, p, s } = grid[cell[0]][cell[1]];
        const offset = scale3(sn, (side * wall) / 2);
        const q = [p[0] + offset[0], p[1] + offset[1], p[2] + offset[2]];
        return builder.vertex(q, n, q, s, s);
      };
      const a0 = make(cells[k], 1);
      const a1 = make(cells[k], -1);
      const b0 = make(cells[k + 1], 1);
      const b1 = make(cells[k + 1], -1);
      builder.triangle(a0, a1, b1);
      builder.triangle(a0, b1, b0);
    }
  };
  const edgeOut = (a, b, inwardPoint) => {
    const along = sub3(b.p, a.p);
    const perp = cross3(along, a.n);
    const toward = sub3(inwardPoint, a.p);
    return dot3(perp, toward) > 0 ? scale3(perp, -1) : perp;
  };
  [0, segV]
    .filter((_, k) => rimV[k])
    .forEach((j) => {
      const inner = j === 0 ? 1 : segV - 1;
      const cells = grid.map((_, i) => [i, j]);
      rim(cells, (a, b) => {
        const i = grid.findIndex((row) => row[j] === a);
        return edgeOut(a, b, grid[Math.max(i, 0)][inner].p);
      });
    });
  [0, segU]
    .filter((_, k) => rimU[k])
    .forEach((i) => {
      const inner = i === 0 ? 1 : segU - 1;
      const cells = grid[i].map((_, j) => [i, j]);
      rim(cells, (a, b) => {
        const j = grid[i].indexOf(a);
        return edgeOut(a, b, grid[inner][Math.max(j, 0)].p);
      });
    });
  return layers;
}

export const createPart = createPartBuilder;

// Bounds of a set of parts' positions.
export function partBounds(parts) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  parts.forEach(({ positions }) => {
    for (let i = 0; i < positions.length; i += 3) {
      for (let a = 0; a < 3; a += 1) {
        min[a] = Math.min(min[a], positions[i + a]);
        max[a] = Math.max(max[a], positions[i + a]);
      }
    }
  });
  return { max, min };
}

// Scales and recentres raw points into the unit ball (by their furthest
// point from the bounding-box centre).
export function fitToUnitBall(polylines, margin = 1) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  polylines.forEach((line) =>
    line.forEach((p) => {
      for (let a = 0; a < 3; a += 1) {
        min[a] = Math.min(min[a], p[a]);
        max[a] = Math.max(max[a], p[a]);
      }
    })
  );
  const centre = [0, 1, 2].map((a) => (min[a] + max[a]) / 2);
  let reach = 1e-9;
  polylines.forEach((line) =>
    line.forEach((p) => {
      reach = Math.max(reach, len3(sub3(p, centre)));
    })
  );
  const k = margin / reach;
  return {
    centre,
    lines: polylines.map((line) =>
      line.map((p) => [
        (p[0] - centre[0]) * k,
        (p[1] - centre[1]) * k,
        (p[2] - centre[2]) * k,
      ])
    ),
    scale: k,
  };
}

// Arc-length resampling to `count` points, so a tube's rings are even.
export function resample(points, count, closed = false) {
  const path = closed ? [...points, points[0]] : points;
  const lengths = [0];
  for (let i = 1; i < path.length; i += 1) {
    lengths.push(lengths[i - 1] + len3(sub3(path[i], path[i - 1])));
  }
  const total = lengths[lengths.length - 1] || 1;
  const n = closed ? count : count - 1;
  const out = [];
  let k = 0;
  for (let i = 0; i < count; i += 1) {
    const target = (total * i) / n;
    while (k < lengths.length - 2 && lengths[k + 1] < target) k += 1;
    const span = lengths[k + 1] - lengths[k] || 1;
    const t = Math.min(Math.max((target - lengths[k]) / span, 0), 1);
    const a = path[k];
    const b = path[k + 1];
    out.push([
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
    ]);
  }
  return out;
}
