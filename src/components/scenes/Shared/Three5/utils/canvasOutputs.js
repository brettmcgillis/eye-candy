import { Color } from 'three';

export function cropStroke(canvas) {
  const { width, height } = canvas;
  const pixels = canvas.getContext('2d').getImageData(0, 0, width, height).data;
  let first = height;
  let last = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (pixels[(y * width + x) * 4 + 3] > 8) {
        first = Math.min(first, y);
        last = Math.max(last, y);
        break;
      }
    }
  }
  const top = Math.max(0, first - 2);
  const cropHeight = Math.max(4, last - top + 3);
  const output = document.createElement('canvas');
  output.width = width;
  output.height = cropHeight;
  output
    .getContext('2d')
    .drawImage(canvas, 0, top, width, cropHeight, 0, 0, width, cropHeight);
  return output;
}

export function heightMap(canvas) {
  const output = document.createElement('canvas');
  output.width = canvas.width;
  output.height = canvas.height;
  const ctx = output.getContext('2d');
  ctx.drawImage(canvas, 0, 0);
  const image = ctx.getImageData(0, 0, output.width, output.height);
  for (let i = 0; i < image.data.length; i += 4) {
    const value = Math.round(
      0.2126 * image.data[i] +
        0.7152 * image.data[i + 1] +
        0.0722 * image.data[i + 2]
    );
    image.data[i] = value;
    image.data[i + 1] = value;
    image.data[i + 2] = value;
    image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  return output;
}

export function unmatteInk(canvas, color) {
  const pigment = new Color(color).convertLinearToSRGB();
  const reference = 255 * (1 - Math.min(pigment.r, pigment.g, pigment.b));
  if (reference < 1) return canvas;
  const ctx = canvas.getContext('2d');
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = pixels;
  // Pigment compositing returns opaque pixels mixed with white paper, even on a clear target.
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0) {
      const coverage = Math.min(
        1,
        Math.max(255 - data[i], 255 - data[i + 1], 255 - data[i + 2]) /
          reference
      );
      if (coverage > 0) {
        const white = 255 * (1 - coverage);
        data[i] = (data[i] - white) / coverage;
        data[i + 1] = (data[i + 1] - white) / coverage;
        data[i + 2] = (data[i + 2] - white) / coverage;
        data[i + 3] *= coverage;
      } else data[i + 3] = 0;
    }
  }
  ctx.putImageData(pixels, 0, 0);
  return canvas;
}
