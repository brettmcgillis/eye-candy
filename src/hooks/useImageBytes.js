import { useEffect, useState } from 'react';

function resolveUrl(src) {
  if (/^(https?:|data:|blob:|\/)/u.test(src)) return src;
  return `${import.meta.env.BASE_URL}${src}`;
}

// An image (a path under public/, or any URL) decoded to RGBA bytes, fitted
// inside `maxSize` and never enlarged.
export default function useImageBytes(src, { maxSize = 1024 } = {}) {
  const [loaded, setLoaded] = useState({ bytes: null, src: '' });

  useEffect(() => {
    if (!src) return undefined;
    let cancelled = false;
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      if (cancelled) return;
      const scale = Math.min(
        1,
        maxSize / image.naturalWidth,
        maxSize / image.naturalHeight
      );
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(image, 0, 0, width, height);
      const { data } = context.getImageData(0, 0, width, height);
      setLoaded({ bytes: { channels: 4, data, height, width }, src });
    };
    image.onerror = () => {
      if (!cancelled) setLoaded({ bytes: null, src });
    };
    image.src = resolveUrl(src);
    return () => {
      cancelled = true;
    };
  }, [maxSize, src]);

  return src && loaded.src === src ? loaded.bytes : null;
}
