import buildCaptureMetadata from './captureMetadata';
import downloadBlob from './download';
import applyOverlayCaptureFixups from './html2canvasFixups';
import injectPngMetadata from './pngMetadata';

export default async function captureScreenshot(fileName, sceneName) {
  const { default: html2canvas } = await import('html2canvas');
  const canvas = await html2canvas(document.body, {
    useCORS: true,
    allowTaint: false,
    scale: window.devicePixelRatio,
    onclone: applyOverlayCaptureFixups,
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
