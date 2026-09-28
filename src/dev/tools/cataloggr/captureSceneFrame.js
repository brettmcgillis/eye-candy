const BLANK_SAMPLE_SIZE = 24;
const BLANK_VARIANCE_THRESHOLD = 12;

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timeout);
        reject(new DOMException('Capture cancelled.', 'AbortError'));
      },
      { once: true }
    );
  });
}

export function loadFrame(iframe, url, signal) {
  return new Promise((resolve, reject) => {
    const handleLoad = () => {
      iframe.removeEventListener('load', handleLoad);
      resolve();
    };
    iframe.addEventListener('load', handleLoad);
    signal?.addEventListener(
      'abort',
      () => {
        iframe.removeEventListener('load', handleLoad);
        reject(new DOMException('Capture cancelled.', 'AbortError'));
      },
      { once: true }
    );
    iframe.setAttribute('src', url);
  });
}

function findSceneCanvas(frameDocument) {
  return [...(frameDocument?.querySelectorAll('canvas') ?? [])].reduce(
    (largest, canvas) =>
      canvas.width * canvas.height >
      (largest?.width ?? 0) * (largest?.height ?? 0)
        ? canvas
        : largest,
    null
  );
}

function snapshotInFrame(frameWindow, canvas) {
  return new Promise((resolve) => {
    frameWindow.requestAnimationFrame(() => {
      const snapshot = document.createElement('canvas');
      snapshot.width = canvas.width;
      snapshot.height = canvas.height;
      snapshot.getContext('2d').drawImage(canvas, 0, 0);
      resolve(snapshot);
    });
  });
}

export function isBlankFrame(canvas) {
  const sample = document.createElement('canvas');
  sample.width = BLANK_SAMPLE_SIZE;
  sample.height = BLANK_SAMPLE_SIZE;
  const context = sample.getContext('2d', { willReadFrequently: true });
  context.drawImage(canvas, 0, 0, BLANK_SAMPLE_SIZE, BLANK_SAMPLE_SIZE);
  const { data } = context.getImageData(
    0,
    0,
    BLANK_SAMPLE_SIZE,
    BLANK_SAMPLE_SIZE
  );
  const pixelCount = data.length / 4;
  let sum = 0;
  let sumSquares = 0;
  let alpha = 0;

  for (let index = 0; index < data.length; index += 4) {
    const luma =
      0.2126 * data[index] +
      0.7152 * data[index + 1] +
      0.0722 * data[index + 2];
    sum += luma;
    sumSquares += luma * luma;
    alpha += data[index + 3];
  }

  const mean = sum / pixelCount;
  const variance = sumSquares / pixelCount - mean * mean;
  return alpha === 0 || variance < BLANK_VARIANCE_THRESHOLD;
}

export async function captureSceneFrame(
  iframe,
  { attempts = 3, retryMs = 1500, settleMs, signal, url }
) {
  await loadFrame(iframe, url, signal);
  await wait(settleMs, signal);

  const attemptCapture = async (remaining, lastSnapshot) => {
    if (!remaining) return { blank: true, snapshot: lastSnapshot };

    const canvas = findSceneCanvas(iframe.contentDocument);
    let snapshot = lastSnapshot;

    if (canvas?.width && canvas.height) {
      snapshot = await snapshotInFrame(iframe.contentWindow, canvas);
      if (!isBlankFrame(snapshot)) return { blank: false, snapshot };
    }

    await wait(retryMs, signal);
    return attemptCapture(remaining - 1, snapshot);
  };

  return attemptCapture(attempts, null);
}
