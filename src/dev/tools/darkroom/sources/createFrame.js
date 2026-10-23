import { FRAMING_DEFAULTS } from './framing';

export const SOURCE_MAX = 1600;

function fitInside(width, height, max) {
  const scale = Math.min(1, max / Math.max(width, height));
  return {
    height: Math.max(1, Math.round(height * scale)),
    width: Math.max(1, Math.round(width * scale)),
  };
}

// The current source picture: a canvas the GPU techniques upload as a
// texture, and RGBA bytes at a capped size for the three-free kernels.
// `version` moves whenever a new picture lands. Framing zooms, rotates and
// recentres the picture inside its own bounds, so every technique sees it.
export default function createFrame() {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const scratch = document.createElement('canvas');
  const scratchContext = scratch.getContext('2d', { willReadFrequently: true });
  const cache = new Map();
  let version = 0;
  let framing = FRAMING_DEFAULTS;
  let last = null;

  function draw(media, mediaWidth, mediaHeight, { mirrored = false } = {}) {
    if (!mediaWidth || !mediaHeight) return false;
    last = [media, mediaWidth, mediaHeight, { mirrored }];
    const { height, width } = fitInside(mediaWidth, mediaHeight, SOURCE_MAX);
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    const { backdrop, backdropColor, centerX, centerY, rotate, zoom } = framing;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, width, height);
    if (backdrop) {
      context.fillStyle = backdropColor;
      context.fillRect(0, 0, width, height);
    }
    context.translate(width / 2, height / 2);
    context.rotate((rotate * Math.PI) / 180);
    context.scale(zoom, zoom);
    context.translate(-centerX * width, centerY * height);
    context.scale(mirrored ? -1 : 1, 1);
    context.drawImage(media, -width / 2, -height / 2, width, height);
    version += 1;
    cache.clear();
    return true;
  }

  return {
    canvas,

    get version() {
      return version;
    },

    get width() {
      return canvas.width;
    },

    get height() {
      return canvas.height;
    },

    draw,

    setFraming(next) {
      framing = next;
      if (last) draw(...last);
    },

    pixels(maxSize = 1024) {
      if (!cache.has(maxSize)) {
        const { height, width } = fitInside(
          canvas.width,
          canvas.height,
          maxSize
        );
        let data;
        if (width === canvas.width && height === canvas.height) {
          ({ data } = context.getImageData(0, 0, width, height));
        } else {
          scratch.width = width;
          scratch.height = height;
          scratchContext.drawImage(canvas, 0, 0, width, height);
          ({ data } = scratchContext.getImageData(0, 0, width, height));
        }
        cache.set(maxSize, { channels: 4, data, height, width });
      }
      return cache.get(maxSize);
    },
  };
}
