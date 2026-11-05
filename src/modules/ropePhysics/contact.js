/* eslint-disable no-param-reassign, no-bitwise, no-continue */
const clamp = (x) => Math.max(0, Math.min(1, x));

export function closestSegments(p, a, b, c, d, out) {
  const ux = p[b] - p[a];
  const uy = p[b + 1] - p[a + 1];
  const uz = p[b + 2] - p[a + 2];
  const vx = p[d] - p[c];
  const vy = p[d + 1] - p[c + 1];
  const vz = p[d + 2] - p[c + 2];
  const wx = p[a] - p[c];
  const wy = p[a + 1] - p[c + 1];
  const wz = p[a + 2] - p[c + 2];
  const aa = ux * ux + uy * uy + uz * uz;
  const bb = ux * vx + uy * vy + uz * vz;
  const cc = vx * vx + vy * vy + vz * vz;
  const dd = ux * wx + uy * wy + uz * wz;
  const ee = vx * wx + vy * wy + vz * wz;
  const denom = aa * cc - bb * bb;
  let s = denom > 1e-12 ? clamp((bb * ee - cc * dd) / denom) : 0;
  let t = cc > 1e-12 ? (bb * s + ee) / cc : 0;
  if (t < 0) {
    t = 0;
    s = aa > 1e-12 ? clamp(-dd / aa) : 0;
  }
  if (t > 1) {
    t = 1;
    s = aa > 1e-12 ? clamp((bb - dd) / aa) : 0;
  }
  out[0] = s;
  out[1] = t;
  out[2] = wx + ux * s - vx * t;
  out[3] = wy + uy * s - vy * t;
  out[4] = wz + uz * s - vz * t;
}

export function separateSegments(world, i, j) {
  const {
    positions: p,
    previous: prev,
    mass,
    segments: seg,
    radii,
    contact,
    oldContact,
  } = world;
  const ai = seg[i * 2];
  const bi = seg[i * 2 + 1];
  const ci = seg[j * 2];
  const di = seg[j * 2 + 1];
  if (Math.abs(ai - ci) <= 2 && world.owners[ai] === world.owners[ci]) return;
  const a = ai * 3;
  const b = bi * 3;
  const c = ci * 3;
  const d = di * 3;
  const radius = radii[ai] + radii[ci];
  if (Math.abs((p[a] + p[b] - p[c] - p[d]) * 0.5) > world.cellSize) return;
  closestSegments(p, a, b, c, d, contact);
  const distance = Math.hypot(contact[2], contact[3], contact[4]);
  if (distance >= radius) return;
  closestSegments(prev, a, b, c, d, oldContact);
  let nx = contact[2];
  let ny = contact[3];
  let nz = contact[4];
  const oldLength = Math.hypot(oldContact[2], oldContact[3], oldContact[4]);
  if (oldLength > 1e-7 && oldLength < radius * 3) {
    [, , nx, ny, nz] = oldContact;
  }
  let length = Math.hypot(nx, ny, nz);
  if (length < 1e-8) {
    nx = 0;
    ny = 0;
    nz = 1;
    length = 1;
  }
  nx /= length;
  ny /= length;
  nz /= length;
  const s = contact[0];
  const t = contact[1];
  const wa = mass[ai] * (1 - s);
  const wb = mass[bi] * s;
  const wc = mass[ci] * (1 - t);
  const wd = mass[di] * t;
  const weight = wa * (1 - s) + wb * s + wc * (1 - t) + wd * t;
  if (weight < 1e-9) return;
  const depth =
    (radius - (contact[2] * nx + contact[3] * ny + contact[4] * nz)) / weight;
  p[a] += nx * depth * wa;
  p[a + 1] += ny * depth * wa;
  p[a + 2] += nz * depth * wa;
  p[b] += nx * depth * wb;
  p[b + 1] += ny * depth * wb;
  p[b + 2] += nz * depth * wb;
  p[c] -= nx * depth * wc;
  p[c + 1] -= ny * depth * wc;
  p[c + 2] -= nz * depth * wc;
  p[d] -= nx * depth * wd;
  p[d + 1] -= ny * depth * wd;
  p[d + 2] -= nz * depth * wd;
}

const hash = (x, y, z) =>
  ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) & 16383;

export function collideRopes(world) {
  const { positions: p, segments, heads, next, cells, cellSize } = world;
  heads.fill(-1);
  const count = segments.length / 2;
  for (let i = 0; i < count; i += 1) {
    const a = segments[i * 2] * 3;
    const b = segments[i * 2 + 1] * 3;
    const o = i * 3;
    const x = Math.floor(((p[a] + p[b]) * 0.5) / cellSize);
    const y = Math.floor(((p[a + 1] + p[b + 1]) * 0.5) / cellSize);
    const z = Math.floor(((p[a + 2] + p[b + 2]) * 0.5) / cellSize);
    cells[o] = x;
    cells[o + 1] = y;
    cells[o + 2] = z;
    const h = hash(x, y, z);
    next[i] = heads[h];
    heads[h] = i;
  }
  for (let i = 0; i < count; i += 1) {
    const o = i * 3;
    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dz = -1; dz <= 1; dz += 1) {
          const x = cells[o] + dx;
          const y = cells[o + 1] + dy;
          const z = cells[o + 2] + dz;
          for (let j = heads[hash(x, y, z)]; j >= 0; j = next[j]) {
            if (
              j <= i ||
              cells[j * 3] !== x ||
              cells[j * 3 + 1] !== y ||
              cells[j * 3 + 2] !== z
            )
              continue;
            separateSegments(world, i, j);
          }
        }
      }
    }
  }
}
