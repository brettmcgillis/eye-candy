const modulo = (value, period) => ((value % period) + period) % period;

export function cellInterior(mask, grid, clearance) {
  const { width, height } = mask;
  const covered = mask.covered.map((on, i) => {
    if (!on) return 0;
    const x = modulo((i % width) + 0.5 - grid.offsetX, grid.step);
    const y = modulo(Math.floor(i / width) + 0.5 - grid.offsetY, grid.step);
    return Math.min(x, grid.step - x, y, grid.step - y) >= clearance ? 1 : 0;
  });
  return { covered, width, height };
}

export function pixelGridRuns(map, mask, grid, palette, pixelRatio, pen) {
  const { width, height, ink } = map;
  const runs = palette.map(() => []);
  const at = (x, y) => {
    const px = Math.floor(x);
    const py = Math.floor(y);
    if (px < 0 || py < 0 || px >= width || py >= height) return -1;
    const i = py * width + px;
    return mask.covered[i] ? ink[i] : -1;
  };
  const scan = (vertical) => {
    const limit = vertical ? width : height;
    const length = vertical ? height : width;
    const offset = vertical ? grid.offsetX : grid.offsetY;
    for (let line = offset; line < limit; line += grid.step) {
      let open = null;
      const flush = (end) => {
        if (open && end - open.start >= pen * pixelRatio) {
          const a = vertical ? [line, open.start] : [open.start, line];
          const b = vertical ? [line, end] : [end, line];
          runs[open.ink].push(
            [a, b].map(([x, y]) => ({ x: x / pixelRatio, y: y / pixelRatio }))
          );
        }
        open = null;
      };
      for (let t = 0; t < length; t += 1) {
        const a = vertical ? at(line - 1, t + 0.5) : at(t + 0.5, line - 1);
        const b = vertical ? at(line + 1, t + 0.5) : at(t + 0.5, line + 1);
        let owner = -1;
        if (a >= 0 && b >= 0)
          owner = palette[a].lab[0] <= palette[b].lab[0] ? a : b;
        if (open && open.ink !== owner) flush(t);
        if (owner >= 0 && !open) open = { start: t, ink: owner };
      }
      flush(length);
    }
  };
  scan(true);
  scan(false);
  return runs;
}

export function squareInkMap(map, mask, grid, colors) {
  const cells = new Map();
  const keyOf = (i) =>
    `${Math.floor(((i % map.width) + 0.5 - grid.offsetX) / grid.step)},${Math.floor((Math.floor(i / map.width) + 0.5 - grid.offsetY) / grid.step)}`;
  mask.covered.forEach((on, i) => {
    if (!on || map.ink[i] < 0) return;
    const key = keyOf(i);
    if (!cells.has(key)) cells.set(key, new Uint32Array(colors));
    cells.get(key)[map.ink[i]] += 1;
  });
  const chosen = new Map();
  cells.forEach((votes, key) => {
    let best = 0;
    votes.forEach((count, i) => {
      if (count > votes[best]) best = i;
    });
    chosen.set(key, best);
  });
  const ink = map.ink.slice();
  mask.covered.forEach((on, i) => {
    if (on && ink[i] >= 0) ink[i] = chosen.get(keyOf(i));
  });
  return { ...map, ink };
}
