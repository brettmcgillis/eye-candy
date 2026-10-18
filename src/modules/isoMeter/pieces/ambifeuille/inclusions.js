import { extmod } from '../../lattice';

const NO_HIT = -2;
const CARVE = -1;

function createBox(rng, offI, offJ, offK, spanI, spanJ, spanK) {
  return {
    originI: offI + rng.randomInt(-spanI, spanI),
    originJ: offJ + rng.randomInt(-spanJ, spanJ),
    originK: offK + rng.randomInt(-spanK, spanK),
  };
}

function quickCheck(inc, i, j, k) {
  return (
    i >= inc.originI - inc.halfI &&
    j >= inc.originJ - inc.halfJ &&
    k >= inc.originK - inc.halfK &&
    i <= inc.originI + inc.halfI &&
    j <= inc.originJ + inc.halfJ &&
    k <= inc.originK + inc.halfK
  );
}

function createSphere(rng, box, solid) {
  const r = rng.randomInt;
  const d = [r(2, 8), r(2, 8), r(2, 8)];
  const d2 = [r(2, 8), r(2, 8), r(2, 8)];
  const t = r(2, 5);
  const e = [rng.random(0.7, 1.4), rng.random(0.7, 1.4), rng.random(0.7, 1.4)];
  const pickAxes = () => {
    let f;
    do {
      f = [0, 1, 2].map(() => (rng.random() < 0.5 ? 0 : 1));
    } while (f[0] + f[1] + f[2] === 0 || f[0] + f[1] + f[2] === 3);
    return f;
  };
  const f = pickAxes();
  const f2 = pickAxes();
  const radius = r(8, 28);
  const ripple = (i, j, k, dv, fv) =>
    fv[0] * extmod(i, dv[0]) +
    fv[1] * extmod(j, dv[1]) +
    fv[2] * extmod(k, dv[2]);
  const inc = {
    ...box,
    halfI: radius + 8,
    halfJ: radius + 8,
    halfK: radius + 8,
    value(i, j, k) {
      const di = box.originI - i;
      const dj = box.originJ - j;
      const dk = box.originK - k;
      const d2v = e[0] * di * di + e[1] * dj * dj + e[2] * dk * dk;
      const w1 = ripple(i, j, k, d, f);
      const w2 = ripple(i, j, k, d2, f2);
      const shell = (inner) => (radius + inner + w1) * (radius + inner + w2);
      if (d2v < shell(0) && d2v > shell(-t)) return solid;
      if (d2v < shell(2) && d2v > shell(-8)) return CARVE;
      return NO_HIT;
    },
  };
  return inc;
}

function createVoxelGrid(box, dims, solid) {
  const { I, J, K } = dims;
  const JK = J * K;
  const values = new Int8Array(I * JK).fill(-1);
  const index = (i, j, k) =>
    i < 0 || j < 0 || k < 0 || i >= I || j >= J || k >= K
      ? -1
      : i * JK + K * j + k;
  const set = (i, j, k, v) => {
    const id = index(i, j, k);
    if (id !== -1) values[id] = v;
  };
  const fill = (si, sj, sk, di, dj, dk, v) => {
    for (let i = si; i < si + di; i += 1) {
      for (let j = sj; j < sj + dj; j += 1) {
        for (let k = sk; k < sk + dk; k += 1) set(i, j, k, v);
      }
    }
  };
  const isBulk = (i, j, k) => {
    for (let di = -1; di <= 1; di += 1) {
      for (let dj = -1; dj <= 1; dj += 1) {
        for (let dk = -1; dk <= 1; dk += 1) {
          const id = index(i + di, j + dj, k + dk);
          if (id === -1 || values[id] <= 0) return false;
        }
      }
    }
    return true;
  };
  const hollow = () => {
    for (let i = 0; i < I; i += 1) {
      for (let j = 0; j < J; j += 1) {
        for (let k = 0; k < K; k += 1) if (isBulk(i, j, k)) set(i, j, k, 3);
      }
    }
  };
  const get = (wi, wj, wk) => {
    const id = index(
      Math.floor(wi - box.originI + I / 2),
      Math.floor(wj - box.originJ + J / 2),
      Math.floor(wk - box.originK + K / 2)
    );
    return id === -1 ? undefined : values[id];
  };
  return {
    ...box,
    fill,
    halfI: I / 2 + 2,
    halfJ: J / 2 + 2,
    halfK: K / 2 + 2,
    hollow,
    value(i, j, k) {
      if (
        Math.abs(i - box.originI) > I / 2 ||
        Math.abs(j - box.originJ) > J / 2 ||
        Math.abs(k - box.originK) > K / 2
      ) {
        return CARVE;
      }
      const v = get(i, j, k);
      if (v === 1) return solid;
      if (v === 0) return CARVE;
      return NO_HIT;
    },
  };
}

