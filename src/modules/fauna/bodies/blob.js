/* eslint-disable no-param-reassign */
import { decode } from '../genome';
import { BITMAP_HALF, BITMAP_ROWS } from '../params';
import surfaceNets from '../surfaceNets';

export function ifsParams(genome) {
  const count = Math.round(decode(genome, 'ifsCount'));
  const flips = [];
  let flipMask = 0;

  for (let i = 0; i < count; i += 1) {
    const r = i % BITMAP_ROWS;
    const flip = genome.bitmap[r * BITMAP_HALF + (i % BITMAP_HALF)] ? -1 : 1;

    flips.push(flip);
    flipMask += flip < 0 ? 2 ** i : 0;
  }

  return {
    balance: decode(genome, 'ifsBalance'),
    blend: decode(genome, 'ifsBlend'),
    count,
    falloff: decode(genome, 'ifsFalloff'),
    flipMask,
    flips,
    pulse: decode(genome, 'ifsPulse'),
    radius: decode(genome, 'ifsRadius'),
    range: decode(genome, 'ifsRange'),
    tempo: decode(genome, 'ifsTempo'),
    twist: decode(genome, 'ifsTwist'),
  };
}

function smin(a, b, r) {
  const h = Math.min(1, Math.max(0, 0.5 + (0.5 * (b - a)) / r));

  return b + (a - b) * h - r * h * (1 - h);
}

export function createIfsField(ifs, t = ifs.twist) {
  const scales = [];
  const rotXY = [];
  const rotZY = [];
  let a = 1;

  for (let i = 0; i < ifs.count; i += 1) {
    const swing = (ifs.balance * ifs.flips[i]) / a;

    scales.push(a);
    rotXY.push([
      Math.cos(Math.cos(t) * swing + a * 2),
      Math.sin(Math.cos(t) * swing + a * 2),
    ]);
    rotZY.push([
      Math.cos(Math.sin(t) * swing + a * 2),
      Math.sin(Math.sin(t) * swing + a * 2),
    ]);
    a /= ifs.falloff;
  }

  const evaluate = (x0, y0, z0, record = null) => {
    let x = x0;
    let y = y0;
    let z = z0;
    let d = 1e9;

    for (let i = 0; i < ifs.count; i += 1) {
      const s = scales[i];
      const negative = x < 0;

      x = Math.abs(x) - ifs.range * s;

      const [c1, s1] = rotXY[i];
      const rx = c1 * x - s1 * y;
      const ry = s1 * x + c1 * y;
      const [c2, s2] = rotZY[i];
      const rz = c2 * z - s2 * ry;

      y = s2 * z + c2 * ry;
      x = rx;
      z = rz;

      const di = Math.hypot(x, y, z) - ifs.radius * s;

      d = smin(d, di, ifs.blend * s);

      if (record) {
        record.dist[i] = di;
        record.negative[i] = negative;
        record.local[i * 3] = x;
        record.local[i * 3 + 1] = y;
        record.local[i * 3 + 2] = z;
      }
    }

    return d;
  };

  return { evaluate, scales };
}

function sampleGrid(evaluate, min, cell, dims) {
  const [nx, ny, nz] = dims;
  const field = new Float32Array(nx * ny * nz);

  for (let z = 0; z < nz; z += 1) {
    for (let y = 0; y < ny; y += 1) {
      for (let x = 0; x < nx; x += 1) {
        field[x + nx * (y + ny * z)] = -evaluate(
          min[0] + x * cell,
          min[1] + y * cell,
          min[2] + z * cell
        );
      }
    }
  }

  return field;
}

function insideBounds(evaluate, reach, res) {
  const cell = (reach * 2) / (res - 1);
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];

  for (let z = 0; z < res; z += 1) {
    for (let y = 0; y < res; y += 1) {
      for (let x = 0; x < res; x += 1) {
        const p = [-reach + x * cell, -reach + y * cell, -reach + z * cell];

        if (evaluate(p[0], p[1], p[2]) < cell) {
          p.forEach((v, k) => {
            lo[k] = Math.min(lo[k], v);
            hi[k] = Math.max(hi[k], v);
          });
        }
      }
    }
  }

  return { cell, hi, lo };
}

function skinVertex(field, ifs, x, y, z, record, out, v) {
  field.evaluate(x, y, z, record);

  let best = 0;
  let second = -1;

  for (let i = 1; i < ifs.count; i += 1) {
    if (record.dist[i] < record.dist[best]) {
      second = best;
      best = i;
    } else if (second < 0 || record.dist[i] < record.dist[second]) {
      second = i;
    }
  }

  if (second < 0) second = best;

  const softness = (level) => Math.max(ifs.blend * field.scales[level], 1e-3);
  const wBest = Math.exp(
    -(record.dist[best] - record.dist[best]) / softness(best)
  );
  const wSecond = Math.exp(
    -(record.dist[second] - record.dist[best]) / softness(second)
  );
  const weight = wBest / (wBest + wSecond);

  [
    [best, out.boneA, out.localA, weight],
    [second, out.boneB, out.localB, 1 - weight],
  ].forEach(([level, bone, local, w]) => {
    let mask = 0;

    for (let i = 0; i <= level; i += 1) {
      mask += record.negative[i] ? 2 ** i : 0;
    }

    bone.set([mask, level, w, 0], v * 4);
    local.set(record.local.subarray(level * 3, level * 3 + 3), v * 3);
  });
}

export default function blobSkin(genome, detail = 34) {
  const ifs = ifsParams(genome);
  const field = createIfsField(ifs);
  let reach = ifs.radius;

  for (let i = 0; i < ifs.count; i += 1) {
    reach += ifs.range * field.scales[i];
  }

  const coarse = insideBounds(field.evaluate, reach, 26);
  const pad = coarse.cell * 2;
  const lo = coarse.lo.map((v) => v - pad);
  const extent = Math.max(...coarse.hi.map((v, k) => v + pad - lo[k]));
  const cell = extent / (detail - 1);
  const dims = coarse.hi.map((v, k) => Math.ceil((v + pad - lo[k]) / cell) + 1);
  const mesh = surfaceNets(
    sampleGrid(field.evaluate, lo, cell, dims),
    dims,
    lo,
    cell,
    0
  );
  const vertexCount = mesh.positions.length / 3;
  const out = {
    boneA: new Float32Array(vertexCount * 4),
    boneB: new Float32Array(vertexCount * 4),
    localA: new Float32Array(vertexCount * 3),
    localB: new Float32Array(vertexCount * 3),
  };
  const record = {
    dist: new Float32Array(ifs.count),
    local: new Float32Array(ifs.count * 3),
    negative: new Array(ifs.count).fill(false),
  };
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];

  for (let v = 0; v < vertexCount; v += 1) {
    const p = mesh.positions.subarray(v * 3, v * 3 + 3);

    skinVertex(field, ifs, p[0], p[1], p[2], record, out, v);

    for (let k = 0; k < 3; k += 1) {
      min[k] = Math.min(min[k], p[k]);
      max[k] = Math.max(max[k], p[k]);
    }
  }

  const size = max.map((v, k) => v - min[k]);

  return {
    ...mesh,
    ...out,
    frame: new Float32Array(vertexCount),
    ifs,
    norm: 1 / Math.max(size[0], size[1], size[2], 1e-3),
    offset: [(min[0] + max[0]) / 2, min[1], (min[2] + max[2]) / 2],
  };
}
