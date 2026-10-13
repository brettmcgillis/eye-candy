import { familySector, laneRadii } from '@modules/trucheterieBlob';

import buildChains from './chains';
import buildStrands, { SPAN, hiddenArcs, visibleIntervals } from './strands';

const TAU = Math.PI * 2;
const BEAD_COLUMNS = 24;
const CROWN_SMOOTHING = { lambda: 0.24, passes: 3 };

export const membraneActive = (config) =>
  config.lanesAs === 'membrane' && config.strands !== 'wires';

const narrower = (a, b) => {
  if (a.length === 0 || b.length === 0) return [];
  return a[0][1] - a[0][0] <= b[0][1] - b[0][0] ? a : b;
};

// A lane is only cut where the occluding disc covers its whole width: a rim
// that bites partway in leaves one notched lane, not two pieces, so the
// pieces here are wider than the tube solve's mid-radius ones.
function lanePieces(field, pathDiv) {
  const pieces = [];
  field.cells.forEach(({ cell, connections }, cellIndex) => {
    const [firstType, firstEdge] = connections[0];
    connections.forEach(([type, edge], slot) => {
      const occluder =
        slot === 1 ? familySector(cell, firstType, firstEdge) : null;
      const sector = familySector(cell, type, edge);
      const center = [sector.x, sector.y];
      const start = edge * (Math.PI / 2);
      const span = SPAN[type];
      laneRadii(type, cell.size, pathDiv).forEach(([r0, r1], index) => {
        if (r0 < 1e-9 && r1 - r0 < 0.75 / pathDiv && type !== 2) return;
        const hidden = occluder
          ? narrower(
              hiddenArcs(center, r0, occluder),
              hiddenArcs(center, r1, occluder)
            )
          : [];
        visibleIntervals(start, start + span, hidden).forEach(([a0, a1]) => {
          pieces.push({
            a0,
            a1,
            cell: cellIndex,
            center,
            edge,
            index,
            kind: 'lane',
            loop: type === 0 && !occluder,
            occluder,
            r0,
            r1,
            radius: (r0 + r1) / 2,
            slot,
            span,
            start,
            trimmed: [a0 > start + 1e-9, a1 < start + span - 1e-9],
            type,
          });
        });
      });
    });
  });
  return pieces;
}

// What of [r0, r1] along the ray at `angle` lies outside the occluder: the
// rim, where it crosses, becomes that side's seam.
function radialSpan(piece, angle) {
  const { occluder, r0, r1 } = piece;
  if (!occluder) return [r0, r1];
  const ox = occluder.x - piece.center[0];
  const oy = occluder.y - piece.center[1];
  const b = Math.cos(angle) * ox + Math.sin(angle) * oy;
  const disc = b * b - (ox * ox + oy * oy - occluder.rMax ** 2);
  if (disc <= 0) return [r0, r1];
  const t1 = b - Math.sqrt(disc);
  const t2 = b + Math.sqrt(disc);
  if (t2 <= r0 || t1 >= r1) return [r0, r1];
  if (t1 - r0 >= r1 - t2) return [r0, Math.max(r0, t1)];
  return [Math.min(r1, t2), r1];
}

// The side each piece is walked from, read off its samples' angles.
function walkDirections(chain) {
  const dir = new Map();
  chain.samples.forEach((sample, i) => {
    if (dir.has(sample.piece)) return;
    const next = chain.samples[i + 1];
    const prev = chain.samples[i - 1];
    if (next?.piece === sample.piece) {
      dir.set(sample.piece, Math.sign(next.angle - sample.angle) || 1);
    } else if (prev?.piece === sample.piece) {
      dir.set(sample.piece, Math.sign(sample.angle - prev.angle) || 1);
    } else {
      dir.set(sample.piece, 1);
    }
  });
  return dir;
}

function smoothPass(current, pinned, strips, rows, lambda) {
  const next = Float32Array.from(current);
  strips.forEach(({ base, cols, loop }) => {
    const at = (c, k) => {
      const col = loop ? (c + cols) % cols : c;
      if (col < 0 || col >= cols || k < 0 || k >= rows) return null;
      return current[base + col * rows + k];
    };
    for (let c = 0; c < cols; c += 1) {
      for (let k = 0; k < rows; k += 1) {
        const v = base + c * rows + k;
        if (!pinned[v]) {
          const around = [
            at(c - 1, k),
            at(c + 1, k),
            at(c, k - 1),
            at(c, k + 1),
            at(c + 1, k + 1),
            at(c - 1, k - 1),
          ].filter((w) => w != null);
          const mean = around.reduce((sum, w) => sum + w, 0) / around.length;
          next[v] = current[v] * (1 - lambda) + mean * lambda;
        }
      }
    }
  });
  return next;
}

