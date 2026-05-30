import {
  ASSET_GRID_COLUMNS,
  ASSET_GRID_COLUMN_SPACING,
  ASSET_GRID_OPTIONS,
  ASSET_GRID_ROW_SPACING,
} from './sceneData';

const ASSET_LABEL_SEGMENT_OVERRIDES = Object.freeze({
  mc: 'Mc',
  vhs: 'VHS',
});

function formatAssetKey(assetKey) {
  return assetKey
    .split('-')
    .filter(Boolean)
    .map((segment) => {
      if (ASSET_LABEL_SEGMENT_OVERRIDES[segment]) {
        return ASSET_LABEL_SEGMENT_OVERRIDES[segment];
      }

      if (/^\d+$/.test(segment)) {
        return segment;
      }

      return segment.charAt(0).toUpperCase() + segment.slice(1);
    })
    .join(' ');
}

function getAssetComponentName(asset) {
  if (typeof asset.Component.displayName === 'string') {
    return asset.Component.displayName;
  }

  return formatAssetKey(asset.key);
}

export function getAssetShowcaseLabel(asset) {
  return getAssetComponentName(asset);
}

export function getAssetGridCellPosition(index) {
  const row = Math.floor(index / ASSET_GRID_COLUMNS);
  const column = index % ASSET_GRID_COLUMNS;
  const rowCount = Math.ceil(ASSET_GRID_OPTIONS.length / ASSET_GRID_COLUMNS);

  return [
    (column - (ASSET_GRID_COLUMNS - 1) / 2) * ASSET_GRID_COLUMN_SPACING,
    0,
    ((rowCount - 1) / 2 - row) * ASSET_GRID_ROW_SPACING,
  ];
}
