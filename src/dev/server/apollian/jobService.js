import path from 'node:path';

// Relative, not `@modules/apollian`: this runs inside Vite's config loader,
// which resolves no aliases. renderOptions.mjs is dependency-free for that
// reason.
import {
  RENDER_OPTIONS,
  normalizeOptions,
} from '../../../modules/apollian/renderOptions.mjs';
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
  const command = {
    ...options,
    out:
      kind === 'still'
        ? outputDirectory
        : path.join(outputDirectory, 'apollian.mp4'),
  };

  return {
    args: [
      path.join(
        rootDir,
        'scripts',
        kind === 'still' ? 'apollian-generate.mjs' : 'apollian-video.mjs'
      ),
      // A typed flag is a pin to the CLI, so a rollable option only travels
      // when the page sent it.
      ...optionsToFlags(
        command,
        (key) => RENDER_OPTIONS[key]?.facet && !chosen.has(key)
      ),
    ],
    files: {},
    options,
  };
}

export default createRenderJobService({
  curatedRoot: path.join('public', 'images', 'apollian'),
  curatedUrl: '/images/apollian',
  kinds: ['still', 'video'],
  maxConcurrent: 1,
  outputRoot: path.join('output', 'apollian-workbench', 'jobs'),
  prepare,
  tool: 'apollian',
});
