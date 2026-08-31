import fs from 'node:fs/promises';
import path from 'node:path';

const PRESETS_FILE = path.join(
  'src',
  'components',
  'scenes',
  'WebGPU',
  'Rorschach',
  'presets',
  'presets.js'
);
const PRESETS_DECLARATION = 'export const PRESETS = {';

// Finds the `}` that closes the PRESETS object literal by counting braces from
// its own `{`. A regex for the last `};` in the file would find the one closing
// `getPresetControls` instead, and string literals inside the object make any
// cheaper scan wrong the first time a palette name contains a brace.
function presetsObjectRange(source) {
  const open = source.indexOf(PRESETS_DECLARATION);
  if (open === -1) return null;

  let depth = 0;
  let quote = null;
  for (
    let i = open + PRESETS_DECLARATION.length - 1;
    i < source.length;
    i += 1
  ) {
    const char = source[i];
    if (quote) {
      if (char === '\\') i += 1;
      else if (char === quote) quote = null;
    } else if (char === "'" || char === '"' || char === '`') {
      quote = char;
    } else if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) return { close: i, open };
    }
  }
  return null;
}

// The names are three-digit strings in order, so the next one is the highest
// plus one. Gaps are left alone: a name is how a preset is linked to, and
// filling a hole would point an old link at a new picture.
function nextPresetName(source) {
  const names = [...source.matchAll(/^ {2}'(\d+)': \{$/gmu)].map(([, name]) =>
    Number(name)
  );
  const next = names.length > 0 ? Math.max(...names) + 1 : 1;
  return String(next).padStart(3, '0');
}

// Prettier does the formatting rather than this file guessing at it — indent,
// key quoting and line breaks then come out identical to every other entry,
// because they come from the same config the repo formats everything with.
async function format(source, filePath) {
  const prettier = await import('prettier');
  const config = await prettier.resolveConfig(filePath);
  return prettier.format(source, { ...config, filepath: filePath });
}

// Appends one entry to the scene's preset file. The workbench calls this to
// promote a generated still into something the 3D scene can open — the one
// direction the dev tool writes toward the scene, and the reason it can stop
// reading presets in the other direction.
export default async function writeScenePreset(rootDir, preset) {
  if (!preset || typeof preset !== 'object' || Array.isArray(preset)) {
    throw new Error('A preset must be an object of control values.');
  }

  const filePath = path.join(rootDir, PRESETS_FILE);
  const source = await fs.readFile(filePath, 'utf8');
  const range = presetsObjectRange(source);
  if (!range) {
    throw new Error(
      `Could not find "${PRESETS_DECLARATION}" in ${PRESETS_FILE}.`
    );
  }

  const name = nextPresetName(source);
  const entry = `'${name}': ${JSON.stringify(preset)},\n`;
  const spliced =
    source.slice(0, range.close) + entry + source.slice(range.close);

  await fs.writeFile(filePath, await format(spliced, filePath));
  return { file: PRESETS_FILE, name };
}
