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

const KEY = /^ {2}(?:'([^']+)'|"([^"]+)"|(\w+)):/gmu;

// Picks the first free `requested`, `requested 2`, … among the object's
// top-level keys, whatever form their values take.
export function uniqueName(requested) {
  return (source) => {
    const taken = new Set(
      [...source.matchAll(KEY)].map(([, a, b, c]) => a ?? b ?? c)
    );
    let name = requested;
    for (let n = 2; taken.has(name); n += 1) name = `${requested} ${n}`;
    return name;
  };
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
// reused, since a name is how a preset is linked to. `base` names the object
// the scene's own presets spread first, so a written entry carries only what
// differs from it.
export default async function appendPreset(
  rootDir,
  { base, declaration, file, nameFor, value }
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
  const fields = JSON.stringify(value).slice(1, -1);
  const body = base ? [`...${base}`, fields].filter(Boolean).join(',') : fields;
  const entry = `${JSON.stringify(name)}: {${body}},\n`;
  const spliced =
    source.slice(0, range.close) + entry + source.slice(range.close);

  await fs.writeFile(filePath, await format(spliced, filePath));
  return { file, name };
}
