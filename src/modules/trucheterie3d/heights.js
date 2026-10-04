import { laneRadii } from '@modules/trucheterieBlob';

// Height targets per piece, then eased along each chain so a strand that
// crosses from ring 3 of a big cell into ring 1 of a small one ramps rather
// than steps. Heights are in grid units, like x and y.
//   flat    — every strand on one plane
//   terrace — each ring one step above the ring outside it (inner rings up,
//             so blobs read as stepped mounds)
function laneTarget(scale, pitch, piece, cellSize, pathDiv, lane) {
  const radii = laneRadii(piece.type, cellSize, pathDiv);
  const j = Math.min(Math.max(lane, 0), radii.length - 1);
  return scale * pitch * (radii.length - 1 - j);
}

function laneAt(radii, rho) {
  for (let j = 0; j < radii.length; j += 1) {
    if (rho >= radii[j][0] - 1e-9 && rho <= radii[j][1] + 1e-9) return j;
  }
  return -1;
}

export function pieceTargets(
  pieces,
  cells,
  { blobPathsPerUnit: pathDiv, heightMode, heightScale }
) {
  const pitch = 1 / pathDiv;
  return pieces.map((piece) => {
    if (heightMode === 'flat' || heightScale === 0) return 0;
    const { size } = cells[piece.cell].cell;
    const target = (lane) =>
      laneTarget(heightScale, pitch, piece, size, pathDiv, lane);
    if (piece.kind === 'lane') return target(piece.index);
    const radii = laneRadii(piece.type, size, pathDiv);
    const sides = [
      laneAt(radii, piece.radius - pitch / 2),
      laneAt(radii, piece.radius + pitch / 2),
    ].filter((j) => j >= 0);
    if (sides.length === 0) return 0;
    return sides.reduce((sum, j) => sum + target(j), 0) / sides.length;
  });
}

export function beadTarget(bead, cells, config) {
  return pieceTargets([{ ...bead, kind: 'lane' }], cells, config)[0];
}

// A triangle-kernel average along each chain, which turns a
// piecewise-constant target into a C1 ramp `halfWidth` long either side of
// every step. Weighted by sample spacing, since tight arcs sample densely.
export function smoothAlongChains(samples, values, halfWidth) {
  const out = Float64Array.from(values);
  if (halfWidth <= 0) return out;
  const { alive, runs, s } = samples;
  runs.forEach((run) => {
    const { count, length, loop, start } = run;
    if (count < 2) return;
    const index = (k) => start + (((k % count) + count) % count);
    const gap = (k) => {
      if (k >= 0 && k < count - 1) return s[start + k + 1] - s[start + k];
      if (!loop) return Infinity;
      if (k === count - 1 || k === -1) return length - s[start + count - 1];
      return s[index(k + 1)] - s[index(k)];
    };
    const spacing = (k) => {
      const before = k > 0 || loop ? gap(k - 1) : 0;
      const after = k < count - 1 || loop ? gap(k) : 0;
      return (Math.min(before, 1e9) + Math.min(after, 1e9)) / 2 || 1e-9;
    };
    const weights = Array.from({ length: count }, (_, k) => spacing(k));
    for (let a = 0; a < count; a += 1) {
      if (alive[start + a]) {
        let sum = values[start + a] * weights[a];
        let weight = weights[a];
        [-1, 1].forEach((dir) => {
          let d = 0;
          for (let step = 1; step < count; step += 1) {
            const k = a + dir * step;
            if (!loop && (k < 0 || k >= count)) break;
            d += gap(dir > 0 ? k - 1 : k);
            if (d >= halfWidth) break;
            // Retracted samples keep the height of where they were; they must
            // not pull on the live end they were cut back from.
            if (alive[index(k)]) {
              const w = (1 - d / halfWidth) * weights[index(k) - start];
              sum += values[index(k)] * w;
              weight += w;
            }
          }
        });
        out[start + a] = sum / weight;
      }
    }
  });
  return out;
}

// Caps how steeply a strand may climb: the upper envelope of cones of slope
// `maxSlope` stood on every target (lower envelope when heights point down),
// so peaks keep their height and the low side is lifted into a skirt rather
// than the strand jumping a cliff where it crosses into a taller blob.
export function slopeEnvelope(samples, values, maxSlope, direction) {
  const out = Float64Array.from(values);
  const sign = direction < 0 ? -1 : 1;
  const { runs, s } = samples;
  runs.forEach(({ count, length, loop, start }) => {
    if (count < 2) return;
    const relax = (i, j, gap) => {
      const reach = sign * out[j] - maxSlope * gap;
      if (reach > sign * out[i]) out[i] = sign * reach;
    };
    const rounds = loop ? 2 : 1;
    for (let round = 0; round < rounds; round += 1) {
      for (let k = 1; k < count; k += 1) {
        relax(start + k, start + k - 1, s[start + k] - s[start + k - 1]);
      }
      if (loop) relax(start, start + count - 1, length - s[start + count - 1]);
      for (let k = count - 2; k >= 0; k -= 1) {
        relax(start + k, start + k + 1, s[start + k + 1] - s[start + k]);
      }
      if (loop) relax(start + count - 1, start, length - s[start + count - 1]);
    }
  });
  return out;
}
