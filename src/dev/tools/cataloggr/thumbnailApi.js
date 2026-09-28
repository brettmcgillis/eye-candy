const THUMBNAIL_ENDPOINT = '/dev-api/cataloggr/thumbnail';
const THUMBNAIL_WIDTH = 640;
const THUMBNAIL_HEIGHT = 400;
const THUMBNAIL_QUALITY = 0.82;
const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/u, '');

export function getAppUrl(path, params = {}) {
  const query = new URLSearchParams(params).toString();
  return `${BASE_PATH}${path}${query ? `?${query}` : ''}`;
}

export function getThumbnailUrl(sourcePath, version) {
  const query = new URLSearchParams({ sourcePath, v: String(version) });
  return `${THUMBNAIL_ENDPOINT}?${query}`;
}

function drawCover(source, sourceWidth, sourceHeight) {
  const canvas = document.createElement('canvas');
  canvas.width = THUMBNAIL_WIDTH;
  canvas.height = THUMBNAIL_HEIGHT;
  const scale = Math.max(
    THUMBNAIL_WIDTH / sourceWidth,
    THUMBNAIL_HEIGHT / sourceHeight
  );
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;
  const context = canvas.getContext('2d');
  context.imageSmoothingQuality = 'high';
  context.drawImage(
    source,
    (THUMBNAIL_WIDTH - width) / 2,
    (THUMBNAIL_HEIGHT - height) / 2,
    width,
    height
  );
  return canvas;
}

function canvasToWebp(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob?.type === 'image/webp'
          ? resolve(blob)
          : reject(new Error('This browser could not encode WebP.')),
      'image/webp',
      THUMBNAIL_QUALITY
    );
  });
}

export async function toThumbnailBlob(source) {
  if (source instanceof Blob) {
    const bitmap = await createImageBitmap(source);
    try {
      return await canvasToWebp(drawCover(bitmap, bitmap.width, bitmap.height));
    } finally {
      bitmap.close();
    }
  }

  return canvasToWebp(drawCover(source, source.width, source.height));
}

export async function uploadThumbnail(sourcePath, source) {
  const blob = await toThumbnailBlob(source);
  const response = await fetch(
    `${THUMBNAIL_ENDPOINT}?${new URLSearchParams({ sourcePath })}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'image/webp' },
      body: blob,
    }
  );
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || 'Thumbnail failed to save.');
  }

  return payload;
}

export function getImageFile(dataTransfer) {
  return (
    [...(dataTransfer?.files ?? [])].find((file) =>
      file.type.startsWith('image/')
    ) ?? null
  );
}
