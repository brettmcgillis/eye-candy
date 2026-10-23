const FORMAT_ORDER = ['webp', 'png', 'svg', 'mp4', 'webm'];
const MEDIA_ASSET_PATTERN = /\.(png|svg|webp|mp4|webm)$/u;
const VIDEO_FORMATS = new Set(['mp4', 'webm']);

export function assetFormat(asset) {
  return asset.path.split('.').pop().toLowerCase();
}

export const isVideoAsset = (asset) => VIDEO_FORMATS.has(assetFormat(asset));

// A clip's formats share one key, apart from any still of the same name.
function mediaAssetKey(asset) {
  const stem = asset.path.slice(0, -(assetFormat(asset).length + 1));
  return isVideoAsset(asset) ? `${stem}.video` : stem;
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
    metadataByKey.set(asset.path.replace(/\.json$/u, '.video'), asset);
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
      name: key
        .replace(/\.video$/u, '')
        .split('/')
        .slice(-2)
        .join(' / '),
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

// A cached WebP of media under output/ or public/images/ (repo-relative):
// a dense plot SVG is megabytes of path, too heavy to show as an <img>.
export const thumbnailUrl = (path, size = 320) =>
  `/dev-api/thumbs?path=${encodeURIComponent(path)}&size=${size}`;

// A plot's link into the Plotterizer: the SVG, plus the sidecar and tool it
// needs to re-render the generation at another plot size.
export function plotterHref(group, tool) {
  const svg = group.assets.find((asset) => assetFormat(asset) === 'svg');
  if (!svg) return null;
  const params = new URLSearchParams({ name: group.name, svg: svg.url });
  if (group.metadataAsset) params.set('props', group.metadataAsset.url);
  if (tool) params.set('tool', tool);
  return `/dev/plotterizer?${params}`;
}

export function isMediaAsset(asset) {
  return MEDIA_ASSET_PATTERN.test(asset.path);
}
