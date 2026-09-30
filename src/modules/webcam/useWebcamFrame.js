import { useEffect, useState } from 'react';

import { isMirrored, resolveFacing } from './facing';
import { openWebcam, stopWebcam } from './openWebcam';

// The webcam as RGBA bytes fitted inside `maxSize`, taken `rate` times a
// second while `enabled`. The front camera is mirrored like a selfie.
export default function useWebcamFrame(
  enabled,
  { facing = 'front', maxSize = 320, rate = 12 } = {}
) {
  const [frame, setFrame] = useState(null);
  const resolved = resolveFacing(facing);

  useEffect(() => {
    if (!enabled) {
      setFrame(null);
      return undefined;
    }
    let stream = null;
    let timer = null;
    let cancelled = false;
    const mirrored = isMirrored(resolved);
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });

    const grab = () => {
      if (!video.videoWidth) return;
      const scale = Math.min(
        1,
        maxSize / Math.max(video.videoWidth, video.videoHeight)
      );
      const width = Math.round(video.videoWidth * scale);
      const height = Math.round(video.videoHeight * scale);
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
      if (mirrored) context.setTransform(-1, 0, 0, 1, width, 0);
      else context.setTransform(1, 0, 0, 1, 0, 0);
      context.drawImage(video, 0, 0, width, height);
      const { data } = context.getImageData(0, 0, width, height);
      setFrame({ channels: 4, data, height, width });
    };

    openWebcam({ facing: resolved })
      .then((media) => {
        if (cancelled) {
          stopWebcam(media);
          return;
        }
        stream = media;
        video.srcObject = media;
        video.play();
        timer = setInterval(grab, 1000 / rate);
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.warn('[webcam]', error.name, error.message);
        setFrame(null);
      });

    return () => {
      cancelled = true;
      clearInterval(timer);
      stopWebcam(stream);
    };
  }, [enabled, maxSize, rate, resolved]);

  return frame;
}
