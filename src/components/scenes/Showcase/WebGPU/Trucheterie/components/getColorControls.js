// In blob field mode `bgColor` fills the blob silhouette — the area enclosed
// by the curves — rather than a square tile, since field cells don't abut.
// Keys must match presets/presets.js 1:1.
export default function getColorControls(snapshot = {}) {
  return {
    bgColor: {
      label: 'Tile Background',
      value: snapshot.bgColor ?? '#f5f2ea',
    },
    strokeColor: {
      label: 'Stroke Color',
      value: snapshot.strokeColor ?? '#141414',
    },
    sceneBgColor: {
      label: 'Scene Background',
      value: snapshot.sceneBgColor ?? '#f5f2ea',
    },
  };
}
