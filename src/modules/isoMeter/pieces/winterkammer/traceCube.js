const EMPTY = -1;
const START = 7;
const BLOCKED = 8;
const LEFT = 0;
const RIGHT = 1;
const DOWN = 2;
const UP = 3;
const BACK = 4;
const FRONT = 5;

const STEPS = {
  [BACK]: [0, 0, -1],
  [DOWN]: [0, -1, 0],
  [FRONT]: [0, 0, 1],
  [LEFT]: [-1, 0, 0],
  [RIGHT]: [1, 0, 0],
  [UP]: [0, 1, 0],
};

const STROKES = {
  [BACK]: [0, 0, 1],
  [DOWN]: [0, 1, 0],
  [FRONT]: [0, 0, -1],
  [LEFT]: [1, 0, 0],
  [RIGHT]: [-1, 0, 0],
  [UP]: [0, -1, 0],
};

const grid3 = (I, J, K, value) =>
  Array.from({ length: I }, () =>
    Array.from({ length: J }, () => Array.from({ length: K }, () => value))
  );

export default function createTraceCube(sizeI, sizeJ, sizeK, padding, rng) {
  const factor = 1 + 2 * padding;
  const voxelI = sizeI * factor;
  const voxelJ = sizeJ * factor;
  const voxelK = sizeK * factor;
  const state = grid3(sizeI, sizeJ, sizeK, EMPTY);

  const setState = (i, j, k, value) => {
    const reach = sizeI + sizeJ + sizeK;
    for (let e = -reach; e <= reach; e += 1) {
      const a = i + e;
      const b = j + e;
      const c = k + e;
      if (a >= 0 && b >= 0 && c >= 0 && a < sizeI && b < sizeJ && c < sizeK) {
        state[a][b][c] = BLOCKED;
      }
    }
    state[i][j][k] = value;
  };

  const allowed = (pos, dir) =>
    !(
      (pos[0] === 0 && dir === LEFT) ||
      (pos[1] === 0 && dir === DOWN) ||
      (pos[2] === 0 && dir === BACK) ||
      (pos[0] === sizeI - 1 && dir === RIGHT) ||
      (pos[1] === sizeJ - 1 && dir === UP) ||
      (pos[2] === sizeK - 1 && dir === FRONT)
    );

  const randomPath = () => {
    let i;
    let j;
    let k;
    let tries = 0;
    do {
      i = rng.randomIntExcl(sizeI);
      j = rng.randomIntExcl(sizeJ);
      k = rng.randomIntExcl(sizeK);
      tries += 1;
    } while (state[i][j][k] !== EMPTY && tries < 1e3);
    if (tries >= 100) return;
    const pos = [i, j, k];
    setState(i, j, k, START);
    let moved = true;
    let steps = 0;
    let length = rng.randomIntExcl(9);
    length *= length;
    if (length <= 0) return;
    do {
      let attempts = 0;
      do {
        let dir;
        do {
          dir = rng.randomIntExcl(6);
        } while (!allowed(pos, dir));
        const [di, dj, dk] = STEPS[dir];
        const next = [pos[0] + di, pos[1] + dj, pos[2] + dk];
        moved = !(state[next[0]][next[1]][next[2]] > -1);
        if (moved) {
          [pos[0], pos[1], pos[2]] = next;
          setState(pos[0], pos[1], pos[2], dir);
        }
        attempts += 1;
      } while (!moved && attempts < 100);
      if (moved) steps += 1;
    } while (moved && steps < length);
  };

  for (let t = 0; t < 160; t += 1) randomPath();

  const voxels = grid3(voxelI, voxelJ, voxelK, false);
  for (let i = 0; i < sizeI; i += 1) {
    for (let j = 0; j < sizeJ; j += 1) {
      for (let k = 0; k < sizeK; k += 1) {
        const s = state[i][j][k];
        const base = [
          factor * i + padding,
          factor * j + padding,
          factor * k + padding,
        ];
        if (s === START) voxels[base[0]][base[1]][base[2]] = true;
        else if (STROKES[s]) {
          const [si, sj, sk] = STROKES[s];
          for (let r = 0; r < 2 * padding + 2; r += 1) {
            voxels[base[0] + si * r][base[1] + sj * r][base[2] + sk * r] = true;
          }
        }
      }
    }
  }

  return (i, j, k) => {
    if (i < 0 || j < 0 || k < 0 || i >= voxelI || j >= voxelJ || k >= voxelK) {
      return -1;
    }
    return voxels[i][j][k] ? 0 : -1;
  };
}
