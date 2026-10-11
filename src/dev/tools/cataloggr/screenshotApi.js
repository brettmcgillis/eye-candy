import { canvasToWebp } from './thumbnailApi';

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
    const bitmap = await createImageBitmap(source);
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

export function getScreenshotUrl(sourcePath, file) {
  return `${ENDPOINT}/file?${new URLSearchParams({ sourcePath, file })}`;
}

export function fetchScreenshots(sourcePath) {
  return request(`${ENDPOINT}?${new URLSearchParams({ sourcePath })}`);
}

export async function addScreenshot(sourcePath, source) {
  return request(`${ENDPOINT}?${new URLSearchParams({ sourcePath })}`, {
    method: 'POST',
    headers: { 'Content-Type': 'image/webp' },
    body: await toScreenshotBlob(source),
  });
}

export function saveScreenshots(sourcePath, mainCaption, screenshots) {
  return request(
    `${ENDPOINT}/manifest?${new URLSearchParams({ sourcePath })}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mainCaption, screenshots }),
    }
  );
}
