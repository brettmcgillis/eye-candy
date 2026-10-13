import { fieldFromConfig } from '@modules/trucheterieBlob';

import buildChains from './chains';
import liftCrossings from './crossings';
import {
  beadTarget,
  pieceTargets,
  slopeEnvelope,
  smoothAlongChains,
} from './heights';
import { WEAVE_MAX_THICKNESS } from './renderOptions.mjs';
import taperOpenEnds, { contactZones, isJoint } from './retract';
import flattenSamples, {
  alongDistance,
  createSpatialHash,
  maxRadius,
} from './samples';
import buildStrands from './strands';

const FRONT_SHARE = 0.6;

export function tubeRadii({
  blobPathsPerUnit,
  junction,
  strands,
  tubeThickness,
  wireThickness,
}) {
  const half = 0.5 / blobPathsPerUnit;
  const wire = half * wireThickness;
  const thickness =
    junction === 'weave'
      ? Math.min(tubeThickness, WEAVE_MAX_THICKNESS)
      : tubeThickness;
  const lane = (strands === 'both' ? half - wire : half) * thickness;
  return { lane, wire };
}

function growthTimes(samples, runs, delays, cellOfSample) {
  const grow = new Float32Array(samples.total);
  const origins = runs.map((run) => {
    let best = run.head;
    for (let i = run.head; i <= run.tail; i += 1) {
      if (delays[cellOfSample(i)] < delays[cellOfSample(best)]) best = i;
    }
    return best;
  });
  const reach = (run, i, origin) => {
    const d = Math.abs(samples.s[i] - samples.s[origin]);
    return run.loop ? Math.min(d, run.length - d) : d;
  };
  let farthest = 1e-6;
  runs.forEach((run, c) => {
    for (let i = run.head; i <= run.tail; i += 1) {
      farthest = Math.max(farthest, reach(run, i, origins[c]));
    }
  });
  runs.forEach((run, c) => {
    const start = delays[cellOfSample(origins[c])] * FRONT_SHARE;
    for (let i = run.head; i <= run.tail; i += 1) {
      grow[i] =
        start + (1 - FRONT_SHARE) * (reach(run, i, origins[c]) / farthest);
    }
  });
  return grow;
}

// A stroke takes the mean height of the lanes either side of it (those of
// its own family within just over half a pitch, weighted by nearness),
// smoothed along it.
function followLanes(samples, pieces, pitch) {
  const { alive, chainOf, pieceOf, runs, x, y, z } = samples;
  const familyOf = (i) => {
    const piece = pieces[pieceOf[i]];
    return piece ? `${piece.cell}:${piece.slot}` : null;
  };
  const reaches = [pitch * 0.58, pitch * 1.1];
  const query = createSpatialHash(samples, reaches[1]);
  const next = Float64Array.from(z);
  const laneMean = (i, reach, family) => {
    let sum = 0;
    let weight = 0;
    query(x[i], y[i], reach, (j) => {
      if (!alive[j] || runs[chainOf[j]].kind !== 'lane') return;
      if (family && familyOf(j) !== family) return;
      const d = Math.hypot(x[i] - x[j], y[i] - y[j]);
      if (d > reach) return;
      const w = 1 / (d + pitch * 0.05);
      sum += z[j] * w;
      weight += w;
    });
    return weight > 0 ? sum / weight : null;
  };
  runs.forEach((run) => {
    if (run.kind !== 'wire' || run.dropped) return;
    for (let i = run.head; i <= run.tail; i += 1) {
      // A short stroke tucked into a grid corner can sit just beyond half
      // a pitch from every lane, so the search widens before it gives up.
      // Its own family's lanes first: at a weave crossing the other
      // family's lanes pass right over (or under) it and must not drag it.
      const family = familyOf(i);
      const mean =
        laneMean(i, reaches[0], family) ??
        laneMean(i, reaches[1], family) ??
        laneMean(i, reaches[0], null) ??
        laneMean(i, reaches[1], null);
      if (mean != null) next[i] = mean;
    }
  });
  const smoothed = smoothAlongChains(samples, next, pitch);
  runs.forEach((run) => {
    if (run.kind !== 'wire' || run.dropped) return;
    for (let i = run.head; i <= run.tail; i += 1) z[i] = smoothed[i];
  });
}

