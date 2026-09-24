// Centre-lines of a reaction-diffusion maze on a surface graph. `strength`
// is V per vertex. Walks start on the strongest unclaimed crest, climb along
// it both ways (highest neighbour, with momentum so they do not zig-zag across
// the band), and stop where the worm ends. Each finished worm claims a band
// `claimRadius` wide, so its neighbours on the same worm cannot start a second
// tube there.
export default function traceMaze({
  claimRadius,
  floor,
  graph,
  maxSteps = 2000,
  minPoints = 6,
  momentum = 0.6,
  strength,
}) {
  const { count, neighbors, offsets, positions } = graph;
  const claimed = new Uint8Array(count);
  const inPath = new Int32Array(count).fill(-1);
  const reach = new Float64Array(count).fill(Infinity);
  const queue = new Int32Array(count);

  let candidates = 0;
  for (let v = 0; v < count; v += 1) if (strength[v] >= floor) candidates += 1;
  const order = new Int32Array(candidates);
  for (let v = 0, k = 0; v < count; v += 1) {
    if (strength[v] >= floor) {
      order[k] = v;
      k += 1;
    }
  }
  order.sort((a, b) => strength[b] - strength[a]);

  const heading = new Float64Array(3);

  const walk = (start, stamp, hx, hy, hz, path) => {
    let at = start;
    let has = hx !== 0 || hy !== 0 || hz !== 0;
    heading[0] = hx;
    heading[1] = hy;
    heading[2] = hz;
    for (let i = 0; i < maxSteps; i += 1) {
      let best = -1;
      let bestScore = -Infinity;
      let bx = 0;
      let by = 0;
      let bz = 0;
      for (let k = offsets[at]; k < offsets[at + 1]; k += 1) {
        const n = neighbors[k];
        if (!claimed[n] && inPath[n] !== stamp && strength[n] >= floor) {
          let dx = positions[n * 3] - positions[at * 3];
          let dy = positions[n * 3 + 1] - positions[at * 3 + 1];
          let dz = positions[n * 3 + 2] - positions[at * 3 + 2];
          const l = Math.hypot(dx, dy, dz) || 1;
          dx /= l;
          dy /= l;
          dz /= l;
          const turn = has
            ? dx * heading[0] + dy * heading[1] + dz * heading[2]
            : 0;
          if (turn > -0.2) {
            const score = strength[n] + momentum * 0.1 * turn;
            if (score > bestScore) {
              bestScore = score;
              best = n;
              bx = dx;
              by = dy;
              bz = dz;
            }
          }
        }
      }
      if (best < 0) break;
      if (has) {
        heading[0] = heading[0] * 0.6 + bx * 0.4;
        heading[1] = heading[1] * 0.6 + by * 0.4;
        heading[2] = heading[2] * 0.6 + bz * 0.4;
      } else {
        heading[0] = bx;
        heading[1] = by;
        heading[2] = bz;
        has = true;
      }
      at = best;
      inPath[at] = stamp;
      path.push(at);
    }
    return path;
  };

  const claim = (path) => {
    let tail = 0;
    path.forEach((v) => {
      reach[v] = 0;
      queue[tail] = v;
      tail += 1;
    });
    for (let head = 0; head < tail; head += 1) {
      const v = queue[head];
      const d = reach[v];
      claimed[v] = 1;
      for (let k = offsets[v]; k < offsets[v + 1]; k += 1) {
        const n = neighbors[k];
        const nd =
          d +
          Math.hypot(
            positions[n * 3] - positions[v * 3],
            positions[n * 3 + 1] - positions[v * 3 + 1],
            positions[n * 3 + 2] - positions[v * 3 + 2]
          );
        if (nd <= claimRadius && nd < reach[n]) {
          if (reach[n] === Infinity) {
            queue[tail] = n;
            tail += 1;
          }
          reach[n] = nd;
        }
      }
    }
    for (let k = 0; k < tail; k += 1) reach[queue[k]] = Infinity;
  };

  const worms = [];
  order.forEach((start, stamp) => {
    if (claimed[start]) return;
    inPath[start] = stamp;
    const forward = walk(start, stamp, 0, 0, 0, []);
    let back = [];
    if (forward.length > 0) {
      const f = forward[0];
      back = walk(
        start,
        stamp,
        positions[start * 3] - positions[f * 3],
        positions[start * 3 + 1] - positions[f * 3 + 1],
        positions[start * 3 + 2] - positions[f * 3 + 2],
        []
      );
    }
    const path = [...back.reverse(), start, ...forward];
    claim(path);
    if (path.length >= minPoints) worms.push(path);
  });
  return worms;
}
