import path from 'node:path';

// Relative, not `@modules/subdivision`: this runs inside Vite's config
// loader, which resolves no aliases.
import {
  RENDER_OPTIONS,
  normalizeOptions,
} from '../../../modules/subdivision/renderOptions.mjs';
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

  const out =
    kind === 'still'
      ? outputDirectory
      : path.join(outputDirectory, 'subdivision.mp4');

  return {
    args: [
      path.join(
        rootDir,
        'scripts',
        kind === 'still' ? 'subdivision-generate.mjs' : 'subdivision-video.mjs'
      ),
      // A typed flag is a pin to the CLI, so a rollable option only travels
      // when the page sent it.
      ...optionsToFlags(
        { ...options, out },
        (key) => RENDER_OPTIONS[key]?.facet && !chosen.has(key)
      ),
    ],
    options,
  };
}

export default createRenderJobService({
  curatedRoot: path.join('public', 'images', 'subdivision'),
  curatedUrl: '/images/subdivision',
  kinds: ['still', 'video'],
  maxConcurrent: 1,
  outputRoot: path.join('output', 'subdivision-workbench', 'jobs'),
  prepare,
  tool: 'subdivision',
});
