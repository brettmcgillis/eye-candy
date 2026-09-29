import { useEffect, useState } from 'react';

// Coarse on purpose: the variance driver compares a handful of samples per
// cell, and the tree is rebuilt on every frame taken.
const FRAME_MAX = 480;

// The webcam as a source image, mirrored like a selfie, sampled `rate` times
// a second as the { data, width, height, channels } the kernel reads.
export default function useWebcamImage(enabled, rate) {
  const [image, setImage] = useState(null);

  useEffect(() => {
    if (!enabled) {
      setImage(null);
      return undefined;
    }
    let stream = null;
    let timer = null;
    let cancelled = false;
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });

    const grab = () => {
      if (!video.videoWidth) return;
      const scale = Math.min(
        1,
        FRAME_MAX / Math.max(video.videoWidth, video.videoHeight)
      );
      const width = Math.round(video.videoWidth * scale);
      const height = Math.round(video.videoHeight * scale);
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
      context.setTransform(-1, 0, 0, 1, width, 0);
      context.drawImage(video, 0, 0, width, height);
      const { data } = context.getImageData(0, 0, width, height);
      setImage({ channels: 4, data, height, width });
    };

    navigator.mediaDevices
      .getUserMedia({ audio: false, video: { facingMode: 'user' } })
      .then((media) => {
        if (cancelled) {
          media.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = media;
        video.srcObject = media;
        video.play();
        timer = setInterval(grab, 1000 / rate);
      })
      .catch(() => setImage(null));

    return () => {
      cancelled = true;
      clearInterval(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [enabled, rate]);

  return image;
}
