// Where the given passes lay ink, grown by `gapMm`: a grid of cells
// `gapMm / 2` across, each marked when a stroke passes within reach.
export function inkMask(passes, gapMm, [w, h]) {
  const cell = Math.max(0.02, gapMm / 2);
  const cols = Math.ceil(w / cell) + 1;
  const rows = Math.ceil(h / cell) + 1;
  const marked = new Uint8Array(cols * rows);
  const reach = Math.ceil(gapMm / cell);
  const mark = (x, y) => {
    const gx = Math.floor(x / cell);
    const gy = Math.floor(y / cell);
    for (let dy = -reach; dy <= reach; dy += 1) {
      for (let dx = -reach; dx <= reach; dx += 1) {
        const cx = gx + dx;
        const cy = gy + dy;
        if (cx >= 0 && cy >= 0 && cx < cols && cy < rows) {
          marked[cy * cols + cx] = 1;
        }
      }
    }
  };
  passes.forEach((runs) =>
    runs.forEach(({ closed, points }) => {
      const path = closed ? [...points, points[0]] : points;
      mark(...path[0]);
      for (let i = 1; i < path.length; i += 1) {
        const [ax, ay] = path[i - 1];
        const [bx, by] = path[i];
        const steps = Math.ceil(Math.hypot(bx - ax, by - ay) / (cell / 2));
        for (let s = 1; s <= steps; s += 1) {
          mark(ax + ((bx - ax) * s) / steps, ay + ((by - ay) * s) / steps);
        }
      }
    })
  );
  return {
    covers: (x, y) => {
      const gx = Math.floor(x / cell);
      const gy = Math.floor(y / cell);
      return (
        gx >= 0 && gy >= 0 && gx < cols && gy < rows && marked[gy * cols + gx]
      );
    },
    step: cell / 2,
  };
}

// The runs with every stretch the mask covers cut away, so a lighter pen
// stops short of a darker pen's line instead of running under it.
export function knockOut(runs, mask) {
  const kept = [];
  runs.forEach(({ closed, points }) => {
    const path = closed ? [...points, points[0]] : points;
    let run = [];
    const flush = () => {
      if (run.length > 1) kept.push({ closed: false, points: run });
      run = [];
    };
    const visit = (p) => {
      if (mask.covers(...p)) flush();
      else run.push(p);
    };
    visit(path[0]);
    for (let i = 1; i < path.length; i += 1) {
      const [ax, ay] = path[i - 1];
      const [bx, by] = path[i];
      const steps = Math.max(
        1,
        Math.ceil(Math.hypot(bx - ax, by - ay) / mask.step)
      );
      for (let s = 1; s <= steps; s += 1) {
        visit([ax + ((bx - ax) * s) / steps, ay + ((by - ay) * s) / steps]);
      }
    }
    flush();
  });
  return kept;
}
