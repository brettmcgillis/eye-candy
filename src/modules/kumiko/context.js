import { createFavourites, patternPool } from './assign';
import { nestedFrames, regionOf } from './frames';
import { insetRect, rectPolygon } from './geometry';
import { createImageSampler } from './image';
import { TIER } from './patterns';
import tileRect from './tilings';
import { createZoner, fold } from './zones';

const DEG = Math.PI / 180;

// Everything a panel's cells are decided against: its rects and frames, the
// zones, the pattern pool, strip widths per level and, when the panel is
// driven by an image, the sampler over it.
export default function createPanelContext(config, { image = null } = {}) {
  const width = config.panelWidth;
  const height = config.panelHeight;
  const inner = insetRect([0, 0, width, height], config.borderWidth);
  const center = [width / 2, height / 2];
  const half = Math.max(width, height) / 2;
  const normalize = ([x, y]) => [
    (x - center[0]) / half,
    (y - center[1]) / half,
  ];

  const frames = nestedFrames(inner, {
    count: config.nestFrames,
    step: config.nestStep,
    width: Math.max(config.jigumiWidth * 1.8, config.borderWidth * 0.45),
  });
  const zoner = createZoner({
    count: config.zoneCount,
    mode: config.zoneMode,
    seed: config.seed,
  });
  const perRegion =
    config.zoneMode === 'none' ? 1 : Math.round(config.zoneCount);
  const zoneOf = (p) =>
    regionOf(frames, p) * perRegion +
    zoner(fold(normalize(p), config.symmetry));

  const pool = patternPool(config);
  const widths = (level) => {
    const thin = config.levelThinning ** level;
    return {
      [TIER.jigumi]: config.jigumiWidth * thin,
      [TIER.infill]: config.infillWidth * thin,
      [TIER.detail]: config.detailWidth * thin,
    };
  };
  const sampler =
    image && config.imageMode !== 'off'
      ? createImageSampler(image, inner, {
          contrast: config.imageContrast,
          fit: config.imageFit,
          invert: config.imageInvert,
        })
      : null;

  return {
    cells: () =>
      tileRect(config.tiling, {
        origin: center,
        rect: inner,
        rotation: config.gridRotation * DEG,
        size: config.cellSize,
      }),
    center,
    config,
    favourite: createFavourites(config, pool),
    frames,
    height,
    inner,
    innerPoly: rectPolygon(inner),
    normalize,
    pool,
    ramps: new Map(),
    sampler,
    width,
    widths,
    zoneCount: (frames.length + 1) * perRegion,
    zoneOf,
  };
}
