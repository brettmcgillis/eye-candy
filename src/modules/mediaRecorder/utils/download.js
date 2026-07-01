import isMobileDevice from './platform';

function downloadViaAnchor(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

// On mobile, an anchor-click "download" typically surfaces as "Save to Files"
// (iOS Safari in particular never offers Photos there). The Web Share API's
// native share sheet includes a "Save Image"/"Save Video" action that saves
// straight to Photos, so prefer it on mobile — falling back to the anchor
// download if sharing isn't supported or fails for a reason other than the
// user dismissing the share sheet.
export default async function downloadBlob(blob, filename) {
  if (!isMobileDevice() || typeof navigator.share !== 'function') {
    downloadViaAnchor(blob, filename);
    return;
  }

  const file = new File([blob], filename, { type: blob.type });

  if (!navigator.canShare?.({ files: [file] })) {
    downloadViaAnchor(blob, filename);
    return;
  }

  try {
    await navigator.share({ files: [file] });
  } catch (err) {
    if (err?.name !== 'AbortError') {
      downloadViaAnchor(blob, filename);
    }
  }
}
