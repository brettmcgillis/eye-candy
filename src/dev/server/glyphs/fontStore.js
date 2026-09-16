import fs from 'node:fs/promises';
import path from 'node:path';

export const FONTS_DIR = path.join('src', 'modules', 'glyphs', 'fonts');

const NAME_PATTERN = /^[a-z0-9][a-z0-9-]{0,47}$/u;
const TECHNIQUES = new Set(['runes', 'script', 'sigil']);

export class FontRequestError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

async function format(source, filePath) {
  const prettier = await import('prettier');
  const config = await prettier.resolveConfig(filePath);
  return prettier.format(source, { ...config, filepath: filePath });
}

export async function listFonts(rootDir) {
  const dir = path.join(rootDir, FONTS_DIR);
  const entries = await fs.readdir(dir).catch(() => []);
  const files = entries.filter((entry) => entry.endsWith('.json')).sort();
  return Promise.all(
    files.map(async (file) => ({
      file: path.join(FONTS_DIR, file),
      font: JSON.parse(await fs.readFile(path.join(dir, file), 'utf8')),
    }))
  );
}

export async function writeFont(rootDir, font) {
  if (!font || typeof font !== 'object' || Array.isArray(font)) {
    throw new FontRequestError(400, 'A font object is required.');
  }
  if (!NAME_PATTERN.test(font.name ?? '')) {
    throw new FontRequestError(
      400,
      'Font name must be lowercase letters, numbers and dashes (max 48).'
    );
  }
  if (!TECHNIQUES.has(font.technique)) {
    throw new FontRequestError(400, `Unknown technique "${font.technique}".`);
  }
  if (!font.params || !font.glyphs) {
    throw new FontRequestError(400, 'A font needs params and glyphs.');
  }

  const filePath = path.join(rootDir, FONTS_DIR, `${font.name}.json`);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const { glyphs, name, params, technique } = font;
  const source = JSON.stringify({ name, technique, params, glyphs });
  await fs.writeFile(filePath, await format(source, filePath));
  return { file: path.join(FONTS_DIR, `${font.name}.json`) };
}
