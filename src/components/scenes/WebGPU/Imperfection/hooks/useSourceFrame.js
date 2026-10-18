import { useEffect, useState } from 'react';

import { useWebcamFrame } from '@modules/webcam';

const SOURCE_MAX = 1024;

function resolveUrl(src) {
  if (/^(https?:|data:|blob:|\/)/u.test(src)) return src;
  return `${import.meta.env.BASE_URL}${src}`;
}

// The decode the CLI does with sharp: fit inside SOURCE_MAX, never enlarged,
// RGBA bytes with row 0 at the top.
function decode(image) {
  const scale = Math.min(
    1,
    SOURCE_MAX / image.naturalWidth,
    SOURCE_MAX / image.naturalHeight
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

function useImageFrame(src) {
  const [loaded, setLoaded] = useState({ frame: null, src: '' });

  useEffect(() => {
    if (!src) return undefined;
    let cancelled = false;
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      if (!cancelled) setLoaded({ frame: decode(image), src });
    };
    image.onerror = () => {
      if (!cancelled) setLoaded({ frame: null, src });
    };
    image.src = resolveUrl(src);
    return () => {
      cancelled = true;
    };
  }, [src]);

  return src && loaded.src === src ? loaded.frame : null;
}

// What the field paints from when Colour From is Image: the live webcam or
// the image at sourceImage; null otherwise.
export default function useSourceFrame(config) {
  const imageMode = config.fieldSource === 'image';
  const webcam = useWebcamFrame(imageMode && config.sourceWebcam, {
    facing: config.webcamFacing,
    maxSize: 640,
    rate: 15,
  });
  const image = useImageFrame(
    imageMode && !config.sourceWebcam ? config.sourceImage : ''
  );
  if (!imageMode) return null;
  return config.sourceWebcam ? webcam : image;
}
