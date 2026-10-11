/* eslint-disable no-param-reassign */
export const FIELD_W = 80;
export const FIELD_H = 45;
export const MAX_EMITTERS = 4;
export const MAX_OCCLUDERS = 6;

const TYPES = ['circle', 'box', 'bar'];

export const DEFAULT_EMITTERS = [
  { x: -0.3, y: 0.18 },
  { x: 0.02, y: -0.2 },
  { x: 0.3, y: 0.15 },
  { x: -0.05, y: 0.34 },
];

export const DEFAULT_OCCLUDERS = [
  { x: -0.12, y: 0.0 },
  { x: 0.14, y: 0.02 },
  { x: -0.34, y: -0.2 },
  { x: 0.36, y: -0.22 },
  { x: 0.0, y: 0.26 },
  { x: 0.0, y: -0.36 },
];

export function occluderType(index) {
  return TYPES[index % TYPES.length];
}

export function occluderExtents(type, size) {
  if (type === 'box') return [size * 0.6, size * 0.6];
  if (type === 'bar') return [size * 1.5, size * 0.18];
  return [size * 0.7, size * 0.7];
}

function segmentHitsCircle(ax, ay, bx, by, cx, cy, r) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t =
    len2 > 0
      ? Math.max(0, Math.min(1, ((cx - ax) * dx + (cy - ay) * dy) / len2))
      : 0;
  const px = ax + dx * t - cx;
  const py = ay + dy * t - cy;
  return px * px + py * py < r * r;
}

function segmentHitsBox(ax, ay, bx, by, occ) {
  const c = Math.cos(-occ.rot);
  const s = Math.sin(-occ.rot);
  const lax = (ax - occ.x) * c - (ay - occ.y) * s;
  const lay = (ax - occ.x) * s + (ay - occ.y) * c;
  const lbx = (bx - occ.x) * c - (by - occ.y) * s;
  const lby = (bx - occ.x) * s + (by - occ.y) * c;
  const dx = lbx - lax;
  const dy = lby - lay;
  let t0 = 0;
  let t1 = 1;
  const clip = (p, q) => {
    if (p === 0) return q >= 0;
    const t = q / p;
    if (p < 0) {
      if (t > t1) return false;
      t0 = Math.max(t0, t);
    } else {
      if (t < t0) return false;
      t1 = Math.min(t1, t);
    }
    return true;
  };
  return (
    clip(-dx, lax + occ.hw) &&
    clip(dx, occ.hw - lax) &&
    clip(-dy, lay + occ.hh) &&
    clip(dy, occ.hh - lay)
  );
}

function blocked(ax, ay, bx, by, occluders) {
  for (let k = 0; k < occluders.length; k += 1) {
    const occ = occluders[k];
    const hit =
      occ.type === 'circle'
        ? segmentHitsCircle(ax, ay, bx, by, occ.x, occ.y, occ.hw)
        : segmentHitsBox(ax, ay, bx, by, occ);
    if (hit) return true;
  }
  return false;
}

export function computeField(field, emitters, occluders, stage, lightRadius) {
  const inv2 = 1 / (lightRadius * lightRadius);
  for (let j = 0; j < FIELD_H; j += 1) {
    const y = ((j + 0.5) / FIELD_H - 0.5) * stage.height;
    for (let i = 0; i < FIELD_W; i += 1) {
      const x = ((i + 0.5) / FIELD_W - 0.5) * stage.width;
      let r = 0;
      let g = 0;
      let b = 0;
      for (let e = 0; e < emitters.length; e += 1) {
        const em = emitters[e];
        const dx = x - em.x;
        const dy = y - em.y;
        const att = em.intensity / (1 + (dx * dx + dy * dy) * inv2);
        if (att > 0.01 && !blocked(em.x, em.y, x, y, occluders)) {
          r += em.r * att;
          g += em.g * att;
          b += em.b * att;
        }
      }
      const o = (j * FIELD_W + i) * 3;
      field[o] = r;
      field[o + 1] = g;
      field[o + 2] = b;
    }
  }
}

export function regionLevels(field, cols, rows, out) {
  for (let rr = 0; rr < rows; rr += 1) {
    const j0 = Math.floor((rr * FIELD_H) / rows);
    const j1 = Math.floor(((rr + 1) * FIELD_H) / rows);
    for (let rc = 0; rc < cols; rc += 1) {
      const i0 = Math.floor((rc * FIELD_W) / cols);
      const i1 = Math.floor(((rc + 1) * FIELD_W) / cols);
      let r = 0;
      let g = 0;
      let b = 0;
      for (let j = j0; j < j1; j += 1) {
        for (let i = i0; i < i1; i += 1) {
          const o = (j * FIELD_W + i) * 3;
          r += field[o];
          g += field[o + 1];
          b += field[o + 2];
        }
      }
      const n = Math.max(1, (j1 - j0) * (i1 - i0));
      const base = (rr * cols + rc) * 3;
      out[base] = r / n;
      out[base + 1] = g / n;
      out[base + 2] = b / n;
    }
  }
}