// Where a strand stops against another — a lane cut by a T-junction, a
// welded stroke — its end is eased onto the height of what it meets, so a
// joint stays a joint whatever the heights did to either side. The target
// is the first family of the end's own cell (what occluded it in 2D); on a
// flat piece a corner weld also eases onto the stroke it grazes. The ease is
// never steeper than maxSlope.
function snapEnds(samples, pieces, { flat, kind, maxSlope, ramp }) {
  const { chainOf, height, pieceOf, runs, x, y, z } = samples;
  const query = createSpatialHash(
    samples,
    Math.max(maxRadius(samples) * 4, 1e-3)
  );
  runs.forEach((run, c) => {
    if (!run.ends || run.dropped || run.kind !== kind) return;
    [0, 1].forEach((side) => {
      const type = run.ends[side];
      if (type !== 'weld' && type !== 'cut') return;
      const end = side === 0 ? run.head : run.tail;
      const own = pieces[pieceOf[end]];
      let target = -1;
      let best = Infinity;
      let fallback = -1;
      let fallbackBest = Infinity;
      query(x[end], y[end], height[end] * 4, (k) => {
        if (chainOf[k] === c || pieceOf[k] < 0) return;
        const d = Math.hypot(x[k] - x[end], y[k] - y[end]);
        const other = pieces[pieceOf[k]];
        if (other.cell === own.cell && other.slot !== own.slot && d < best) {
          best = d;
          target = k;
        }
        if (runs[chainOf[k]].kind === 'wire' && d < fallbackBest) {
          fallbackBest = d;
          fallback = k;
        }
      });
      // A corner weld only grazes a neighbour's stroke; across a terrace
      // step that is a step, not a joint to drag the stroke off its lanes.
      const met = target >= 0 || kind === 'lane' ? target : fallback;
      if (met < 0 || (target < 0 && !flat)) return;
      const shift = z[met] - z[end];
      if (Math.abs(shift) < 1e-9) return;
      const length = Math.max(ramp, Math.abs(shift) / maxSlope, 1e-6);
      for (let k = run.head; k <= run.tail; k += 1) {
        const t = alongDistance(samples, k, end) / length;
        if (t < 1) z[k] += shift * (1 - t * t * (3 - 2 * t));
      }
    });
  });
}

function cellLookup(field, gridSize) {
  const owner = new Int32Array(gridSize * gridSize).fill(-1);
  field.cells.forEach(({ cell }, index) => {
    for (let c = cell.column; c < cell.column + cell.size; c += 1) {
      for (let r = cell.row; r < cell.row + cell.size; r += 1) {
        if (c >= 0 && r >= 0 && c < gridSize && r < gridSize) {
          owner[r * gridSize + c] = index;
        }
      }
    }
  });
  return (x, y) => {
    const c = Math.floor(x);
    const r = Math.floor(y);
    if (c < 0 || r < 0 || c >= gridSize || r >= gridSize) return -1;
    return owner[r * gridSize + c];
  };
}

function chainCells(samples, runs, pieces) {
  return runs.map((run) => {
    const cells = new Map();
    for (let i = run.start; i < run.start + run.count; i += 1) {
      const p = samples.pieceOf[i];
      if (p >= 0 && !cells.has(pieces[p].cell)) {
        cells.set(pieces[p].cell, pieces[p].slot);
      }
    }
    return cells;
  });
}

