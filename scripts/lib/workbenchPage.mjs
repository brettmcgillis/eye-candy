import { readFile } from 'node:fs/promises';

const keysIn = (text) => [...text.matchAll(/'(\w+)'/gu)].map(([, key]) => key);

// A RollWorkbench page lays most of its form out from the schema; this checks
// the keys it still names by hand (handled, choices, fields, pickers and
// direct setOption calls) are real options.
export default async function checkWorkbenchPage(file, options, check) {
  const source = await readFile(file, 'utf8').catch(() => null);
  check(source, `the workbench page ${file} is missing.`);
  if (!source) return;
  const named = [
    ...[...source.matchAll(/handled: \[([^\]]*)\]/gu)].flatMap(([, list]) =>
      keysIn(list)
    ),
    ...[...source.matchAll(/(?:choices|fields): \{([^}]*)\}/gu)].flatMap(
      ([, body]) => [...body.matchAll(/(\w+):/gu)].map(([, key]) => key)
    ),
    ...[...source.matchAll(/key: '(\w+)'/gu)].map(([, key]) => key),
    ...[...source.matchAll(/setOption\('(\w+)'/gu)].map(([, key]) => key),
  ];
  named.forEach((key) =>
    check(
      key in options,
      `the workbench names "${key}", which is not in renderOptions.mjs.`
    )
  );
}
