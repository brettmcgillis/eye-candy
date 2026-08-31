// Argument plumbing shared by the Rorschach CLIs. What a flag *is* — its
// type, range, default and help text — lives in the kernel's
// src/modules/rorschach/renderOptions.mjs, not here.
// Minimal `--flag value` parser. A `--no-x` token clears `x`, a flag with no
// value is boolean true, and a value that parses as a number becomes one — so
// callers get `args.width` as an int without per-flag declarations.
// The returned bag also carries, non-enumerably, the set of keys the caller
// actually typed. Merging defaults in destroys that distinction, and it is the
// distinction the roll depends on: an explicitly passed flag is a pin, an
// absent one is left to the dice. Non-enumerable so it stays out of the
// `render:` block written into props.json.
export const PROVIDED = Symbol('provided');

export function parseArgs(argv, defaults) {
  const args = { ...defaults };
  const provided = new Set();
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) break;
    const key = token.slice(2);

    if (key === 'help') {
      args.help = true;
    } else if (key.startsWith('no-')) {
      args[key.slice(3)] = false;
      provided.add(key.slice(3));
    } else {
      provided.add(key);
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
  Object.defineProperty(args, PROVIDED, { enumerable: false, value: provided });
  return args;
}

// Reads the set back off a parsed bag.
export function providedKeys(args) {
  return args?.[PROVIDED] ?? new Set();
}

// A json-typed flag may name a file instead of carrying its payload on argv.
// The bundle-override block of a real preset is three thousand characters, and
// the point of it is that it came out of the scene rather than off a keyboard.
// Both shapes a preset is written in are accepted — the flat object itself, and
// a props.json's `{ preset: ... }` wrapper — so a still's own sidecar can be
// handed straight back to the CLI that made it.
export async function readJsonFlags(args, specs) {
  const { readFile } = await import('node:fs/promises');
  const resolved = { ...args };
  await Promise.all(
    Object.entries(specs).map(async ([key, spec]) => {
      const value = args[key];
      if (spec.type !== 'json' || typeof value !== 'string') return;
      if (value.trimStart().startsWith('{')) return;
      const parsed = JSON.parse(await readFile(value, 'utf8'));
      resolved[key] = parsed?.preset ?? parsed;
    })
  );
  return resolved;
}

// Read rather than `import ... with { type: 'json' }`: the repo's parser
// doesn't accept import attributes yet.
export async function readPackageVersion() {
  const { readFile } = await import('node:fs/promises');
  const url = new URL('../../package.json', import.meta.url);
  return JSON.parse(await readFile(url, 'utf8')).version;
}
