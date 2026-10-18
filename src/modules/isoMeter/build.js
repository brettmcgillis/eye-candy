import { createLattice } from './lattice';

export function smoothHeightMap(source, I, K) {
  const pass = (from) => {
    const out = new Float64Array(I * K);
    for (let i = 0; i < I; i += 1) {
      for (let k = 0; k < K; k += 1) {
        let v = from[k + K * i];
        let c = 2;
        if (i > 0) {
          v += from[k + K * (i - 1)];
          c += 1;
        }
        if (i < I - 1) {
          v += from[k + K * (i + 1)];
          c += 1;
        }
        if (k > 0) {
          v += from[k - 1 + K * i];
          c += 1;
        }
        if (k < K - 1) {
          v += from[k + 1 + K * i];
          c += 1;
        }
        out[k + K * i] = v / c;
      }
    }
    return out;
  };
  return pass(pass(source));
}

export function createBuild(piece, { record = false } = {}) {
  const { I, K } = piece.dims;
  const lattice = createLattice({ ...piece.lattice, record });
  const jHeight = new Float64Array(I * K).fill(piece.heightFloor ?? 0);
  let ikHeight = null;
  let cursor = 0;

  const raise = (index, level) => {
    if (level > jHeight[index]) jHeight[index] = level;
  };

  const step = (count = 1) => {
    const end = Math.min(piece.levels.length, cursor + count);
    const added = [];
    for (; cursor < end; cursor += 1) {
      const level = piece.levels[cursor];
      piece.addLevel(lattice, raise, level);
      added.push(level);
    }
    if (cursor === piece.levels.length && !ikHeight) {
      ikHeight = smoothHeightMap(jHeight, I, K);
    }
    return added;
  };

  return {
    get done() {
      return cursor >= piece.levels.length;
    },
    heights: () => ({ ikHeight: ikHeight ?? jHeight, jHeight }),
    lattice,
    get progress() {
      return cursor / piece.levels.length;
    },
    reset() {
      lattice.clear();
      jHeight.fill(piece.heightFloor ?? 0);
      ikHeight = null;
      cursor = 0;
    },
    step,
  };
}

export function buildPiece(piece) {
  const build = createBuild(piece);
  build.step(piece.levels.length);
  return build;
}
