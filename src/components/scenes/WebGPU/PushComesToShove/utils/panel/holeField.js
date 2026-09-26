import { fbm2 } from '@utils/noise2d';

function smoothstep(edge0, edge1, x) {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

// Signed 2D distance to the cut-outs, negative inside a hole. The noise is a
// level set, not a distance, so it is divided by its own gradient: without
// that the bevel would be fat where the noise is flat and razor thin where it
// is steep.
export default function buildHoleField({
  cols,
  rows,
  originX,
  originY,
  step,
  holeScale,
  holeThreshold,
  holeWarp,
  holeMargin,
  fieldHalfWidth,
  fieldHalfHeight,
  seed,
}) {
  const noise = new Float32Array(cols * rows);
  const options = { seed, octaves: 4, gain: 0.5 };
  const warpOptions = { seed: seed + 7919, octaves: 3, gain: 0.5 };

  for (let j = 0; j < rows; j += 1) {
    const y = originY + j * step;
    for (let i = 0; i < cols; i += 1) {
      const x = originX + i * step;
      const wx =
        fbm2(
          x * holeScale * 0.5 + 5.2,
          y * holeScale * 0.5 + 1.3,
          warpOptions
        ) - 0.5;
      const wy =
        fbm2(
          x * holeScale * 0.5 + 9.7,
          y * holeScale * 0.5 + 4.1,
          warpOptions
        ) - 0.5;
      const n = fbm2(
        (x + wx * holeWarp) * holeScale,
        (y + wy * holeWarp) * holeScale,
        options
      );
      const edge = Math.min(
        fieldHalfWidth - Math.abs(x),
        fieldHalfHeight - Math.abs(y)
      );
      const mask = smoothstep(0, holeMargin, edge);
      noise[j * cols + i] = n - (1 - mask);
    }
  }

  const distance = new Float32Array(cols * rows);
  const at = (i, j) =>
    noise[
      Math.min(Math.max(j, 0), rows - 1) * cols +
        Math.min(Math.max(i, 0), cols - 1)
    ];

  for (let j = 0; j < rows; j += 1) {
    for (let i = 0; i < cols; i += 1) {
      const gx = (at(i + 1, j) - at(i - 1, j)) / (2 * step);
      const gy = (at(i, j + 1) - at(i, j - 1)) / (2 * step);
      const gradient = Math.max(Math.hypot(gx, gy), holeScale * 0.15);
      distance[j * cols + i] = (holeThreshold - noise[j * cols + i]) / gradient;
    }
  }

  return distance;
}
