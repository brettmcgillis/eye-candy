import { pointAt } from './strands';

const TAU = Math.PI * 2;

const endAngle = (piece, end) => (end === 0 ? piece.a0 : piece.a1);

// Arcs only end on a cell edge at a multiple of π/2, where the radius runs
// along the edge and the arc crosses it square. Keyed on the crossing point
// plus the crossing direction, so two strands that meet at a cell corner
// heading different ways are never mistaken for one.
function endKey(kind, point, angle, pathDiv) {
  const axis = Math.abs(Math.cos(angle)) > 0.5 ? 'v' : 'h';
  const qx = Math.round(point[0] * 2 * pathDiv);
  const qy = Math.round(point[1] * 2 * pathDiv);
  return `${kind}:${axis}:${qx}:${qy}`;
}

function wedgeU(piece, angle) {
  if (piece.type === 0) return ((((angle + Math.PI) % TAU) + TAU) % TAU) / TAU;
  return Math.min(1, Math.max(0, (angle - piece.start) / piece.span));
}

function linkPieces(pieces, pathDiv) {
  const buckets = new Map();
  pieces.forEach((piece, id) => {
    if (piece.loop) return;
    [0, 1].forEach((end) => {
      if (piece.trimmed[end]) return;
      const angle = endAngle(piece, end);
      const key = endKey(
        piece.kind,
        pointAt(piece.center, piece.radius, angle),
        angle,
        pathDiv
      );
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(id * 2 + end);
    });
  });

  const links = new Int32Array(pieces.length * 2).fill(-1);
  let ambiguous = 0;
  buckets.forEach((members) => {
    if (members.length === 2) {
      const [a, b] = members;
      links[a] = b;
      links[b] = a;
    } else if (members.length > 2) {
      ambiguous += members.length;
    }
  });
  return { ambiguous, buckets, links };
}

// Three samples per lane width: what the retraction, the crossing solve and
// the separation check resolve against. The mesh decimates on its own.
const sampleSpacing = (pathDiv) => 0.375 / pathDiv;

// Walks every strand piece to piece and lays samples along it: chains that
// end (at a 2D termination, or a stub's dead end) and loops that close.
export default function buildChains({ dots, pieces }, { pathDiv }) {
  const { ambiguous, buckets, links } = linkPieces(pieces, pathDiv);
  const spacing = sampleSpacing(pathDiv);
  const visited = new Uint8Array(pieces.length);
  const chains = [];

  // A stroke never just stops in 2D: cut by a T-junction it stops on the
  // outline stroke it meets, and at a grid corner with no single partner
  // (crowded, or an outline arc ending tangent to the next cell's side) it
  // touches the strokes passing through that corner. Either way it welds
  // rather than capping short.
  const endType = (id, end) => {
    if (pieces[id].kind === 'wire') return 'weld';
    return pieces[id].trimmed[end] ? 'cut' : 'dead';
  };

  function walk(startId, startEnd) {
    const samples = [];
    const steps = [];
    let id = startId;
    let entry = startEnd;
    let closed = false;
    while (id >= 0) {
      if (visited[id]) {
        closed = true;
        break;
      }
      visited[id] = 1;
      steps.push([id, entry]);
      const piece = pieces[id];
      const from = endAngle(piece, entry);
      const to = endAngle(piece, 1 - entry);
      const step = Math.min(spacing, piece.radius * (Math.PI / 48));
      const n = Math.max(
        piece.loop ? 24 : 2,
        Math.ceil((piece.radius * Math.abs(to - from)) / step)
      );
      const last = piece.loop ? n - 1 : n;
      for (let i = samples.length === 0 ? 0 : 1; i <= last; i += 1) {
        const angle = from + ((to - from) * i) / n;
        const [x, y] = pointAt(piece.center, piece.radius, angle);
        samples.push({ angle, piece: id, u: wedgeU(piece, angle), x, y });
      }
      if (piece.loop) {
        closed = true;
        break;
      }
      const next = links[id * 2 + (1 - entry)];
      if (next < 0) break;
      id = Math.floor(next / 2);
      entry = next % 2;
      if (id === startId && entry === startEnd) {
        samples.pop();
        closed = true;
        break;
      }
    }
    const [firstId, firstEnd] = steps[0];
    const [lastId, lastEntry] = steps[steps.length - 1];
    return {
      ends: closed
        ? null
        : [endType(firstId, firstEnd), endType(lastId, 1 - lastEntry)],
      kind: pieces[startId].kind,
      loop: closed,
      samples,
    };
  }

  pieces.forEach((piece, id) => {
    if (visited[id] || piece.loop) return;
    [0, 1].forEach((end) => {
      if (!visited[id] && links[id * 2 + end] < 0) {
        chains.push(walk(id, end));
      }
    });
  });
  pieces.forEach((piece, id) => {
    if (!visited[id]) chains.push(walk(id, 0));
  });

  const beads = [];
  const edgeDots = new Map();
  dots.forEach((dot) => {
    if (!dot.onEdge) {
      beads.push(dot);
      return;
    }
    const angle = dot.start;
    const key = endKey('lane', dot.at, angle, pathDiv);
    if (buckets.has(key)) return;
    if (!edgeDots.has(key)) edgeDots.set(key, dot);
  });
  beads.push(...edgeDots.values());

  return { ambiguous, beads, chains, spacing };
}
