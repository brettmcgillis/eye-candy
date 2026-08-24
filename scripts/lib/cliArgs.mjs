// Argument plumbing shared by the Rorschach CLIs. What a flag *is* — its
// type, range, default and help text — lives in the kernel's
// src/modules/rorschach/renderOptions.mjs, not here.
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

// Read rather than `import ... with { type: 'json' }`: the repo's parser
// doesn't accept import attributes yet.
export async function readPackageVersion() {
  const { readFile } = await import('node:fs/promises');
  const url = new URL('../../package.json', import.meta.url);
  return JSON.parse(await readFile(url, 'utf8')).version;
}
