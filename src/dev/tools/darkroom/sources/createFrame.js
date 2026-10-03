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
// `version` moves whenever a new picture lands.
export default function createFrame() {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const scratch = document.createElement('canvas');
  const scratchContext = scratch.getContext('2d', { willReadFrequently: true });
  const cache = new Map();
  let version = 0;

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

    draw(media, mediaWidth, mediaHeight, { mirrored = false } = {}) {
      if (!mediaWidth || !mediaHeight) return false;
      const size = fitInside(mediaWidth, mediaHeight, SOURCE_MAX);
      if (canvas.width !== size.width) canvas.width = size.width;
      if (canvas.height !== size.height) canvas.height = size.height;
      context.setTransform(
        mirrored ? -1 : 1,
        0,
        0,
        1,
        mirrored ? size.width : 0,
        0
      );
      context.drawImage(media, 0, 0, size.width, size.height);
      version += 1;
      cache.clear();
      return true;
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
