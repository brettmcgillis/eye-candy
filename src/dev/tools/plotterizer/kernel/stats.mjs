import { runLength } from './paths.mjs';

export const MACHINE = { drawMmPerS: 100, liftS: 0.3, travelMmPerS: 250 };

export function passStats(runs, machine = MACHINE) {
  let inkMm = 0;
  let travelMm = 0;
  let at = [0, 0];
  runs.forEach((run) => {
    travelMm += Math.hypot(run.points[0][0] - at[0], run.points[0][1] - at[1]);
    inkMm += runLength(run);
    at = run.closed ? run.points[0] : run.points.at(-1);
  });
  return {
    inkMm,
    lifts: runs.length,
    seconds:
      inkMm / machine.drawMmPerS +
      travelMm / machine.travelMmPerS +
      runs.length * machine.liftS,
    travelMm,
  };
}

// Ink laid into nib-sized cells: a cell holding more than about two nib
// lengths of line has strokes closer together than the pen can separate.
export function crowding(runs, nibMm, [w, h]) {
  const cell = Math.max(0.05, nibMm);
  const cols = Math.ceil(w / cell) + 1;
  const rows = Math.ceil(h / cell) + 1;
  const ink = new Float32Array(cols * rows);
  const deposit = (x, y, length) => {
    const gx = Math.floor(x / cell);
    const gy = Math.floor(y / cell);
    if (gx >= 0 && gy >= 0 && gx < cols && gy < rows) {
      ink[gy * cols + gx] += length;
    }
  };
  runs.forEach(({ closed, points }) => {
    const path = closed ? [...points, points[0]] : points;
    if (path.length === 2 && runLength({ points: path }) < cell) {
      deposit(path[0][0], path[0][1], cell);
    }
    for (let i = 1; i < path.length; i += 1) {
      const [ax, ay] = path[i - 1];
      const [bx, by] = path[i];
      const length = Math.hypot(bx - ax, by - ay);
      const steps = Math.max(1, Math.ceil(length / (cell / 2)));
      for (let s = 0; s < steps; s += 1) {
        const t = (s + 0.5) / steps;
        deposit(ax + (bx - ax) * t, ay + (by - ay) * t, length / steps);
      }
    }
  });
  const limit = 2 * cell;
  let total = 0;
  let crowded = 0;
  const cells = [];
  ink.forEach((value, i) => {
    total += value;
    if (value > limit) {
      crowded += value;
      cells.push(i);
    }
  });
  return {
    cellMm: cell,
    cells: Uint32Array.from(cells),
    cols,
    fraction: total ? crowded / total : 0,
  };
}
