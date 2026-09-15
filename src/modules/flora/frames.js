import { perpendicular } from './vec';

function pickMainChildren(graph, tips) {
  const main = new Int32Array(graph.count).fill(-1);

  for (let i = 1; i < graph.count; i += 1) {
    const parent = graph.parent[i];

    if (main[parent] < 0 || tips[i] > tips[main[parent]]) {
      main[parent] = i;
    }
  }

  return main;
}

export default function buildFrames(graph, tips) {
  const n = graph.count;
  const tangent = new Float32Array(n * 3);
  const normal = new Float32Array(n * 3);
  const main = pickMainChildren(graph, tips);
  const dirTo = (a, b) => {
    const dx = graph.x[b] - graph.x[a];
    const dy = graph.y[b] - graph.y[a];
    const dz = graph.z[b] - graph.z[a];
    const l = Math.hypot(dx, dy, dz) || 1;

    return [dx / l, dy / l, dz / l];
  };

  for (let i = 0; i < n; i += 1) {
    const parent = graph.parent[i];
    const into = parent >= 0 ? dirTo(parent, i) : null;
    const out = main[i] >= 0 ? dirTo(i, main[i]) : null;
    let t = into || out || [0, 1, 0];

    if (into && out) {
      const sx = into[0] + out[0];
      const sy = into[1] + out[1];
      const sz = into[2] + out[2];
      const l = Math.hypot(sx, sy, sz);

      t = l > 1e-4 ? [sx / l, sy / l, sz / l] : into;
    }

    tangent.set(t, i * 3);

    let nx;
    let ny;
    let nz;

    if (parent >= 0) {
      const px = normal[parent * 3];
      const py = normal[parent * 3 + 1];
      const pz = normal[parent * 3 + 2];
      const d = px * t[0] + py * t[1] + pz * t[2];

      nx = px - t[0] * d;
      ny = py - t[1] * d;
      nz = pz - t[2] * d;
    }

    const l = parent >= 0 ? Math.hypot(nx, ny, nz) : 0;

    if (l < 1e-4) {
      normal.set(perpendicular(t), i * 3);
    } else {
      normal.set([nx / l, ny / l, nz / l], i * 3);
    }
  }

  return { normal, tangent };
}

export function octEncode(x, y, z, out, offset) {
  const s = Math.abs(x) + Math.abs(y) + Math.abs(z) || 1;
  let u = x / s;
  let v = y / s;

  if (z < 0) {
    const ou = u;

    u = (1 - Math.abs(v)) * (ou >= 0 ? 1 : -1);
    v = (1 - Math.abs(ou)) * (v >= 0 ? 1 : -1);
  }

  out[offset] = u; // eslint-disable-line no-param-reassign
  out[offset + 1] = v; // eslint-disable-line no-param-reassign
}
