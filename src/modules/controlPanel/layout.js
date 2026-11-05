// Panel regions in grid cells, origin top-left, y down. A leaf is a module
// to fill; `zone` marks the leaves of a tinted region.

function pickSplit(rng, length, even) {
  if (length < 2) return null;
  if (rng() < even) return Math.floor(length / 2);
  return 1 + Math.floor(rng() * (length - 1));
}

// Recursive guillotine splits: a region keeps splitting its long side until
// it is no larger than `maxModule` and the dice let it stop.
export function subdivide(config, rng, { h, w, x = 0, y = 0 }) {
  const leaves = [];
  const zones = [];

  function walk(rx, ry, rw, rh, depth, zone) {
    const inZone =
      zone ||
      (depth >= 1 && depth <= 2 && rw * rh >= 6 && rng() < config.zoneChance);
    if (inZone && !zone) zones.push({ h: rh, w: rw, x: rx, y: ry });
    const small = Math.max(rw, rh) <= config.maxModule;
    if ((rw <= 1 && rh <= 1) || (small && rng() < config.stopChance)) {
      leaves.push({ depth, h: rh, w: rw, x: rx, y: ry, zone: inZone });
      return;
    }
    const alongX = rw > rh || (rw === rh && rng() < 0.5);
    const cut = pickSplit(rng, alongX ? rw : rh, config.evenSplit);
    if (alongX) {
      walk(rx, ry, cut, rh, depth + 1, inZone);
      walk(rx + cut, ry, rw - cut, rh, depth + 1, inZone);
    } else {
      walk(rx, ry, rw, cut, depth + 1, inZone);
      walk(rx, ry + cut, rw, rh - cut, depth + 1, inZone);
    }
  }

  walk(x, y, w, h, 0, false);
  return { leaves, zones };
}

// 0b5vr's grid, generalised: the panel is tiled in blocks of `gridBlock`,
// and each block stays whole with `gridKeep`, else halves, down to 1 × 1.
export function blockGrid(config, rng, { h, w }) {
  const leaves = [];
  const zones = [];
  const size = config.gridBlock;

  function block(rx, ry, rw, rh, depth, zone) {
    if ((rw <= 1 && rh <= 1) || rng() < config.gridKeep) {
      leaves.push({ depth, h: rh, w: rw, x: rx, y: ry, zone });
      return;
    }
    const alongX = rw > rh || (rw === rh && rng() < 0.5);
    const half = Math.floor((alongX ? rw : rh) / 2);
    if (alongX) {
      block(rx, ry, half, rh, depth + 1, zone);
      block(rx + half, ry, rw - half, rh, depth + 1, zone);
    } else {
      block(rx, ry, rw, half, depth + 1, zone);
      block(rx, ry + half, rw, rh - half, depth + 1, zone);
    }
  }

  for (let by = 0; by < h; by += size) {
    for (let bx = 0; bx < w; bx += size) {
      const bw = Math.min(size, w - bx);
      const bh = Math.min(size, h - by);
      const zone = bw * bh >= 4 && rng() < config.zoneChance * 0.5;
      if (zone) zones.push({ h: bh, w: bw, x: bx, y: by });
      block(bx, by, bw, bh, 0, zone);
    }
  }
  return { leaves, zones };
}

// Greedy random circle packing, biggest first: each candidate centre takes
// the largest radius its walls and neighbours allow, under a cap that
// shrinks as the tries run out.
export function packCircles(rng, { gap = 0.03, hh, hw, maxR, minR, tries }) {
  const circles = [];
  for (let i = 0; i < tries; i += 1) {
    const x = (rng() * 2 - 1) * hw;
    const y = (rng() * 2 - 1) * hh;
    const cap = minR + (maxR - minR) * (1 - i / tries) ** 2;
    let r = Math.min(cap, hw - Math.abs(x), hh - Math.abs(y));
    for (let j = 0; j < circles.length && r >= minR; j += 1) {
      const c = circles[j];
      r = Math.min(r, Math.hypot(x - c.x, y - c.y) - c.r - gap);
    }
    if (r >= minR) circles.push({ r, x, y });
  }
  return circles;
}
