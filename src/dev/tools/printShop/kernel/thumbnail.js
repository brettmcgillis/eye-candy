// A small z-buffered software rasterizer, so every print (batches from the
// CLI included) gets the same gallery thumbnail with no GPU: an orthographic
// three-quarter view, part colours under a key/fill light, on a neutral grey.
import creasedNormals from './normals';

const DEG = Math.PI / 180;

const hexToRgb = (hex) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);

export default function renderThumbnail(
  bodies,
  {
    azimuth = 35,
    background = '#9a9ca1',
    elevation = 22,
    height = 400,
    width = 400,
  } = {}
) {
  const ca = Math.cos(azimuth * DEG);
  const sa = Math.sin(azimuth * DEG);
  const ce = Math.cos(elevation * DEG);
  const se = Math.sin(elevation * DEG);
  // View basis: right, up, toward the camera.
  const right = [ca, 0, -sa];
  const up = [-sa * se, ce, -ca * se];
  const toward = [sa * ce, se, ca * ce];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const light = [0.45, 0.8, 0.4];
  const lightLength = Math.hypot(...light);
  const key = light.map((v) => v / lightLength);

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  bodies.forEach(({ model }) => {
    const p = model.positions;
    for (let i = 0; i < p.length; i += 3) {
      const v = [p[i], p[i + 1], p[i + 2]];
      const x = dot(v, right);
      const y = dot(v, up);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  });
  const scale =
    (Math.min(width, height) * 0.86) / Math.max(maxX - minX, maxY - minY);
  const ox = width / 2 - ((minX + maxX) / 2) * scale;
  const oy = height / 2 + ((minY + maxY) / 2) * scale;

  const pixels = new Uint8ClampedArray(width * height * 4);
  const depth = new Float32Array(width * height).fill(-Infinity);
  const bg = hexToRgb(background);
  for (let i = 0; i < width * height; i += 1) {
    pixels[i * 4] = bg[0] * 255;
    pixels[i * 4 + 1] = bg[1] * 255;
    pixels[i * 4 + 2] = bg[2] * 255;
    pixels[i * 4 + 3] = 255;
  }

  bodies.forEach(({ model }) => {
    const { parts, triPart } = model;
    const creased = creasedNormals(model);
    const { indices, normals, positions: p } = creased;
    const partRgb = parts.map((part) => hexToRgb(part.color));
    const lit = new Float32Array(p.length / 3);
    for (let v = 0; v < lit.length; v += 1) {
      const n = [normals[v * 3], normals[v * 3 + 1], normals[v * 3 + 2]];
      lit[v] =
        0.28 +
        0.62 * Math.max(0, dot(n, key)) +
        0.18 * Math.max(0, dot(n, toward));
    }
    const colorOf = (v, k) => creased.colors[v * 3 + k];
    const sx = new Float32Array(p.length / 3);
    const sy = new Float32Array(p.length / 3);
    const sz = new Float32Array(p.length / 3);
    for (let v = 0; v < p.length / 3; v += 1) {
      const point = [p[v * 3], p[v * 3 + 1], p[v * 3 + 2]];
      sx[v] = ox + dot(point, right) * scale;
      sy[v] = oy - dot(point, up) * scale;
      sz[v] = dot(point, toward);
    }
    for (let t = 0; t < indices.length; t += 3) {
      const a = indices[t];
      const b = indices[t + 1];
      const c = indices[t + 2];
      const area =
        (sx[b] - sx[a]) * (sy[c] - sy[a]) - (sx[c] - sx[a]) * (sy[b] - sy[a]);
      // Screen y runs down, so a front face is clockwise here.
      if (area < 0) {
        const rgb = creased.colors
          ? [0, 1, 2].map(
              (k) => (colorOf(a, k) + colorOf(b, k) + colorOf(c, k)) / 3
            )
          : partRgb[triPart[t / 3]];
        const x0 = Math.max(0, Math.floor(Math.min(sx[a], sx[b], sx[c])));
        const x1 = Math.min(
          width - 1,
          Math.ceil(Math.max(sx[a], sx[b], sx[c]))
        );
        const y0 = Math.max(0, Math.floor(Math.min(sy[a], sy[b], sy[c])));
        const y1 = Math.min(
          height - 1,
          Math.ceil(Math.max(sy[a], sy[b], sy[c]))
        );
        for (let y = y0; y <= y1; y += 1) {
          for (let x = x0; x <= x1; x += 1) {
            const px = x + 0.5;
            const py = y + 0.5;
            const w0 =
              ((sx[b] - px) * (sy[c] - py) - (sx[c] - px) * (sy[b] - py)) /
              area;
            const w1 =
              ((sx[c] - px) * (sy[a] - py) - (sx[a] - px) * (sy[c] - py)) /
              area;
            const w2 = 1 - w0 - w1;
            if (w0 >= 0 && w1 >= 0 && w2 >= 0) {
              const z = w0 * sz[a] + w1 * sz[b] + w2 * sz[c];
              const o = y * width + x;
              if (z > depth[o]) {
                depth[o] = z;
                const shade = w0 * lit[a] + w1 * lit[b] + w2 * lit[c];
                pixels[o * 4] = Math.min(1, rgb[0] * shade) * 255;
                pixels[o * 4 + 1] = Math.min(1, rgb[1] * shade) * 255;
                pixels[o * 4 + 2] = Math.min(1, rgb[2] * shade) * 255;
              }
            }
          }
        }
      }
    }
  });
  return { data: pixels, height, width };
}