// The blob field as tube centrelines in grid units (x right, y down, z up;
// one micro-cell = 1). Every strand is either a loop or an open chain whose
// ends take hemispherical caps, and no two tubes come closer than their
// radii allow — see plans/trucheterie3d.md for why that holds.
export default function buildTubes(field, config) {
  const pathDiv = config.blobPathsPerUnit;
  const pitch = 1 / pathDiv;
  const tolerance = pitch * 1e-5;
  const radii = tubeRadii(config);
  const strands = buildStrands(field, { junction: config.junction, pathDiv });
  const keep = (kind) =>
    config.strands === 'both' || config.strands === `${kind}s`;
  const pieces = strands.pieces.filter((piece) => keep(piece.kind));
  const dots = keep('lane') ? strands.dots : [];

  const chained = buildChains({ dots, pieces }, { pathDiv });
  const samples = flattenSamples(chained, (kind) =>
    kind === 'wire' ? radii.wire : radii.lane
  );
  const targets = pieceTargets(pieces, field.cells, config);
  samples.runs.forEach((run) => {
    for (let i = run.start; i < run.start + run.count; i += 1) {
      samples.z[i] = run.bead
        ? beadTarget(run.bead, field.cells, config)
        : targets[samples.pieceOf[i]];
    }
  });
  samples.z = smoothAlongChains(
    samples,
    slopeEnvelope(samples, samples.z, config.maxSlope, config.heightScale),
    config.rampLength * pitch
  );

  const fuse = config.strands === 'both';
  const retraction = taperOpenEnds(samples, { fuse, tolerance });
  const zone = contactZones(samples, { fuse, tolerance });
  const kindOf = (i) => samples.runs[samples.chainOf[i]].kind;
  const isWire = (i) => kindOf(i) === 'wire';

  const { gridSize } = field;
  const solve = {
    cellAt: cellLookup(field, gridSize),
    cellSlots: chainCells(samples, samples.runs, pieces),
    exempt: (i, j) => isJoint(samples, zone, i, j),
    margin: pitch * 0.02,
    pieces,
    rampSamples: (config.rampLength * pitch) / chained.spacing,
    tolerance,
  };
  const apply = (lift) => {
    for (let i = 0; i < samples.total; i += 1) samples.z[i] += lift[i];
  };

  // Lanes first; strokes then take the height of the lanes they border, so
  // a stroke dips with its lane under a weave rather than staying on top;
  // last, strokes alone are nudged clear of anything left, lanes pinned.
  const ramp = config.rampLength * pitch;
  const maxSlope = config.heightMode === 'flat' ? Infinity : config.maxSlope;
  const flat = config.heightMode === 'flat';
  snapEnds(samples, pieces, { flat, kind: 'lane', maxSlope, ramp });
  const lanes = liftCrossings(samples, {
    ...solve,
    include: (i, j) => !isWire(i) && !isWire(j),
  });
  apply(lanes.lift);
  // With lanes, strokes take their lanes' heights (the lanes' ends are
  // already snapped); alone, strokes snap their own welds.
  if (fuse) followLanes(samples, pieces, pitch);
  else snapEnds(samples, pieces, { flat, kind: 'wire', maxSlope, ramp });
  const strokes = liftCrossings(samples, {
    ...solve,
    include: (i, j) => isWire(i) || isWire(j),
    movable: isWire,
  });
  apply(strokes.lift);
  const crossings = lanes.crossings + strokes.crossings;

  const cellOfSample = (i) => {
    const p = samples.pieceOf[i];
    return p >= 0 ? pieces[p].cell : samples.runs[samples.chainOf[i]].bead.cell;
  };
  const live = samples.runs.filter(
    (run) => !run.dropped && run.tail >= run.head
  );
  const grow = growthTimes(samples, live, field.delays, cellOfSample);

  const chains = live.map((run) => {
    const n = run.tail - run.head + 1;
    const points = new Float32Array(n * 3);
    const u = new Float32Array(n);
    const cell = new Int32Array(n);
    const slot = new Int8Array(n);
    const lane = new Int16Array(n);
    const growAt = new Float32Array(n);
    const radius = new Float32Array(n);
    const contact = new Uint8Array(n);
    for (let k = 0; k < n; k += 1) {
      const i = run.head + k;
      const piece = pieces[samples.pieceOf[i]] ?? run.bead;
      points.set([samples.x[i], samples.y[i], samples.z[i]], k * 3);
      u[k] = samples.u[i];
      cell[k] = piece.cell;
      slot[k] = piece.slot;
      lane[k] = piece.index;
      growAt[k] = grow[i];
      radius[k] = samples.radius[i];
      contact[k] = zone[i];
    }
    const whole =
      run.head === run.start && run.tail === run.start + run.count - 1;
    return {
      cell,
      ends: run.ends,
      grow: growAt,
      trimmedEnds: [
        run.head !== run.start,
        run.tail !== run.start + run.count - 1,
      ],
      kind: run.kind,
      lane,
      loop: run.loop && whole,
      points,
      // `radius` is the tube's half-height; `radii` its plan half-width per
      // sample, narrower where an end tapers.
      radius: run.kind === 'wire' ? radii.wire : radii.lane,
      radii: radius,
      slot,
      u,
      zone: contact,
    };
  });

  return {
    chains,
    gridSize,
    pitch,
    radii,
    stats: {
      ambiguousJoins: chained.ambiguous,
      beads: chains.filter((c) => c.kind === 'bead').length,
      crossings,
      loops: chains.filter((c) => c.loop).length,
      openChains: chains.filter((c) => c.kind !== 'bead' && !c.loop).length,
      removedChains: retraction.removedChains,
      retractedSamples: retraction.retracted,
      taperedSamples: retraction.tapered,
      samples: chains.reduce((sum, c) => sum + c.points.length / 3, 0),
    },
  };
}

// The 2D blob field a scene-keyed config describes.
export function buildField(config) {
  return fieldFromConfig(config);
}
