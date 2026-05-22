import {
  ASSET_GRID_COLUMNS,
  ASSET_GRID_COLUMN_SPACING,
  ASSET_GRID_OPTIONS,
  ASSET_GRID_ROW_SPACING,
} from './sceneData';

function formatAssetStat(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => formatAssetStat(entry)).join(' x ');
  }

  return Number(value)
    .toFixed(2)
    .replace(/\.00$/, '')
    .replace(/(\.\d)0$/, '$1');
}

function getAssetComponentName(asset) {
  return asset.Component.displayName ?? asset.Component.name ?? asset.key;
}

export function getAssetShowcaseLabel(asset) {
  const lines = [getAssetComponentName(asset)];

  if (typeof asset.expectedSizeMeters === 'number') {
    lines.push(`expected: ${formatAssetStat(asset.expectedSizeMeters)} m`);
  }

  lines.push(`scale: ${formatAssetStat(asset.scale ?? 1)}`);

  if (typeof asset.mass === 'number') {
    lines.push(`mass: ${formatAssetStat(asset.mass)}`);
  }

  return lines.join('\n');
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
