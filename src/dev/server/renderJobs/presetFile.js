import fs from 'node:fs/promises';
import path from 'node:path';

// Finds the `}` closing the object literal opened by `declaration`, by
// counting braces from its own `{`. A regex for the last `};` finds some other
// block, and string literals make any cheaper scan wrong the first time a
// palette name contains a brace.
function objectRange(source, declaration) {
  const open = source.indexOf(declaration);
  if (open === -1) return null;

  let depth = 0;
  let quote = null;
  for (let i = open + declaration.length - 1; i < source.length; i += 1) {
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

async function format(source, filePath) {
  const prettier = await import('prettier');
  const config = await prettier.resolveConfig(filePath);
  return prettier.format(source, { ...config, filepath: filePath });
}

// Appends one `name: value` entry to an object literal in a scene's preset
// file and hands the result to prettier with the repo's own config, so a
// written entry is indistinguishable from a hand-authored one. `nameFor`
// receives the object's source and picks the entry's key; names are never
// reused, since a name is how a preset is linked to.
export default async function appendPreset(
  rootDir,
  { declaration, file, nameFor, value }
) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('A preset must be an object of control values.');
  }

  const filePath = path.join(rootDir, file);
  const source = await fs.readFile(filePath, 'utf8');
  const range = objectRange(source, declaration);
  if (!range) {
    throw new Error(`Could not find "${declaration}" in ${file}.`);
  }

  const name = nameFor(source.slice(range.open, range.close));
  const entry = `${JSON.stringify(name)}: ${JSON.stringify(value)},\n`;
  const spliced =
    source.slice(0, range.close) + entry + source.slice(range.close);

  await fs.writeFile(filePath, await format(spliced, filePath));
  return { file, name };
}
