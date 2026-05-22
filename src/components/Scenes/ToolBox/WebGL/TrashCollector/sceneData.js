import {
  DYNAMIC_SCENE_ITEMS,
  FIXED_SCENE_ITEMS,
  SHOT_ASSET_OPTIONS,
} from '../../../shared/trashCollectionSource';

export const GROUND_Y = -1;

export const CAMERA = {
  position: [-2.5, 3.2, 20],
  fov: 40,
};

export const BACKGROUND = '#e8e8e8';
export const FOG_RANGE = [18, 34];
export const LIGHTING = {
  ambientIntensity: 0.85,
  directionalPosition: [8, 12, 10],
  directionalIntensity: 1.15,
};

export const GROUND_POSITION = [0, GROUND_Y - 0.02, 0];
export const GRID_POSITION = [0, GROUND_Y + 0.001, 0];

export const ASSET_GRID_COLUMNS = 6;
export const ASSET_GRID_COLUMN_SPACING = 2.2;
export const ASSET_GRID_ROW_SPACING = 3.05;
export const ASSET_GRID_POSITION = [0, GROUND_Y, 0];
export const ASSET_GRID_LABEL_HEIGHT = 1.6;

const ASSET_GRID_TILE_SIZE = 1.9;
const ASSET_GRID_FLOOR_PADDING_X = 4;
const ASSET_GRID_FLOOR_PADDING_Z = 8;

const EXPECTED_GRID_ASSET_SIZE_METERS = {
  dumpster: 2.4,
  'garbage-bags-pile': 1.25,
  'cardboard-leaning-2': 1.1,
  'cardboard-flat': 1.05,
  'cardboard-flat-2': 1.05,
  'garbage-bags-1': 0.95,
  'garbage-bags-2': 0.95,
  'garbage-bag': 0.85,
  'garbage-bag-1': 0.85,
  'cardboard-box': 0.75,
  'cardboard-box-5': 0.74,
  'cardboard-box-4': 0.72,
  'cardboard-box-2': 0.68,
  'cardboard-box-3': 0.66,
  'cardboard-box-1': 0.64,
  'newspaper-1': 0.58,
  'newspaper-2': 0.58,
  'newspaper-3': 0.58,
  'newspaper-stack': 0.58,
  'beer-case-1': 0.45,
  'beer-case-2': 0.45,
  bucket: 0.36,
  litter: 0.34,
  'whiskey-bottle': 0.12,
  'litter-2': 0.28,
  'beer-bottle-1': 0.24,
  'beer-bottle-2': 0.24,
  'vhs-tape': 0.19,
  'starbucks-cup': 0.17,
  'happy-meal': 0.16,
  'mc-cup': 0.14,
  'cigarette-butts': 0.12,
  'cassette-tape-1': 0.1,
  'cassette-tape-2': 0.1,
  'cassette-tape-3': 0.1,
  'floppy-disk': 0.09,
  'apple-core': 0.08,
};

function collectUniqueGridAssets(...assetGroups) {
  const seenKeys = new Set();

  return assetGroups.flat().filter((asset) => {
    if (asset.key === 'dumpster' || seenKeys.has(asset.key)) {
      return false;
    }

    seenKeys.add(asset.key);
    return true;
  });
}

function sortGridAssetsByExpectedSize(assets) {
  return assets
    .map((asset, index) => ({ asset, index }))
    .sort(
      (left, right) =>
        (left.asset.expectedSizeMeters ?? 0) -
          (right.asset.expectedSizeMeters ?? 0) || left.index - right.index
    )
    .map(({ asset }) => asset);
}

export const ASSET_GRID_OPTIONS = sortGridAssetsByExpectedSize(
  collectUniqueGridAssets(
    FIXED_SCENE_ITEMS,
    DYNAMIC_SCENE_ITEMS,
    SHOT_ASSET_OPTIONS
  ).map((asset) => ({
    ...asset,
    showcaseYOffset: asset.showcaseYOffset ?? 0,
    expectedSizeMeters: EXPECTED_GRID_ASSET_SIZE_METERS[asset.key],
  }))
);

const ASSET_GRID_ROW_COUNT = Math.ceil(
  ASSET_GRID_OPTIONS.length / ASSET_GRID_COLUMNS
);
const ASSET_GRID_FLOOR_WIDTH = Math.max(
  30,
  (ASSET_GRID_COLUMNS - 1) * ASSET_GRID_COLUMN_SPACING +
    ASSET_GRID_TILE_SIZE +
    ASSET_GRID_FLOOR_PADDING_X
);
const ASSET_GRID_FLOOR_DEPTH = Math.max(
  22,
  (ASSET_GRID_ROW_COUNT - 1) * ASSET_GRID_ROW_SPACING +
    ASSET_GRID_TILE_SIZE +
    ASSET_GRID_FLOOR_PADDING_Z
);
const GRID_HELPER_SIZE = Math.max(
  ASSET_GRID_FLOOR_WIDTH,
  ASSET_GRID_FLOOR_DEPTH
);
const GRID_HELPER_DIVISIONS = Math.max(18, Math.round(GRID_HELPER_SIZE / 2));

export const GROUND = {
  color: '#efefef',
  size: [ASSET_GRID_FLOOR_WIDTH, ASSET_GRID_FLOOR_DEPTH],
};

export const GRID = {
  args: [GRID_HELPER_SIZE, GRID_HELPER_DIVISIONS, '#cdcdcd', '#d9d9d9'],
};
