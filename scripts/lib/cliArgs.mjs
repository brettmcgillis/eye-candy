const ALL_VIEWS = ['front', 'back', 'top', 'bottom'];

// Minimal `--flag value` parser. A `--no-x` token clears `x`, a flag with no
// value is boolean true, and a value that parses as a number becomes one — so
// callers get `args.width` as an int without per-flag declarations.
export function parseArgs(argv, defaults) {
  const args = { ...defaults };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) break;
    const key = token.slice(2);

    if (key === 'help') {
      args.help = true;
    } else if (key.startsWith('no-')) {
      args[key.slice(3)] = false;
    } else {
      const value = argv[i + 1];
      // A flag with nothing after it, or another flag, is a valueless
      // boolean (--overlay) rather than a flag whose value is the next flag.
      if (value === undefined || value.startsWith('--')) {
        args[key] = true;
      } else {
        i += 1;
        const asNumber = Number(value);
        args[key] = Number.isNaN(asNumber) || value === '' ? value : asNumber;
      }
    }
  }
  return args;
}

export function resolveViews(list) {
  const views = String(list)
    .split(',')
    .map((view) => view.trim())
    .filter((view) => ALL_VIEWS.includes(view));

  if (views.length === 0) {
    throw new Error(`--views must name at least one of ${ALL_VIEWS.join(',')}`);
  }
  return views;
}

// Read rather than `import ... with { type: 'json' }`: the repo's parser
// doesn't accept import attributes yet.
export async function readPackageVersion() {
  const { readFile } = await import('node:fs/promises');
  const url = new URL('../../package.json', import.meta.url);
  return JSON.parse(await readFile(url, 'utf8')).version;
}

const IG_PRESETS = ['story', 'reel', 'post'];

// `--ig none` (or `--no-ig`) turns the safe-area insets off; anything else has
// to name a real preset rather than silently rendering the wrong layout.
export function resolveIgPreset(value) {
  if (value === false || value === null || value === 'none') return null;
  if (IG_PRESETS.includes(value)) return value;
  throw new Error(`--ig must be one of ${IG_PRESETS.join(', ')}, or none`);
}
