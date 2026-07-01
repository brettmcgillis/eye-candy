import applyOverlayCaptureFixups from './html2canvasFixups';

// Lazy singleton — a detached <canvas> (never attached to the document) used to
// composite the live R3F canvas with a cached overlay snapshot for recording.
// drawImage/captureStream work fine on a canvas that isn't in the DOM.
let canvas = null;
let ctx = null;

function ensureCanvas(width, height) {
  if (!canvas) {
    canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d', { alpha: false });
  }
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  return canvas;
}

// One-shot overlay rasterization — deliberately not re-run on an interval.
// html2canvas costs ~50-150ms; paying that once at record-start (not per frame,
// not even per second) is what keeps the compositor loop cheap while recording.
export async function captureOverlayBitmap() {
  const overlayEl = document.querySelector('.overlay');
  if (!overlayEl) return null;

  const { default: html2canvas } = await import('html2canvas');
  return html2canvas(overlayEl, {
    backgroundColor: null,
    useCORS: true,
    scale: window.devicePixelRatio,
    onclone: applyOverlayCaptureFixups,
  });
}

// Draws sourceCanvas (the live WebGL/WebGPU canvas — drawImage treats any canvas
// as a generic bitmap source, so this works the same for either renderer) plus a
// cached overlay bitmap onto the detached compositor canvas, every animation frame.
export function startCompositor({ sourceCanvas, overlayBitmap }) {
  const { width, height } = sourceCanvas;
  const compositorCanvas = ensureCanvas(width, height);
  let rafId = null;

  const drawFrame = () => {
    ctx.drawImage(sourceCanvas, 0, 0, width, height);
    if (overlayBitmap) {
      ctx.drawImage(overlayBitmap, 0, 0, width, height);
    }
    rafId = requestAnimationFrame(drawFrame);
  };

  drawFrame();

  return {
    canvas: compositorCanvas,
    stop: () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
    },
  };
}