const twice = (array) => {
  const out = new array.constructor(array.length * 2);
  out.set(array);
  out.set(array, array.length);
  return out;
};

// A balloon: a second skin under the first, every strip repeated with the
// same seams, so the two are sewn wherever the top is pinned. Vertex v of
// the top skin is v + count on the bottom.
function sewBelow(skin) {
  const count = skin.pinned.length;
  const strips = twice(skin.strips);
  for (let s = skin.strips.length / 4; s < strips.length / 4; s += 1) {
    strips[s * 4] += count;
  }
  const index = twice(skin.index);
  for (let t = skin.index.length; t < index.length; t += 1) index[t] += count;
  const weldMembers = twice(skin.weldMembers);
  for (let m = skin.weldMembers.length; m < weldMembers.length; m += 1) {
    weldMembers[m] += count;
  }
  const weldGroups = twice(skin.weldGroups);
  for (let g = skin.weldGroups.length; g < weldGroups.length; g += 2) {
    weldGroups[g] += skin.weldMembers.length;
  }
  const side = new Uint8Array(count * 2).fill(1, count);
  return {
    ...skin,
    crown: twice(skin.crown),
    index,
    pinned: twice(skin.pinned),
    rest: twice(skin.rest),
    sampleOf: twice(skin.sampleOf),
    side,
    stats: {
      ...skin.stats,
      pinned: skin.stats.pinned * 2,
      strips: skin.stats.strips * 2,
      vertices: count * 2,
      welds: skin.stats.welds * 2,
    },
    strips,
    weldGroups,
    weldMembers,
  };
}

