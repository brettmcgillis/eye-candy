import { lerpColor } from '../../color';
import createNoise from '../../noise';
import { createHlRandom } from '../../rng';
import { NUMLAYERS, createField, rollField } from './field';
import PALETTES from './palettes';
import {
  FACTOR_COLLECTION,
  WARP_LEVELS,
  createWarps,
  rollWarpChain,
} from './warps';

const SCALES = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5];
const FRAME = 80;
const BACKGROUND = [255, 250, 246];
const WHITE = [255, 255, 255];
const BLACK = [0, 0, 0];

function buildLevels(J, perFrame) {
  const levels = [];
  for (let frame = 2; frame <= J; frame += 1) {
    for (let r = 0; r < perFrame; r += 1) {
      if (r > 0) frame += 1;
      levels.push(frame - 1);
    }
  }
  return levels;
}

export const DEFAULT_VIEW = {
  iOffset: 0,
  jOffset: 0,
  kOffset: 0,
  layers: null,
  scale: 2,
  warpLevel: null,
};

export default function createDixfeuille({
  colors = null,
  hash,
  tokenId = '',
  view = {},
}) {
  const v = { ...DEFAULT_VIEW, ...view };
  const hl = createHlRandom({ hash, tokenId });
  const noise = createNoise(hl.randomInt(1000000));
  const scale = SCALES[v.scale];
  const dims = {
    I: Math.floor(scale * FRAME),
    J: Math.floor(scale * FRAME),
    K: Math.floor(scale * FRAME),
  };
  const roll = rollField(hl);
  const rolled = [0, 1, 2, 3].map(
    () => PALETTES[Math.floor(hl.random(PALETTES.length))]
  );
  const palettes = colors ? colors.mapPalettes(rolled) : rolled;
  const luminosity = hl.random(0.5, 1.0);
  const darkness = hl.random(0.5, 1.0);
  const factors = Array.from({ length: 10 }, () =>
    hl.randomElement(FACTOR_COLLECTION)
  );
  const warpFns = createWarps(dims, factors, scale);
  const chain = rollWarpChain(hl, warpFns.length);
  const rolledWarpLevel = hl.randomElement(WARP_LEVELS);
  const warpLevel = Math.max(0, Math.min(v.warpLevel ?? rolledWarpLevel, 16));

  const layers = roll.layers.map((on, i) => v.layers?.[i] ?? on);
  const field = createField({
    dims,
    fJ: FRAME,
    noise,
    roll: { ...roll, layers },
  });

  const { I, J, K } = dims;
  const warp = (i, j, k) => {
    let ijk = warpFns[chain[0]](i, j, k);
    for (let w = 1; w < warpLevel; w += 1) {
      ijk = warpFns[chain[w]](ijk[0], ijk[1], ijk[2]);
    }
    return ijk;
  };

  const addLevel = (lattice, raise, level) => {
    for (let i = 0; i < I; i += 1) {
      for (let k = 0; k < K; k += 1) {
        const layer = field(
          Math.floor((i + v.iOffset * 20) / scale),
          Math.floor((level + v.jOffset * 20) / scale),
          Math.floor((k + v.kOffset * 20) / scale)
        );
        if (layer >= 0) {
          const [wi, wj, wk] =
            warpLevel > 0 ? warp(i, level, k) : [i, level, k];
          lattice.addCube(wi, wj, wk, layer % 4, layer, false);
          raise(k + K * i, level);
        }
      }
    }
  };

  const authoredColor = (tri) => {
    const pal = palettes[tri.material];
    if (tri.orientation === 0 || tri.orientation === 2)
      return pal[tri.orientation];
    return lerpColor(pal[1], pal[3], (tri.j % FRAME) / FRAME);
  };
  const colorOf = (tri) =>
    colors?.recolor
      ? colors.recolor(tri, authoredColor(tri), J)
      : authoredColor(tri);

  const shade = (tri, { jHeight }) => {
    const col = colorOf(tri);
    if (tri.orientation !== 1) return col;
    const depth = jHeight[tri.k + K * tri.i] - tri.j;
    const f = (depth / J) * (darkness - (1 - luminosity)) + (1 - luminosity);
    if (f > 0.5) return lerpColor(col, BLACK, 2 * (f - 0.5));
    return lerpColor(WHITE, col, 2 * f);
  };

  return {
    addLevel,
    background: colors?.background ?? BACKGROUND,
    center: { i: I / 2, j: J / 2, k: K / 2 },
    dims,
    edgeThreshold: 1,
    ink: colors?.ink ?? [0, 0, 0],
    field,
    heightFloor: -1,
    lattice: { keepTies: true },
    layers,
    levels: buildLevels(J, Math.max(1, 4 * scale)),
    name: 'dixfeuille',
    numLayers: NUMLAYERS,
    palettes,
    reference: { height: 1350, width: 1350 },
    settings: {
      chain,
      darkness,
      factors,
      luminosity,
      warpLevel,
    },
    shade,
    unit: 1 / scale,
    view: v,
  };
}
