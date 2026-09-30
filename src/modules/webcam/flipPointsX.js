// Trackers report landmarks as seen by a selfie camera; a rear camera's
// points are flipped into that space so every consumer maps them one way.
// Normalized points flip about 0.5, metric world points about 0.
export default function flipPointsX(sets, around = 0.5) {
  return sets?.map((points) =>
    points.map((point) => ({ ...point, x: 2 * around - point.x }))
  );
}
