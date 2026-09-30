import { resolveFacing } from './facing';

const FACING_MODE = { back: 'environment', front: 'user' };

export function openWebcam({ facing = 'front', height, width } = {}) {
  if (!navigator.mediaDevices?.getUserMedia) {
    return Promise.reject(
      new Error(
        `Webcam unavailable (secure context: ${window.isSecureContext})`
      )
    );
  }
  return navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: FACING_MODE[resolveFacing(facing)],
      ...(width && { width }),
      ...(height && { height }),
    },
  });
}

export function stopWebcam(stream) {
  stream?.getTracks().forEach((track) => track.stop());
}
