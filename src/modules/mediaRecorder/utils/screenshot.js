import buildCaptureMetadata from './captureMetadata';
import downloadBlob from './download';
import applyOverlayCaptureFixups from './html2canvasFixups';
import injectPngMetadata from './pngMetadata';

// html2canvas's own canvas-cloning logic predates WebGPU: it probes a canvas
// via getContext('2d') / getContext('webgl'|'webgl2') to decide how to read
// it back, neither of which recognizes a canvas already bound to 'webgpu', and
// failures along that path are swallowed silently. Rather than fight that
// code path (mutating the cloned canvas's own width/height/content ran into
// its own issues — html2canvas builds its container tree, including cached
// intrinsic dimensions, from whatever's in the clone, and canvas-specific
// handling elsewhere in its pipeline is fragile in ways that are hard to
// predict), replace the cloned canvas entirely with a plain <img> showing a
// snapshot the caller already captured (see canvasSnapshot.js). An <img> goes
// through html2canvas's ordinary, far more battle-tested image-rendering path
// instead of its canvas-specific one.
export default async function captureScreenshot(
  fileName,
  sceneName,
  preCapturedFrame
) {
  const { default: html2canvas } = await import('html2canvas');

  const canvas = await html2canvas(document.body, {
    useCORS: true,
    allowTaint: false,
    scale: window.devicePixelRatio,
    onclone: (clonedDoc) => {
      applyOverlayCaptureFixups(clonedDoc);

      const clonedCanvas = preCapturedFrame
        ? clonedDoc.querySelector('canvas')
        : null;
      if (clonedCanvas) {
        const img = clonedDoc.createElement('img');
        img.src = preCapturedFrame.toDataURL('image/png');
        img.className = clonedCanvas.className;
        img.style.cssText = clonedCanvas.style.cssText;
        clonedCanvas.replaceWith(img);
      }
    },
  });

  canvas.toBlob(async (blob) => {
    let outBlob = blob;

    try {
      const arrayBuffer = await blob.arrayBuffer();
      const enriched = injectPngMetadata(
        new Uint8Array(arrayBuffer),
        buildCaptureMetadata(sceneName)
      );
      outBlob = new Blob([enriched], { type: 'image/png' });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(
        '[mediaRecorder] PNG metadata injection failed, saving without metadata:',
        err
      );
    }

    downloadBlob(outBlob, `${fileName}.png`);
  }, 'image/png');
}
