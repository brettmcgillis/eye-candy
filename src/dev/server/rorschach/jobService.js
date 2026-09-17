import path from 'node:path';

// Relative rather than `@modules/rorschach`: this runs inside Vite's config
// loader, which doesn't resolve the app's path aliases. renderOptions.mjs is
// dependency-free so it can be reached this way — see
// docs/rorschach-pipeline.md.
import {
  RENDER_OPTIONS,
  normalizeOptions,
} from '../../../modules/rorschach/renderOptions.mjs';
import createRenderJobService, {
  RenderJobRequestError,
  optionsToFlags,
} from '../renderJobs/jobService';

const OUTPUT_ROOT = path.join('output', 'rorschach-workbench', 'jobs');

// A rollable option is only forwarded when the caller actually chose it: the
// CLI reads an explicitly typed flag as a pin, so emitting every key — which
// is what normalizeOptions leaves behind once defaults are merged — pins the
// entire test and makes rolling impossible from the workbench.
function prepare(rootDir, { kind, outputDirectory, payload }) {
  const options = normalizeOptions(kind, payload.options ?? {}, {
    fail: (message) =>
      new RenderJobRequestError(400, 'INVALID_OPTION', message),
    surface: 'workbench',
  });
  const chosen = new Set([
    ...Object.keys(payload.options ?? {}),
    'out',
    'stillsOut',
  ]);
  const command = { ...options };

  if (kind === 'still') {
    command.out = outputDirectory;
  } else {
    command.out = path.join(outputDirectory, 'rorschach.mp4');
    if (['growth', 'stills'].includes(options.mode) && options.keepImages) {
      command.stillsOut = path.join(outputDirectory, 'stills');
    }
    delete command.keepImages;
  }

  const script =
    kind === 'still' ? 'rorschach-generate.mjs' : 'rorschach-video.mjs';
  return {
    args: [
      path.join(rootDir, 'scripts', script),
      ...optionsToFlags(
        command,
        (key) => RENDER_OPTIONS[key]?.facet && !chosen.has(key)
      ),
    ],
    options,
  };
}

export default createRenderJobService({
  curatedRoot: path.join('public', 'images', 'rorschach'),
  curatedUrl: '/images/rorschach',
  extraRoots: [
    { prefix: 'batch-', root: path.join('output', 'batch'), source: 'legacy' },
  ],
  kinds: ['still', 'video'],
  outputRoot: OUTPUT_ROOT,
  prepare,
  tool: 'rorschach',
});
