import { triangleArea, vertexCount } from './mesh';

const DEG = Math.PI / 180;

// Rx then Rz, about the origin.
export function tiltPositions(positions, tiltX, tiltZ) {
  const cx = Math.cos(tiltX * DEG);
  const sx = Math.sin(tiltX * DEG);
  const cz = Math.cos(tiltZ * DEG);
  const sz = Math.sin(tiltZ * DEG);
  const out = new Float64Array(positions.length);
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y1 = cx * positions[i + 1] - sx * positions[i + 2];
    const z1 = sx * positions[i + 1] + cx * positions[i + 2];
    out[i] = cz * x - sz * y1;
    out[i + 1] = sz * x + cz * y1;
    out[i + 2] = z1;
  }
  return out;
}

function hullMargin(points, centre) {
  if (points.length < 3) return -Infinity;
  const sorted = [...points].sort((p, q) => p[0] - q[0] || p[1] - q[1]);
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
  const hull = [...half(sorted), ...half([...sorted].reverse())];
  if (hull.length < 3) return -Infinity;
  let margin = Infinity;
  hull.forEach((a, i) => {
    const b = hull[(i + 1) % hull.length];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    margin = Math.min(
      margin,
      ((b[0] - a[0]) * (centre[1] - a[1]) -
        (b[1] - a[1]) * (centre[0] - a[0])) /
        length
    );
  });
  return margin;
}

// Finds the gentlest tilt and shallowest trim at which the trimmed sheet
// stands: its area centroid (a thin shell's centre of mass) inside the
// footprint by `minMargin` mm. Tilts are tried outward from upright and trims
// upward from `minTrim`, so the first stance found changes the hang least.
export function levelHem(
  mesh,
  { maxTilt = 30, maxTrim = 40, minMargin = 3, minTrim = 1, step = 5 } = {}
) {
  const count = vertexCount(mesh);
  const { indices } = mesh;
  const weights = new Float64Array(count);
  const edgeSet = new Map();
  for (let t = 0; t < indices.length; t += 3) {
    const area =
      triangleArea(mesh.positions, indices[t], indices[t + 1], indices[t + 2]) /
      3;
    for (let k = 0; k < 3; k += 1) {
      const a = indices[t + k];
      const b = indices[t + ((k + 1) % 3)];
      weights[a] += area;
      edgeSet.set(Math.min(a, b) * count + Math.max(a, b), [a, b]);
    }
  }
  const edges = [...edgeSet.values()];

  const tilts = [];
  for (let x = -maxTilt; x <= maxTilt; x += step) {
    for (let z = -maxTilt; z <= maxTilt; z += step) tilts.push([x, z]);
  }
  tilts.sort((p, q) => Math.hypot(...p) - Math.hypot(...q));

  let best = null;
  tilts.forEach(([tiltX, tiltZ]) => {
    if (best && Math.hypot(tiltX, tiltZ) > Math.hypot(best.tiltX, best.tiltZ)) {
      return;
    }
    const tilted = tiltPositions(mesh.positions, tiltX, tiltZ);
    const y = (v) => tilted[v * 3 + 1];
    const byHeight = Array.from({ length: count }, (_, v) => v).sort(
      (a, b) => y(a) - y(b)
    );
    const minY = y(byHeight[0]);
    let total = 0;
    let tx = 0;
    let tz = 0;
    for (let v = 0; v < count; v += 1) {
      total += weights[v];
      tx += weights[v] * tilted[v * 3];
      tz += weights[v] * tilted[v * 3 + 2];
    }
    const lowEdges = edges
      .map(([a, b]) => [a, b, Math.min(y(a), y(b))])
      .sort((p, q) => p[2] - q[2]);

    let below = 0;
    let w = total;
    let cx = tx;
    let cz = tz;
    for (let trim = minTrim; trim <= maxTrim; trim += 1) {
      const cut = minY + trim;
      while (below < count && y(byHeight[below]) < cut) {
        const v = byHeight[below];
        w -= weights[v];
        cx -= weights[v] * tilted[v * 3];
        cz -= weights[v] * tilted[v * 3 + 2];
        below += 1;
      }
      // Where the sheet actually crosses the cut: those points are the feet.
      const ring = [];
      for (let e = 0; e < lowEdges.length && lowEdges[e][2] < cut; e += 1) {
        const [a, b] = lowEdges[e];
        const ya = y(a) - cut;
        const yb = y(b) - cut;
        if (ya < 0 !== yb < 0) {
          const f = ya / (ya - yb);
          ring.push([
            tilted[a * 3] + (tilted[b * 3] - tilted[a * 3]) * f,
            tilted[a * 3 + 2] + (tilted[b * 3 + 2] - tilted[a * 3 + 2]) * f,
          ]);
        }
      }
      const margin = w > 0 ? hullMargin(ring, [cx / w, cz / w]) : -Infinity;
      if (margin >= minMargin) {
        const better =
          !best ||
          Math.hypot(tiltX, tiltZ) < Math.hypot(best.tiltX, best.tiltZ) ||
          trim < best.trim;
        if (better) best = { margin, tiltX, tiltZ, trim };
        return;
      }
    }
  });
  return best;
}
