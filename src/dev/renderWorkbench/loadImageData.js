const decoded = new Map();

// A source image as the RGBA bytes a kernel samples, the page's twin of a
// CLI's sharp decode: a path under public/ (images/…), fitted inside `max`
// px, never enlarged.
export default function loadImageData(source, max = 1024) {
  if (!source) return Promise.resolve(null);
  const key = `${source}@${max}`;
  if (!decoded.has(key)) {
    decoded.set(
      key,
      (async () => {
        const url = /^(https?:|blob:|data:|\/)/u.test(source)
          ? source
          : `/${source}`;
        const bitmap = await createImageBitmap(
          await (await fetch(url)).blob(),
          { imageOrientation: 'from-image' }
        );
        const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
        const width = Math.round(bitmap.width * scale);
        const height = Math.round(bitmap.height * scale);
        const canvas = new OffscreenCanvas(width, height);
        const context = canvas.getContext('2d');
        context.drawImage(bitmap, 0, 0, width, height);
        const { data } = context.getImageData(0, 0, width, height);
        return { channels: 4, data, height, width };
      })()
    );
  }
  return decoded.get(key);
}
