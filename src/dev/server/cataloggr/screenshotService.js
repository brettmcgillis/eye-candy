import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import { createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

import { CatalogRequestError } from './service';

const SCREENSHOT_DIR = 'screenshots';
const MANIFEST_FILE = 'screenshots.json';
const FILE_PATTERN = /^[a-f0-9]{10}\.(?:webp|webm)$/u;
const MAX_CAPTION_CHARS = 200;
const MAX_SCREENSHOTS = 24;
const MAX_PRESET_CHARS = 200;
const MAX_VIDEO_BYTES = 1024 ** 3;
const MAX_VIDEO_EDGE = 1280;
const VIDEO_TYPES = new Set([
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-matroska',
]);
const CONTENT_TYPES = { webm: 'video/webm', webp: 'image/webp' };
const SOURCE_PATH_PATTERN =
  /^src\/(?:components\/scenes\/(?:WebGL|WebGPU|Shared)|dev\/tools)\/[A-Za-z0-9_-]+$/u;
const WEBP_SIGNATURE = [
  [0, 'RIFF'],
  [8, 'WEBP'],
];

async function getFolders(rootDir, sourcePath) {
  if (!SOURCE_PATH_PATTERN.test(String(sourcePath ?? ''))) {
    throw new CatalogRequestError(
      400,
      'INVALID_SOURCE_PATH',
      'Screenshots can only belong to a scene or dev tool folder.'
    );
  }

  const sceneFolder = path.join(rootDir, ...sourcePath.split('/'));

  try {
    if (!(await fs.stat(sceneFolder)).isDirectory()) throw new Error();
  } catch {
    throw new CatalogRequestError(
      404,
      'SOURCE_NOT_FOUND',
      `No folder exists at ${sourcePath}.`
    );
  }

  return {
    folder: path.join(sceneFolder, SCREENSHOT_DIR),
    manifestPath: path.join(sceneFolder, SCREENSHOT_DIR, MANIFEST_FILE),
  };
}

function normalizePreset(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isValidPreset(value) {
  return (
    value === undefined ||
    (typeof value === 'string' && value.length <= MAX_PRESET_CHARS)
  );
}

async function readManifest(manifestPath) {
  try {
    const parsed = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    const list = Array.isArray(parsed) ? parsed : (parsed.screenshots ?? []);
    return {
      mainCaption: parsed.mainCaption ?? '',
      mainPreset: normalizePreset(parsed.mainPreset),
      screenshots: list.map((shot) => ({
        ...shot,
        preset: normalizePreset(shot.preset),
      })),
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { mainCaption: '', mainPreset: '', screenshots: [] };
    }
    throw error;
  }
}

function serializeManifest({ mainCaption, mainPreset, screenshots }) {
  return {
    mainCaption,
    ...(mainPreset ? { mainPreset } : {}),
    screenshots: screenshots.map(({ caption, file, preset }) => ({
      file,
      caption,
      ...(preset ? { preset } : {}),
    })),
  };
}

async function writeManifest(folder, manifestPath, manifest) {
  const { mainCaption, mainPreset, screenshots } = manifest;
  const keep = new Set(screenshots.map((shot) => shot.file));
  let existing = [];

  try {
    existing = await fs.readdir(folder);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  await Promise.all(
    existing
      .filter((name) => FILE_PATTERN.test(name) && !keep.has(name))
      .map((name) => fs.rm(path.join(folder, name), { force: true }))
  );

  if (!screenshots.length && !mainCaption && !mainPreset) {
    await fs.rm(folder, { recursive: true, force: true });
    return;
  }

  await fs.mkdir(folder, { recursive: true });
  await fs.writeFile(
    manifestPath,
    `${JSON.stringify(serializeManifest(manifest), null, 2)}\n`
  );
}

export async function listScreenshots(rootDir, sourcePath) {
  const { manifestPath } = await getFolders(rootDir, sourcePath);
  return { sourcePath, ...(await readManifest(manifestPath)) };
}

export function getScreenshotContentType(file) {
  return CONTENT_TYPES[String(file).split('.').pop()] ?? 'image/webp';
}

export async function readScreenshotFile(rootDir, sourcePath, file) {
  const { folder } = await getFolders(rootDir, sourcePath);

  if (!FILE_PATTERN.test(String(file ?? ''))) {
    throw new CatalogRequestError(
      400,
      'INVALID_SCREENSHOT',
      'Unknown screenshot file.'
    );
  }

  try {
    return await fs.readFile(path.join(folder, file));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    throw new CatalogRequestError(
      404,
      'SCREENSHOT_NOT_FOUND',
      `${sourcePath} has no screenshot ${file}.`
    );
  }
}

export async function listScreenshotPresets(rootDir) {
  const scenesPath = path.join(rootDir, 'src', 'components', 'scenes');
  const relativePaths = await fs.readdir(scenesPath, { recursive: true });
  const manifestPaths = relativePaths.filter((relativePath) =>
    /^(?:WebGL|WebGPU|Shared)\/[^/]+\/screenshots\/screenshots\.json$/u.test(
      relativePath.split(path.sep).join('/')
    )
  );

  const entries = await Promise.all(
    manifestPaths.map(async (relativePath) => {
      const manifest = await readManifest(path.join(scenesPath, relativePath));
      const presets = [
        manifest.mainPreset,
        ...manifest.screenshots.map((shot) => shot.preset),
      ].filter(Boolean);
      return [
        path.posix.join(
          'src',
          'components',
          'scenes',
          ...relativePath.split(path.sep).slice(0, 2)
        ),
        [...new Set(presets)].sort((left, right) => left.localeCompare(right)),
      ];
    })
  );

  return Object.fromEntries(entries.filter(([, presets]) => presets.length));
}

async function appendScreenshot({ folder, manifestPath, preset, write }) {
  const manifest = await readManifest(manifestPath);
  const { screenshots } = manifest;

  if (screenshots.length >= MAX_SCREENSHOTS) {
    throw new CatalogRequestError(
      400,
      'TOO_MANY_SCREENSHOTS',
      `A scene can have at most ${MAX_SCREENSHOTS} screenshots.`
    );
  }

  await fs.mkdir(folder, { recursive: true });
  const file = await write(crypto.randomBytes(5).toString('hex'));
  const next = {
    ...manifest,
    screenshots: [
      ...screenshots,
      {
        file,
        caption: '',
        preset: isValidPreset(preset) ? normalizePreset(preset) : '',
      },
    ],
  };
  await writeManifest(folder, manifestPath, next);
  return next;
}

export async function addScreenshot({ body, preset, rootDir, sourcePath }) {
  const isWebp = WEBP_SIGNATURE.every(
    ([offset, text]) =>
      body.subarray(offset, offset + text.length).toString('ascii') === text
  );

  if (!isWebp) {
    throw new CatalogRequestError(
      415,
      'SCREENSHOT_NOT_WEBP',
      'Screenshots must be uploaded as WebP.'
    );
  }

  const { folder, manifestPath } = await getFolders(rootDir, sourcePath);
  const next = await appendScreenshot({
    folder,
    manifestPath,
    preset,
    write: async (id) => {
      const file = `${id}.webp`;
      await fs.writeFile(path.join(folder, file), body);
      return file;
    },
  });

  return { ok: true, sourcePath, ...next };
}

function writeRequestToFile(req, target) {
  return new Promise((resolve, reject) => {
    const out = createWriteStream(target);
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size <= MAX_VIDEO_BYTES) return;
      req.destroy();
      out.destroy();
      reject(
        new CatalogRequestError(
          413,
          'VIDEO_TOO_LARGE',
          'Screenshot videos must be smaller than 1 GiB.'
        )
      );
    });
    req.on('error', reject);
    out.on('error', reject);
    out.on('finish', resolve);
    req.pipe(out);
  });
}

