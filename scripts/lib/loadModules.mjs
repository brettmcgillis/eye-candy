/* eslint-disable import/no-extraneous-dependencies */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

export const REPO_ROOT = path.resolve(
  fileURLToPath(new URL('../..', import.meta.url))
);

// jsconfig.json is the alias table the editor, ESLint and vite.config.js
// already agree on; reading it keeps a headless renderer on the same one.
async function repoAliases() {
  const jsconfig = JSON.parse(
    await readFile(path.join(REPO_ROOT, 'jsconfig.json'), 'utf8')
  );
  return Object.entries(jsconfig.compilerOptions.paths)
    .filter(([alias]) => !alias.endsWith('/*'))
    .map(([find, [target]]) => ({
      find: new RegExp(`^${find}(?=/|$)`, 'u'),
      replacement: path.join(REPO_ROOT, target),
    }));
}

// Loads repo modules through Vite so a headless renderer resolves the same
// aliases, extensionless imports and JSON the browser build does — the two
// renderers execute literally the same files. `entries` are repo-rooted paths
// (`/src/modules/flora/index.js`); the result is keyed the same way.
export default async function loadModules(entries) {
  const server = await createServer({
    appType: 'custom',
    configFile: false,
    logLevel: 'error',
    // Nothing here is served to a browser, and with no index.html to crawl
    // the dependency scanner just errors noisily on the SSR entry points.
    optimizeDeps: { noDiscovery: true },
    resolve: { alias: await repoAliases() },
    root: REPO_ROOT,
    server: { middlewareMode: true },
  });

  try {
    const loaded = {};
    // eslint-disable-next-line no-restricted-syntax
    for (const entry of entries) {
      // eslint-disable-next-line no-await-in-loop
      loaded[entry] = await server.ssrLoadModule(entry);
    }
    return loaded;
  } finally {
    await server.close();
  }
}