// The lanes as one quilted skin: a structured strip per lane chain whose
// rows run across the lane between the seams that bound it there (its two
// strokes, or the rim of the family it stops against), so the seams are the
// 2D strokes exactly. Grid units, y down, flat. Vertex v of a strip is
// base + column·rows + row; column c is chain sample `sampleOf[v]`. Rows
// are laid on one side of every strip, so the triangles all wind alike.
export default function buildMembrane(field, config) {
  const pathDiv = config.blobPathsPerUnit;
  const pitch = 1 / pathDiv;
  const across = Math.max(2, Math.round(config.membraneRows));
  const rows = across + 1;
  const pieces = lanePieces(field, pathDiv);
  const { dots } = buildStrands(field, { junction: 'cap', pathDiv });
  const chained = buildChains({ dots, pieces }, { pathDiv });

  const layouts = [
    ...chained.chains
      .filter((chain) => chain.samples.length >= 2)
      .map((chain) => ({
        chain,
        cols: chain.samples.length,
        loop: chain.loop,
      })),
    ...chained.beads.map((bead) => ({ bead, cols: BEAD_COLUMNS, loop: true })),
  ];

  const total = layouts.reduce((sum, { cols }) => sum + cols * rows, 0);
  const rest = new Float32Array(total * 2);
  const pinned = new Uint8Array(total);
  const along = new Float32Array(total);
  const seamDistance = new Float32Array(total);
  const sampleOf = new Uint32Array(total);
  const strips = [];
  const chains = [];
  const welds = [];
  let base = 0;
  let samples = 0;

  layouts.forEach(({ bead, chain, cols, loop }) => {
    const cell = new Int32Array(cols);
    const slot = new Int8Array(cols);
    const lane = new Int16Array(cols);
    const u = new Float32Array(cols);
    const points = new Float32Array(cols * 3);
    const pivots = [];
    const column = (c, center, angle, [lo, hi], sign, s) => {
      for (let k = 0; k < rows; k += 1) {
        const t = k / across;
        const r = sign > 0 ? lo + (hi - lo) * t : hi - (hi - lo) * t;
        const v = base + c * rows + k;
        rest[v * 2] = center[0] + r * Math.cos(angle);
        rest[v * 2 + 1] = center[1] + r * Math.sin(angle);
        pinned[v] = r > 1e-9 && (k === 0 || k === across) ? 1 : 0;
        if (r <= 1e-9) pivots.push(v);
        seamDistance[v] = Math.min(lo > 1e-9 ? r - lo : Infinity, hi - r);
        along[v] = s;
        sampleOf[v] = samples + c;
      }
    };

    let length = 0;
    let pivotOnly = true;
    if (bead) {
      for (let c = 0; c < cols; c += 1) {
        cell[c] = bead.cell;
        slot[c] = bead.slot;
        lane[c] = bead.index;
        u[c] = 0.5;
        points.set([bead.at[0], bead.at[1], 0], c * 3);
        column(c, bead.at, (-c / cols) * TAU, [0, pitch / 2], 1, 0);
      }
    } else {
      const dir = walkDirections(chain);
      chain.samples.forEach((sample, c) => {
        if (c > 0) {
          const prev = chain.samples[c - 1];
          length += Math.hypot(sample.x - prev.x, sample.y - prev.y);
        }
        const piece = pieces[sample.piece];
        pivotOnly = pivotOnly && piece.r0 < 1e-9;
        cell[c] = piece.cell;
        slot[c] = piece.slot;
        lane[c] = piece.index;
        u[c] = sample.u;
        points.set([sample.x, sample.y, 0], c * 3);
        column(
          c,
          piece.center,
          sample.angle,
          radialSpan(piece, sample.angle),
          -dir.get(sample.piece),
          length
        );
      });
      if (!loop) {
        for (let k = 0; k < rows; k += 1) {
          pinned[base + k] = 1;
          pinned[base + (cols - 1) * rows + k] = 1;
        }
      }
    }

    // A lane wrapping a grid corner pivots on a point. Unless the wrap is a
    // whole disc, a stroke ends on that point, so it is a seam; a whole
    // disc's centre is one free vertex split across the columns, welded.
    if (loop && pivotOnly) welds.push(pivots);
    else
      pivots.forEach((v) => {
        pinned[v] = 1;
      });

    strips.push({ base, cols, length, loop });
    chains.push({
      cell,
      kind: 'lane',
      lane,
      loop,
      points,
      radius: pitch / 2,
      slot,
      u,
    });
    base += cols * rows;
    samples += cols;
  });

  const crownRaw = new Float32Array(total);
  let farthest = 1e-9;
  strips.forEach((strip) => {
    for (let v = strip.base; v < strip.base + strip.cols * rows; v += 1) {
      if (!pinned[v]) {
        const s = along[v];
        const d = strip.loop
          ? seamDistance[v]
          : Math.min(seamDistance[v], s, strip.length - s);
        crownRaw[v] = d;
        farthest = Math.max(farthest, d);
      }
    }
  });
  for (let v = 0; v < total; v += 1) {
    crownRaw[v] = Math.min(1, crownRaw[v] / farthest);
  }
  let crown = crownRaw;
  for (let pass = 0; pass < CROWN_SMOOTHING.passes; pass += 1) {
    crown = smoothPass(crown, pinned, strips, rows, CROWN_SMOOTHING.lambda);
  }

  const quads = strips.reduce(
    (sum, { cols, loop }) => sum + (loop ? cols : cols - 1) * across,
    0
  );
  const index = new Uint32Array(quads * 6);
  let t = 0;
  strips.forEach((strip) => {
    const last = strip.loop ? strip.cols : strip.cols - 1;
    for (let c = 0; c < last; c += 1) {
      const next = (c + 1) % strip.cols;
      for (let k = 0; k < across; k += 1) {
        const a = strip.base + c * rows + k;
        const b = strip.base + next * rows + k;
        index.set([a, a + 1, b + 1, a, b + 1, b], t);
        t += 6;
      }
    }
  });

  const table = new Float32Array(strips.length * 4);
  strips.forEach((strip, s) => {
    table.set([strip.base, strip.cols, rows, strip.loop ? 1 : 0], s * 4);
  });

  const weldMembers = new Uint32Array(welds.flat());
  const weldGroups = new Float32Array(welds.length * 2);
  let member = 0;
  welds.forEach((group, g) => {
    weldGroups.set([member, group.length], g * 2);
    member += group.length;
  });

  const skin = {
    chains,
    crown,
    gridSize: field.gridSize,
    index,
    pinned,
    pitch,
    rest,
    rows,
    sampleOf,
    samples,
    strips: table,
    weldGroups,
    weldMembers,
    stats: {
      beads: chained.beads.length,
      welds: welds.length,
      pinned: pinned.reduce((sum, p) => sum + p, 0),
      strips: strips.length,
      vertices: total,
    },
    side: new Uint8Array(total),
  };
  return config.membraneSides === 'double' ? sewBelow(skin) : skin;
}
