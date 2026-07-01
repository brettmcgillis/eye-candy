// Captures the current frame of the live R3F canvas (WebGL or WebGPU) onto a
// plain 2D canvas we control, synchronously, at the exact moment of capture.
export default function snapshotCanvas(sourceCanvas) {
  const { width, height } = sourceCanvas;
  const snapshot = document.createElement('canvas');
  snapshot.width = width;
  snapshot.height = height;
  snapshot.getContext('2d').drawImage(sourceCanvas, 0, 0, width, height);
  return snapshot;
}
