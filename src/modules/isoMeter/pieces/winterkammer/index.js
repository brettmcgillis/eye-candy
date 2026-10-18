import { lerpColor } from '../../color';
import rollLayout from './layouts';
import { BACKGROUND, LINE_COLOR, rollPalettes } from './palettes';
import { createMasterRng } from './rng';
import { BUILDING_KINDS, createTile } from './tiles';

export function zoomForAspect(aspect) {
  if (aspect < 1)
    return ((aspect - 9 / 16) / (1 - 9 / 16)) * (1.16 - 1.05) + 1.05;
  if (aspect > 1) return ((aspect - 1) / (16 / 9 - 1)) * (1.1 - 1.16) + 1.16;
  return 1.16;
}

const triple = (list, n) => ({
  i: list[3 * n],
  j: list[3 * n + 1],
  k: list[3 * n + 2],
});
const dimsOf = (list, n) => ({
  I: list[3 * n],
  J: list[3 * n + 1],
  K: list[3 * n + 2],
});

export default function createWinterkammer({
  aspect = 1,
  colors = null,
  hash,
}) {
  const master = createMasterRng(hash);
  const baseZoom = zoomForAspect(aspect);
  const seeds = Array.from({ length: 32 }, () => master.randomSeed());
  const rolled = rollPalettes(master);
  const palettes = colors ? colors.mapPalettes(rolled) : rolled;
  const background = colors?.background ?? BACKGROUND;
  const lineColor = colors?.ink ?? LINE_COLOR;
  const mirroredX = master.roll() < 0.5;
  const mirroredY = master.roll() < 0.5;
  const layout = rollLayout(master);
  const env = { background, baseZoom, palettes, recolor: colors?.recolor };

  const tiles = layout.kinds.map((kind, n) => {
    const dims = dimsOf(layout.dims, n);
    const tile = createTile(
      {
        aspectRange: {
          max: layout.aspectRange[2 * n + 1],
          min: layout.aspectRange[2 * n],
        },
        center: triple(layout.centers, n),
        dims,
        kind,
        offsets:
          kind === 'sigil'
            ? { i: 0, j: 0, k: 0 }
            : { i: dims.I, j: dims.J, k: dims.K },
        seed: seeds[n],
        size: {
          padding: layout.size[4 * n + 3],
          sizeI: layout.size[4 * n],
          sizeJ: layout.size[4 * n + 1],
          sizeK: layout.size[4 * n + 2],
        },
        zoom: layout.zoom[n],
      },
      env
    );
    if (BUILDING_KINDS.includes(kind)) tile.delay = -master.randomIntExcl(64);
    return tile;
  });
  tiles.forEach((tile) => tile.prepare());

  const backgroundTile = createTile(
    {
      center: { i: 0, j: 0, k: 0 },
      dims: { I: 48, J: 48, K: 48 },
      kind: 'background',
      seed: master.randomSeed(),
      zoom: 16,
    },
    env
  );
  backgroundTile.prepare();

  return {
    aspect,
    background,
    backgroundTile,
    baseZoom,
    hash,
    layout,
    inks: {
      background: lerpColor(background, lineColor, 0.85),
      final: lerpColor(background, lineColor, 0.8),
    },
    lineColor,
    master,
    mirroredX,
    mirroredY,
    name: 'winterkammer',
    palettes,
    refSize: layout.refSize,
    tiles,
  };
}
