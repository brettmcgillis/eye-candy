/* eslint-disable no-param-reassign */
import {
  alongDistance,
  createSpatialHash,
  isNeighbour,
  maxRadius,
} from './samples';

// The narrowest a tapered end may get, as a share of its tube's width;
// anything that cannot fit even this is walked back instead.
const MIN_TAPER = 0.3;

// Zone codes: a stroke welded to the stroke it meets, and a lane fused into
// the outline stroke it stops against.
export const WELD = 1;
export const FUSE = 2;

const kindOf = (samples, i) => samples.runs[samples.chainOf[i]].kind;

// Where the 2D drawing stops one blob's lanes against another's, the lane
// narrows into the junction. Each open end is tapered — in width only, so a
// ribbon keeps its thickness and the end stays a rounded blade, never a
// spike — to the room it has: walking in from the end over its own half of
// the chain, every sample's half-width becomes the smallest plan clearance
// seen between it and the end, so the cap just touches what it meets. Where
// even a narrow tube will not fit, the end is walked back. Plan clearance
// is a lower bound on 3D clearance, so this holds at any height.
//   weld ends (strokes meeting strokes) only make room for lanes
//   fused lane ends (lanes + wires) may reach an outline stroke's centreline:
//   the lane butts into the stroke as the 2D lane does, half-embedded
export default function taperOpenEnds(samples, { fuse, tolerance }) {
  const reach = maxRadius(samples) * 2;
  const query = createSpatialHash(samples, Math.max(reach, 1e-3));
  const { alive, height, radius, runs, x, y } = samples;

  const clearance = (i, mode) => {
    let room = Infinity;
    query(x[i], y[i], reach, (j) => {
      if (j === i || isNeighbour(samples, i, j)) return;
      const wire = kindOf(samples, j) === 'wire';
      if (mode === 'weld' && wire) return;
      const extent = mode === 'fuse' && wire ? 0 : height[j];
      room = Math.min(
        room,
        Math.hypot(x[i] - x[j], y[i] - y[j]) - extent + tolerance
      );
    });
    return room;
  };

  let tapered = 0;
  let retracted = 0;
  let removedChains = 0;

  runs.forEach((run) => {
    run.head = run.start;
    run.tail = run.start + run.count - 1;
    if (!run.ends || run.count < 2) return;
    [0, 1].forEach((side) => {
      let mode = null;
      if (run.ends[side] === 'weld') mode = 'weld';
      else if (fuse && run.kind === 'lane' && run.ends[side] === 'cut') {
        mode = 'fuse';
      }
      const step = side === 0 ? 1 : -1;
      const end = side === 0 ? run.start : run.start + run.count - 1;
      const path = [];
      // Each end tapers only its own half: a sliver too thin for a full
      // tube anywhere would otherwise carry the far end's zero room back.
      const half = Math.floor((run.count - 1) / 2);
      for (let n = 0; n <= half; n += 1) {
        const k = end + step * n;
        const room = clearance(k, mode);
        if (room >= height[k]) break;
        path.push([k, room]);
      }
      let r = Infinity;
      for (let p = path.length - 1; p >= 0; p -= 1) {
        const [k, room] = path[p];
        r = Math.min(r, room, height[k]);
        if (r < height[k] * MIN_TAPER) {
          for (let q = p; q >= 0; q -= 1) {
            if (alive[path[q][0]]) {
              alive[path[q][0]] = 0;
              retracted += 1;
            }
          }
          break;
        }
        radius[k] = r;
        tapered += 1;
      }
    });
    while (run.head <= run.tail && !alive[run.head]) run.head += 1;
    while (run.tail >= run.head && !alive[run.tail]) run.tail -= 1;
    if (run.tail - run.head < 1) {
      for (let i = run.start; i < run.start + run.count; i += 1) alive[i] = 0;
      run.dropped = true;
      removedChains += 1;
    }
  });

  return { removedChains, retracted, tapered };
}

// Where strands are meant to touch: a welded stroke end against other
// strokes, a fused lane end against the outline stroke. A zone runs in from
// the end for as long as it is still in contact — a stem meeting an outline
// at a shallow angle runs alongside it for a while.
export function contactZones(samples, { fuse, tolerance }) {
  const { alive, chainOf, radius, runs, x, y } = samples;
  const reach = maxRadius(samples) * 2;
  const query = createSpatialHash(samples, Math.max(reach, 1e-3));
  const zone = new Uint8Array(samples.total);
  const touchingWire = (i) => {
    let hit = false;
    query(x[i], y[i], reach, (j) => {
      if (hit || j === i || runs[chainOf[j]].kind !== 'wire') return;
      if (isNeighbour(samples, i, j) || !alive[j]) return;
      const clear = radius[i] + radius[j] - tolerance;
      if (Math.hypot(x[i] - x[j], y[i] - y[j]) < clear) hit = true;
    });
    return hit;
  };
  runs.forEach((run) => {
    if (!run.ends || run.dropped) return;
    [0, 1].forEach((side) => {
      const weld = run.ends[side] === 'weld';
      const fused = fuse && run.kind === 'lane' && run.ends[side] === 'cut';
      if (!weld && !fused) return;
      const step = side === 0 ? 1 : -1;
      const end = side === 0 ? run.head : run.tail;
      for (let k = end; k >= run.head && k <= run.tail; k += step) {
        const near = alongDistance(samples, k, end) <= radius[end] * 2;
        if (!touchingWire(k) && !near) break;
        zone[k] = weld ? WELD : FUSE;
      }
    });
  });
  return zone;
}

// Whether a close pair is a joint rather than a collision: a welded stroke
// against anything it meets (its taper left it tangent to lanes, welded
// into strokes), a fused lane against the outline stroke.
export function isJoint(samples, zone, i, j) {
  const wireI = kindOf(samples, i) === 'wire';
  const wireJ = kindOf(samples, j) === 'wire';
  if ((wireI && zone[i] === WELD) || (wireJ && zone[j] === WELD)) return true;
  if (wireI !== wireJ) return zone[wireI ? j : i] === FUSE;
  return false;
}
