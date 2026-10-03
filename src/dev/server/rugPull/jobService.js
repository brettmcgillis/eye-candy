import path from 'node:path';

// Relative, not `@modules/rugPull`: this runs inside Vite's config loader,
// which resolves no aliases. renderOptions.mjs is dependency-free for that
// reason.
import {
  RENDER_OPTIONS,
  normalizeOptions,
} from '../../../modules/rugPull/renderOptions.mjs';
import createRenderJobService, {
  RenderJobRequestError,
  optionsToFlags,
} from '../renderJobs/jobService';

async function prepare(rootDir, { kind, outputDirectory, payload }) {
  const fail = (message) =>
    new RenderJobRequestError(400, 'INVALID_OPTION', message);
  const sent = payload.options ?? {};
  const options = normalizeOptions(kind, sent, { fail, surface: 'workbench' });
  const chosen = new Set(Object.keys(sent));

  return {
    args: [
      path.join(rootDir, 'scripts', 'rug-pull-generate.mjs'),
      // A typed flag is a pin to the CLI, so a rollable option only travels
      // when the page sent it.
      ...optionsToFlags(
        { ...options, out: outputDirectory },
        (key) => RENDER_OPTIONS[key]?.facet && !chosen.has(key)
      ),
    ],
    files: {},
    options,
  };
}

export default createRenderJobService({
  curatedRoot: path.join('public', 'images', 'rug-pull'),
  curatedUrl: '/images/rug-pull',
  kinds: ['still'],
  maxConcurrent: 1,
  outputRoot: path.join('output', 'rug-pull-workbench', 'jobs'),
  prepare,
  tool: 'rugPull',
});
