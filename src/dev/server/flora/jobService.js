import path from 'node:path';

// Relative, not `@modules/flora`: this runs inside Vite's config loader, which
// resolves no aliases. renderOptions.mjs is dependency-free for that reason.
import {
  RENDER_OPTIONS,
  normalizeOptions,
} from '../../../modules/flora/renderOptions.mjs';
import createRenderJobService, {
  RenderJobRequestError,
  optionsToFlags,
} from '../renderJobs/jobService';

const MAX_BOUQUET_SOURCES = 24;

// A bouquet arrives as the sidecar URLs of generations in either gallery; the
// server reads them and hands the CLI one file, which also stays beside the
// output as the bouquet's recipe.
async function bouquetFile(service, rootDir, sources) {
  if (!Array.isArray(sources) || sources.length === 0) return null;
  if (sources.length > MAX_BOUQUET_SOURCES) {
    throw new RenderJobRequestError(
      400,
      'TOO_MANY_SOURCES',
      `A bouquet takes at most ${MAX_BOUQUET_SOURCES} flowers.`
    );
  }
  return Promise.all(sources.map((url) => service.readSidecar(rootDir, url)));
}

async function prepare(rootDir, { kind, outputDirectory, payload, service }) {
  const fail = (message) =>
    new RenderJobRequestError(400, 'INVALID_OPTION', message);
  const sent = payload.options ?? {};
  const options = normalizeOptions(kind, sent, { fail, surface: 'workbench' });
  const chosen = new Set(Object.keys(sent));
  const command = {
    ...options,
    out:
      kind === 'still'
        ? outputDirectory
        : path.join(outputDirectory, 'flora.mp4'),
  };
  const files = {};
  const bouquet = await bouquetFile(service, rootDir, payload.bouquet);
  if (bouquet) {
    files['bouquet.json'] = `${JSON.stringify(bouquet, null, 2)}\n`;
    command.bouquet = path.join(outputDirectory, 'bouquet.json');
  }

  return {
    args: [
      path.join(
        rootDir,
        'scripts',
        kind === 'still' ? 'flora-generate.mjs' : 'flora-video.mjs'
      ),
      // A typed flag is a pin to the CLI, so a rollable option only travels
      // when the page sent it.
      ...optionsToFlags(
        command,
        (key) => RENDER_OPTIONS[key]?.facet && !chosen.has(key)
      ),
    ],
    files,
    options: { ...options, bouquet: payload.bouquet ?? null },
  };
}

export default createRenderJobService({
  curatedRoot: path.join('public', 'images', 'flora'),
  curatedUrl: '/images/flora',
  kinds: ['still', 'video'],
  maxConcurrent: 1,
  outputRoot: path.join('output', 'flora-workbench', 'jobs'),
  prepare,
  tool: 'flora',
});
