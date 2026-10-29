import { simplifyLoop } from './lines';

const STEP = 1;
const SIMPLIFY = 0.2;

const dense = (run) => {
  const out = [];
  run.forEach((p, i) => {
    if (i === 0) {
      out.push(p);
      return;
    }
    const q = run[i - 1];
    const steps = Math.ceil(Math.hypot(p.x - q.x, p.y - q.y) / STEP);
    for (let s = 1; s <= steps; s += 1) {
      const t = s / steps;
      out.push({ x: q.x + (p.x - q.x) * t, y: q.y + (p.y - q.y) * t });
    }
  });
  return out;
};

const length = (run) =>
  run.reduce(
    (sum, p, i) =>
      i ? sum + Math.hypot(p.x - run[i - 1].x, p.y - run[i - 1].y) : 0,
    0
  );

// The parts of `runs` more than `reach` px from every run in `against`, as
// strokes at least `minLength` long: a stroke another already draws is not
// drawn twice, and what is left of it is not a speck.
export default function withoutNear(
  runs,
  against,
  { minLength, onKeep = null, reach }
) {
  const cell = reach;
  const grid = new Map();
  const key = (x, y) => `${Math.floor(x / cell)},${Math.floor(y / cell)}`;
  against.forEach((run) =>
    dense(run).forEach((p) => {
      const k = key(p.x, p.y);
      if (!grid.has(k)) grid.set(k, []);
      grid.get(k).push(p);
    })
  );
  const near = (p) => {
    const cx = Math.floor(p.x / cell);
    const cy = Math.floor(p.y / cell);
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const hit = grid.get(`${cx + dx},${cy + dy}`);
        if (hit && hit.some((q) => Math.hypot(p.x - q.x, p.y - q.y) <= reach)) {
          return true;
        }
      }
    }
    return false;
  };
  const kept = [];
  runs.forEach((run) => {
    let piece = [];
    const flush = () => {
      if (piece.length > 1 && length(piece) >= minLength) {
        const simple = simplifyLoop(
          piece.map((p) => [p.x, p.y]),
          SIMPLIFY
        ).map(([x, y]) => ({ x, y }));
        kept.push(simple);
        onKeep?.(simple, run);
      }
      piece = [];
    };
    dense(run).forEach((p) => {
      if (near(p)) flush();
      else piece.push(p);
    });
    flush();
  });
  return kept;
}
