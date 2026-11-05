import { IMAGE_ACCEPT, canvasToWebp, decodeImageBlob } from './thumbnailApi';

const ENDPOINT = '/dev-api/cataloggr/screenshots';
const MAX_WIDTH = 1280;
const MAX_HEIGHT = 1280;

function drawContain(source, sourceWidth, sourceHeight) {
  const scale = Math.min(1, MAX_WIDTH / sourceWidth, MAX_HEIGHT / sourceHeight);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(sourceWidth * scale);
  canvas.height = Math.round(sourceHeight * scale);
  const context = canvas.getContext('2d');
  context.imageSmoothingQuality = 'high';
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

async function toScreenshotBlob(source) {
  if (source instanceof Blob) {
    const bitmap = await decodeImageBlob(source);
    try {
      return await canvasToWebp(
        drawContain(bitmap, bitmap.width, bitmap.height)
      );
    } finally {
      bitmap.close();
    }
  }

  return canvasToWebp(drawContain(source, source.width, source.height));
}

async function request(url, options) {
  const response = await fetch(url, options);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || 'Screenshot request failed.');
  }

  return payload;
}

export const SCREENSHOT_ACCEPT = `${IMAGE_ACCEPT},video/mp4,video/quicktime,video/webm,.mkv`;

export function isVideoFile(file) {
  return (
    file.type.startsWith('video/') ||
    /\.(?:mkv|mov|mp4|webm)$/iu.test(file.name)
  );
}

export function isVideoScreenshot(file) {
  return file.endsWith('.webm');
}

export function getScreenshotUrl(sourcePath, file) {
  return `${ENDPOINT}/file?${new URLSearchParams({ sourcePath, file })}`;
}

export function fetchScreenshots(sourcePath) {
  return request(`${ENDPOINT}?${new URLSearchParams({ sourcePath })}`);
}

export async function addScreenshot(sourcePath, source, preset = '') {
  const params = new URLSearchParams({ sourcePath });
  if (preset) params.set('preset', preset);
  return request(`${ENDPOINT}?${params}`, {
    method: 'POST',
    headers: { 'Content-Type': 'image/webp' },
    body: await toScreenshotBlob(source),
  });
}

export function addScreenshotVideo(sourcePath, file, preset = '') {
  const params = new URLSearchParams({ sourcePath });
  if (preset) params.set('preset', preset);
  const type =
    file.type ||
    (/\.mkv$/iu.test(file.name) ? 'video/x-matroska' : 'video/mp4');
  return request(`${ENDPOINT}/video?${params}`, {
    method: 'POST',
    headers: { 'Content-Type': type },
    body: file,
  });
}

export function grabVideoFrame(url) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = true;
    video.preload = 'auto';
    video.addEventListener('error', () =>
      reject(new Error('The video could not be read.'))
    );
    video.addEventListener(
      'loadeddata',
      () => {
        video.currentTime = Math.min(0.1, video.duration || 0);
      },
      { once: true }
    );
    video.addEventListener(
      'seeked',
      () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        resolve(canvas);
      },
      { once: true }
    );
    video.src = url;
  });
}

export function saveScreenshots(
  sourcePath,
  { mainCaption, mainPreset, screenshots }
) {
  return request(
    `${ENDPOINT}/manifest?${new URLSearchParams({ sourcePath })}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mainCaption, mainPreset, screenshots }),
    }
  );
}

export async function setMainPreset(sourcePath, mainPreset) {
  const manifest = await fetchScreenshots(sourcePath);
  return saveScreenshots(sourcePath, { ...manifest, mainPreset });
}

export function savePresetVisibility(sourcePath, presetName, visibility) {
  return request('/dev-api/cataloggr/preset-visibility', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ presetName, sourcePath, visibility }),
  });
}
