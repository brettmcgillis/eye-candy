const FORMAT_ORDER = ['png', 'webp', 'svg', 'mp4'];
const MEDIA_ASSET_PATTERN = /\.(png|svg|webp|mp4)$/u;

export function assetFormat(asset) {
  return asset.path.split('.').pop().toLowerCase();
}

function mediaAssetKey(asset) {
  const format = assetFormat(asset);
  return format === 'mp4'
    ? asset.path
    : asset.path.slice(0, -(format.length + 1));
}

export function countMediaItems(collections) {
  return collections.reduce((total, collection) => {
    const keys = new Set(
      collection.assets
        .filter((asset) => MEDIA_ASSET_PATTERN.test(asset.path))
        .map(mediaAssetKey)
    );
    return total + keys.size;
  }, 0);
}

export function groupMediaAssets(assets, metadataAssets) {
  const metadataByKey = new Map();
  const metadataByDirectory = new Map();
  metadataAssets.forEach((asset) => {
    if (asset.path.endsWith('/props.json') || asset.path === 'props.json') {
      metadataByDirectory.set(
        asset.path.split('/').slice(0, -1).join('/'),
        asset
      );
      return;
    }
    metadataByKey.set(asset.path.replace(/\.json$/u, '.mp4'), asset);
  });
  const groups = new Map();
  assets.forEach((asset) => {
    const key = mediaAssetKey(asset);
    const group = groups.get(key) ?? {
      assets: [],
      key,
      metadataAsset:
        metadataByKey.get(key) ??
        metadataByDirectory.get(key.split('/').slice(0, -1).join('/')),
      name: key.split('/').slice(-2).join(' / '),
    };
    group.assets.push(asset);
    groups.set(key, group);
  });
  return [...groups.values()].map((group) => ({
    ...group,
    assets: group.assets.sort(
      (left, right) =>
        FORMAT_ORDER.indexOf(assetFormat(left)) -
        FORMAT_ORDER.indexOf(assetFormat(right))
    ),
  }));
}

export function isMediaAsset(asset) {
  return MEDIA_ASSET_PATTERN.test(asset.path);
}
