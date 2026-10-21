import { chain, simplifyLoop, smooth } from './lines';

const round = (value) => Math.round(value * 100) / 100;

// Marching squares at `level` of a field over the unit square, as short
// segments in its coordinates. With `keep`, a cell counts only where every
// corner passes it.
export function isoSegments(fn, resolution, level, keep = null) {
  const n = resolution;
  const values = new Float32Array((n + 1) * (n + 1));
  const kept = new Uint8Array((n + 1) * (n + 1));
  for (let j = 0; j <= n; j += 1) {
    for (let i = 0; i <= n; i += 1) {
      values[j * (n + 1) + i] = fn(i / n, j / n);
      kept[j * (n + 1) + i] = !keep || keep(i / n, j / n) ? 1 : 0;
    }
  }
  const at = (i, j) => values[j * (n + 1) + i];
  const cross = (i0, j0, i1, j1) => {
    const a = at(i0, j0);
    const b = at(i1, j1);
    const t = (level - a) / (b - a);
    return [(i0 + (i1 - i0) * t) / n, (j0 + (j1 - j0) * t) / n];
  };
  const segments = [];
  for (let j = 0; j < n; j += 1) {
    for (let i = 0; i < n; i += 1) {
      const corners = [
        [i, j],
        [i + 1, j],
        [i + 1, j + 1],
        [i, j + 1],
      ];
      if (corners.every(([ci, cj]) => kept[cj * (n + 1) + ci])) {
        const hits = [];
        for (let e = 0; e < 4; e += 1) {
          const [a0, a1] = corners[e];
          const [b0, b1] = corners[(e + 1) % 4];
          if (at(a0, a1) > level !== at(b0, b1) > level) {
            hits.push(cross(a0, a1, b0, b1));
          }
        }
        if (hits.length === 2) segments.push(hits);
        if (hits.length === 4)
          segments.push([hits[0], hits[1]], [hits[2], hits[3]]);
      }
    }
  }
  return segments;
}

// Marching squares over a depth pass's coverage: the outline of the subject
// as the camera sees it, in mask pixels (cell corners at pixel centres).
export function maskSegments({ covered, height, width }) {
  const at = (x, y) => covered[y * width + x];
  const mid = (x0, y0, x1, y1) => [(x0 + x1) / 2 + 0.5, (y0 + y1) / 2 + 0.5];
  const segments = [];
  for (let y = 0; y < height - 1; y += 1) {
    for (let x = 0; x < width - 1; x += 1) {
      const corners = [
        [x, y],
        [x + 1, y],
        [x + 1, y + 1],
        [x, y + 1],
      ];
      const hits = [];
      for (let e = 0; e < 4; e += 1) {
        const [ax, ay] = corners[e];
        const [bx, by] = corners[(e + 1) % 4];
        if (at(ax, ay) !== at(bx, by)) hits.push(mid(ax, ay, bx, by));
      }
      if (hits.length === 2) segments.push(hits);
      if (hits.length === 4)
        segments.push([hits[0], hits[1]], [hits[2], hits[3]]);
    }
  }
  return segments;
}

export const pathOf = (runs) =>
  runs
    .map((run) => `M${run.map((p) => `${round(p.x)} ${round(p.y)}`).join('L')}`)
    .join('');

export const plotLayer = (index, label, stroke, d, color = '#000000') =>
  `<g inkscape:groupmode="layer" inkscape:label="pen-${index} ${label} ${color}" id="pen-${index}" ` +
  `fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">` +
  `<path d="${d}"/></g>`;

// The subject's outline as smoothed loops in output pixels.
export function silhouetteRuns(coverage, pixelRatio) {
  return chain(maskSegments(coverage)).map((loop) =>
    smooth(simplifyLoop(loop, 0.6)).map(([x, y]) => ({
      x: x / pixelRatio,
      y: y / pixelRatio,
    }))
  );
}

// Whether an output-pixel point is on the silhouette (an uncovered pixel
// within two of it), where the silhouette layer already draws.
export function nearSilhouette(coverage, pixelRatio) {
  return (x, y) => {
    const px = Math.round(x * pixelRatio);
    const py = Math.round(y * pixelRatio);
    for (let dy = -2; dy <= 2; dy += 1) {
      for (let dx = -2; dx <= 2; dx += 1) {
        const sx = px + dx;
        const sy = py + dy;
        if (
          sx < 0 ||
          sy < 0 ||
          sx >= coverage.width ||
          sy >= coverage.height ||
          !coverage.covered[sy * coverage.width + sx]
        ) {
          return true;
        }
      }
    }
    return false;
  };
}
