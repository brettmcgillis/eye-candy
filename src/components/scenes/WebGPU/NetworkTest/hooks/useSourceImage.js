import { useEffect, useState } from 'react';

import { SOURCE_IMAGE_MAX } from '@modules/networkTest';

function resolveUrl(src) {
  if (/^(https?:|data:|blob:|\/)/u.test(src)) return src;
  return `${import.meta.env.BASE_URL}${src}`;
}

// The same decode the CLI does with sharp: fit inside SOURCE_IMAGE_MAX, never
// enlarged, as RGBA bytes.
function decode(image) {
  const scale = Math.min(
    1,
    SOURCE_IMAGE_MAX / image.naturalWidth,
    SOURCE_IMAGE_MAX / image.naturalHeight
  );
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(image, 0, 0, width, height);
  const { data } = context.getImageData(0, 0, width, height);
  return { channels: 4, data, height, width };
}

export default function useSourceImage(src) {
  const [loaded, setLoaded] = useState({ image: null, src: '' });

  useEffect(() => {
    if (!src) return undefined;
    let cancelled = false;
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      if (!cancelled) setLoaded({ image: decode(image), src });
    };
    image.onerror = () => {
      if (!cancelled) setLoaded({ image: null, src });
    };
    image.src = resolveUrl(src);
    return () => {
      cancelled = true;
    };
  }, [src]);

  return src && loaded.src === src ? loaded.image : null;
}
