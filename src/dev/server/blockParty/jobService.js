import path from 'node:path';

// Relative, not `@modules/blockParty`: this runs inside Vite's config loader,
// which resolves no aliases. renderOptions.mjs is dependency-free for that
// reason.
import {
  RENDER_OPTIONS,
  normalizeOptions,
} from '../../../modules/blockParty/renderOptions.mjs';
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
        : path.join(outputDirectory, 'block-party.mp4'),
  };

  return {
    args: [
      path.join(
        rootDir,
        'scripts',
        kind === 'still' ? 'block-party-generate.mjs' : 'block-party-video.mjs'
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
  curatedRoot: path.join('public', 'images', 'block-party'),
  curatedUrl: '/images/block-party',
  kinds: ['still', 'video'],
  maxConcurrent: 1,
  outputRoot: path.join('output', 'block-party-workbench', 'jobs'),
  prepare,
  tool: 'blockParty',
});
