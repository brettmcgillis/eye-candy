import { jitterHash } from '@modules/subdivision';

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smoothstep = (a, b, v) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const fract = (v) => v - Math.floor(v);
const seeded = (hash, seed) =>
  fract(Math.sin(hash * 12.9898 + seed * 78.233) * 43758.5453);

export const levelFactor = (depth, maxDepth, bias) =>
  maxDepth > 0 ? (depth / maxDepth) ** bias : 0;

// Each driver gives 0..1 and they average by weight, so Height stays the
// ceiling whatever the mix. Depth jitter spreads about the middle, wider the
// finer the cell, which keeps coarse cells flat and fine detail rough.
export default function computeHeights(piece, config) {
  const { canvas, field, focal, maxDepth, nodes } = piece;
  const drivers = [
    [
      config.depthWeight,
      (node) =>
        0.5 +
        (seeded(jitterHash(node), config.heightSeed) - 0.5) *
          levelFactor(node.depth, maxDepth, config.depthBias),
    ],
    [
      config.lumaWeight,
      (node) => (config.lumaInvert ? 1 - node.lum : node.lum),
    ],
    [config.fieldWeight, (node) => clamp01(field(node.fcx, node.fcy))],
    [
      config.focalWeight,
      (node) => {
        const nearest = Math.min(
          ...focal.map(([fx, fy]) =>
            Math.hypot(
              node.fcx - fx * canvas.width,
              node.fcy - fy * canvas.height
            )
          )
        );
        return 1 - smoothstep(0, config.focalFalloff, nearest / canvas.height);
      },
    ],
  ].filter(([weight]) => weight > 0);
  const total = drivers.reduce((sum, [weight]) => sum + weight, 0);

  const heights = new Float32Array(nodes.length);
  nodes.forEach((node, i) => {
    const h01 =
      total > 0
        ? drivers.reduce(
            (sum, [weight, read]) => sum + weight * read(node),
            0
          ) / total
        : 0;
    heights[i] = config.baseHeight + config.reliefHeight * h01;
  });
  return heights;
}