function encodeWebm(input, output) {
  const fit = `scale='min(${MAX_VIDEO_EDGE},iw)':'min(${MAX_VIDEO_EDGE},ih)':force_original_aspect_ratio=decrease`;
  const args = [
    '-y',
    '-i',
    input,
    '-map',
    '0:v:0',
    '-an',
    '-vf',
    `${fit},scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p`,
    '-c:v',
    'libvpx-vp9',
    '-crf',
    '32',
    '-b:v',
    '0',
    '-row-mt',
    '1',
    '-deadline',
    'good',
    '-cpu-used',
    '4',
    output,
  ];

  return new Promise((resolve, reject) => {
    const child = spawn('ffmpeg', args, {
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', (error) =>
      reject(
        error.code === 'ENOENT'
          ? new CatalogRequestError(
              500,
              'FFMPEG_MISSING',
              'ffmpeg is not installed, so videos cannot be converted.'
            )
          : error
      )
    );
    child.on('close', (code) =>
      code === 0
        ? resolve()
        : reject(
            new CatalogRequestError(
              422,
              'VIDEO_ENCODE_FAILED',
              `ffmpeg could not convert the video: ${stderr.trim().split('\n').slice(-3).join(' ')}`
            )
          )
    );
  });
}

export async function addScreenshotVideo({ preset, req, rootDir, sourcePath }) {
  const type = String(req.headers['content-type'] ?? '').split(';')[0];

  if (!VIDEO_TYPES.has(type)) {
    throw new CatalogRequestError(
      415,
      'UNSUPPORTED_VIDEO',
      'Upload an MP4, MOV, WebM or MKV video.'
    );
  }

  const { folder, manifestPath } = await getFolders(rootDir, sourcePath);
  const incoming = path.join(
    folder,
    `.incoming-${crypto.randomBytes(6).toString('hex')}`
  );
  await fs.mkdir(folder, { recursive: true });

  try {
    await writeRequestToFile(req, incoming);
    const next = await appendScreenshot({
      folder,
      manifestPath,
      preset,
      write: async (id) => {
        const file = `${id}.webm`;
        await encodeWebm(incoming, path.join(folder, file));
        return file;
      },
    });
    return { ok: true, sourcePath, ...next };
  } finally {
    await fs.rm(incoming, { force: true });
  }
}

export async function writeScreenshots({
  mainCaption = '',
  mainPreset = '',
  rootDir,
  screenshots,
  sourcePath,
}) {
  const { folder, manifestPath } = await getFolders(rootDir, sourcePath);
  const current = new Set(
    (await readManifest(manifestPath)).screenshots.map((shot) => shot.file)
  );

  const valid =
    typeof mainCaption === 'string' &&
    mainCaption.length <= MAX_CAPTION_CHARS &&
    isValidPreset(mainPreset) &&
    Array.isArray(screenshots) &&
    screenshots.every(
      (shot) =>
        current.has(shot?.file) &&
        typeof shot.caption === 'string' &&
        shot.caption.length <= MAX_CAPTION_CHARS &&
        isValidPreset(shot.preset)
    ) &&
    new Set(screenshots.map((shot) => shot.file)).size === screenshots.length;

  if (!valid) {
    throw new CatalogRequestError(
      400,
      'INVALID_SCREENSHOTS',
      'Screenshots must reorder or delete existing files, with captions and presets up to 200 characters.'
    );
  }

  const next = {
    mainCaption: mainCaption.trim(),
    mainPreset: normalizePreset(mainPreset),
    screenshots: screenshots.map(({ file, caption, preset }) => ({
      file,
      caption: caption.trim(),
      preset: normalizePreset(preset),
    })),
  };
  await writeManifest(folder, manifestPath, next);

  return { ok: true, sourcePath, ...next };
}
