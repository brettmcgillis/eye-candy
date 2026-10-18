import { lerpColor } from '../../color';
import createNoise from '../../noise';
import { createHlRandom, createLcg } from '../../rng';
import { NUMLAYERS, OFFSETFACTOR, createField, rollField } from './field';
import createInclusions from './inclusions';
import {
  INCLUSION_PALETTES,
  LAYER_PALETTES,
  LAYER_X_PALETTES,
  pickPalette,
} from './palettes';

const DIMS = { I: 64, J: 100, K: 64 };
const NUMPALETTES = 4;
const NUMINCLUSIONS = 48;
const SECTORHALFSIZE = 40;
const BACKGROUND = [255, 250, 246];
const WHITE = [255, 255, 255];
const BLACK = [0, 0, 0];

export const PERSPECTIVE = { below: 2, inverted: 3, split: 0, top: 1 };

export const DEFAULT_VIEW = {
  cutI: false,
  cutK: false,
  drawHidden: false,
  iOffset: 0,
  jOffset: 0,
  kOffset: 0,
  layers: null,
  perspective: PERSPECTIVE.split,
};

export default function createAmbifeuille({
  colors = null,
  hash,
  tokenId = '',
  view = {},
}) {
  const v = { ...DEFAULT_VIEW, ...view };
  const hl = createHlRandom({ hash, tokenId });
  const noise = createNoise(hl.randomInt(1000000));
  const octaves = hl.randomInt(3, 5);
  noise.detail(octaves);
  const JRange = hl.randomInt(16, 64);
  const JTransition = hl.randomInt(4, 32);
  const roll = rollField(hl);
  const luminosity = hl.random(0.2, 0.5);
  const darkness = hl.random(0.5, 1.0);
  const blockLayer = hl.random(0.22, 0.34);
  const inclusionSeed = hl.randomInt(1000000);
  const flatColor = !(hl.random() > 0.05);

  const rolled = [];
  for (let i = 0; i < NUMLAYERS + 2; i += 1) {
    let table = LAYER_PALETTES;
    if (i === NUMLAYERS) table = LAYER_X_PALETTES;
    if (i === NUMLAYERS + 1) table = INCLUSION_PALETTES;
    rolled[i] = pickPalette(hl, table, flatColor);
  }
  const palettes = colors ? colors.mapPalettes(rolled) : rolled;
  const background = colors?.background ?? BACKGROUND;

  const inclusions = createInclusions({
    bounds: DIMS,
    count: NUMINCLUSIONS,
    hl,
    lcg: createLcg(inclusionSeed),
    offset: { i: 0, j: 0, k: 0 },
    sectorHalf: SECTORHALFSIZE,
    solid: NUMLAYERS + 1,
    spreadFactor: OFFSETFACTOR,
  });

  const layers = roll.layers.map((on, i) => v.layers?.[i] ?? on);
  const field = createField({
    dims: DIMS,
    inclusions,
    noise,
    params: { blockLayer, JRange },
    roll: { ...roll, layers },
    view: v,
  });

  const { I, J, K } = DIMS;
  const upsideDown = v.perspective === PERSPECTIVE.inverted;

  const flipAt = (i, k, level) => {
    if (v.perspective === PERSPECTIVE.split || upsideDown) {
      const flip =
        level -
          JTransition +
          2 * JTransition * noise(i * 0.017 + 53, k * 0.017 - 107) >
        J / 2;
      return upsideDown ? !flip : flip;
    }
    return v.perspective === PERSPECTIVE.below;
  };

  const skipCell = (i, k) => {
    if (v.cutI && !v.cutK) return i > I / 2;
    if (!v.cutI && v.cutK) return k > K / 2;
    if (v.cutI && v.cutK) {
      if (v.perspective !== PERSPECTIVE.below) return i > I / 2 && k > K / 2;
      return i < I / 2 && k < K / 2;
    }
    return false;
  };

  const addLevel = (lattice, raise, level) => {
    for (let i = 0; i < I; i += 1) {
      for (let k = 0; k < K; k += 1) {
        if (!skipCell(i, k)) {
          const flip = flipAt(i, k, level);
          const layer = field(
            Math.floor(i + v.iOffset * OFFSETFACTOR),
            Math.floor(level + v.jOffset * OFFSETFACTOR),
            Math.floor(k + v.kOffset * OFFSETFACTOR)
          );
          if (layer >= 0) {
            const material = layer >= NUMLAYERS ? layer : layer % NUMPALETTES;
            lattice.addCube(i, level, k, material, layer, flip, upsideDown);
            raise(k + K * i, level);
          }
        }
      }
    }
  };

  const levels = Array.from({ length: J }, (_, n) =>
    upsideDown ? J - 1 - n : n
  );

  const authoredColor = (tri) => {
    const pal = palettes[tri.material];
    if (!pal) return background;
    if (tri.orientation === 0 || tri.orientation === 2)
      return pal[tri.orientation];
    return lerpColor(pal[1], pal[3], (tri.j % J) / J);
  };
  const colorOf = (tri) =>
    colors?.recolor
      ? colors.recolor(tri, authoredColor(tri), J)
      : authoredColor(tri);

  const shade = (tri, { jHeight, ikHeight }) => {
    let col = colorOf(tri);
    if (v.drawHidden && tri.element < NUMLAYERS && !layers[tri.element])
      col = background;
    const idx = upsideDown ? tri.i + K * tri.k : tri.k + K * tri.i;
    const depth =
      (tri.orientation === 1 ? jHeight[idx] : ikHeight[idx]) - tri.j;
    const [lo, hi] =
      tri.material !== NUMLAYERS ? [luminosity, darkness] : [0, 1];
    const f = (depth / J) * (hi - lo) + lo;
    if (f > 0.5) return lerpColor(col, BLACK, 1.6 * (f - 0.5));
    return lerpColor(WHITE, col, 0.5 + 2.0 * f);
  };

  return {
    addLevel,
    background,
    center: { i: 0, j: 18, k: 0 },
    dims: DIMS,
    edgeThreshold: 2000,
    ink: colors?.ink ?? [0, 0, 0],
    field,
    inclusions,
    layers,
    levels,
    name: 'ambifeuille',
    palettes,
    reference: { height: 1300, width: 1000 },
    settings: {
      blockLayer,
      darkness,
      flatColor,
      inclusionSeed,
      JRange,
      JTransition,
      luminosity,
      octaves,
    },
    shade,
    view: v,
  };
}