function carveSteps(rng, grid, dims, chance, di, dj, dk, lj = 0) {
  for (let i = 0; i < dims.I; i += di) {
    for (let k = 0; k < dims.K; k += dk) {
      for (let j = 0; j < dims.J; j += dj + lj) {
        if (rng.random() < chance) {
          if (lj) grid.fill(i, j + dj, k, di, lj, dk, -1);
          else grid.fill(i, j, k, di, dj, dk, -1);
        }
      }
    }
  }
}

function createBooleanGrid(rng, box, solid) {
  const r = rng.randomInt;
  const dims =
    rng.random() < 0.5
      ? { I: 2 * r(6, 12), J: 2 * r(20, 48), K: 2 * r(6, 12) }
      : { I: 2 * r(12, 32), J: 2 * r(8, 12), K: 2 * r(12, 32) };
  const grid = createVoxelGrid(box, dims, solid);
  const iter = r(8, 32);
  for (let n = 0; n < iter; n += 1) {
    const si = r(0, dims.I - 3);
    const sj = r(0, dims.J - 3);
    const sk = r(0, dims.K - 3);
    grid.fill(
      si,
      sj,
      sk,
      r(2, dims.I - si),
      r(2, dims.J - sj),
      r(2, dims.K - sk),
      1
    );
  }
  const di = Math.floor(dims.I / r(2, 8));
  const dj = Math.floor(dims.J / r(1, 3));
  const dk = Math.floor(dims.K / r(2, 8));
  carveSteps(rng, grid, dims, 0.4, di, dj, dk);
  grid.hollow();
  const si = r(5, 17);
  const sj = r(3, 5);
  const sk = r(5, 17);
  carveSteps(rng, grid, dims, 0.45, si, sj, sk, 1);
  return grid;
}

const DIRECTIONS = [
  [-1, 0, 0],
  [1, 0, 0],
  [0, -1, 0],
  [0, 1, 0],
  [0, 0, -1],
  [0, 0, 1],
];

function createRandomWalkGrid(rng, box, solid, bounds) {
  const r = rng.randomInt;
  const dims = { I: 2 * r(8, 32), J: 2 * r(8, 32), K: 2 * r(8, 32) };
  const grid = createVoxelGrid(box, dims, solid);
  const iter = r(8, 32);
  for (let n = 0; n < iter; n += 1) {
    let si = r(0, dims.I);
    let sj = r(0, dims.J);
    let sk = r(0, dims.K);
    const size = r(1, 3);
    const step = r(2, 8);
    while (
      si >= 0 &&
      si - size < bounds.I &&
      sj >= 0 &&
      sj - size < bounds.J &&
      sk >= 0 &&
      sk - size < bounds.K
    ) {
      const dir = DIRECTIONS[r(0, 5)];
      for (let s = 0; s < step; s += 1) {
        grid.fill(si, sj, sk, size, size, size, 1);
        si += size * dir[0];
        sj += size * dir[1];
        sk += size * dir[2];
      }
    }
  }
  grid.hollow();
  return grid;
}

export default function createInclusions({
  bounds,
  count,
  hl,
  lcg,
  offset,
  sectorHalf,
  solid,
  spreadFactor,
}) {
  const inner = Math.floor(sectorHalf / 2) * spreadFactor;
  const outer = (n) =>
    (sectorHalf - Math.ceil(n / (2 * spreadFactor) + 1)) * spreadFactor;
  const innerSpan = [inner, inner, inner];
  const outerSpan = [outer(bounds.I), outer(bounds.J), outer(bounds.K)];
  const inclusions = [];
  for (let n = 0; n < count; n += 1) {
    const roll = n < count / 3 ? lcg.random() : hl.random();
    const span = n < count / 3 ? innerSpan : outerSpan;
    const box = createBox(lcg, offset.i, offset.j, offset.k, ...span);
    if (roll < 0.4) inclusions.push(createBooleanGrid(lcg, box, solid));
    else if (roll < 0.7) inclusions.push(createSphere(lcg, box, solid));
    else inclusions.push(createRandomWalkGrid(lcg, box, solid, bounds));
  }
  return {
    list: inclusions,
    value(i, j, k) {
      for (let s = 0; s < inclusions.length; s += 1) {
        const inc = inclusions[s];
        if (quickCheck(inc, i, j, k)) {
          const v = inc.value(i, j, k);
          if (v > NO_HIT) return v;
        }
      }
      return NO_HIT;
    },
  };
}

export { NO_HIT };
