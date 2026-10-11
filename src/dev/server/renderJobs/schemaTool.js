import path from 'node:path';

import createRenderJobService, {
  RenderJobRequestError,
  optionsToFlags,
} from './jobService';
import createRenderJobPlugin from './plugin';
import appendPreset, { uniqueName } from './presetFile';

// A generator whose CLIs follow the convention: `scripts/<slug>-generate.mjs`
// writes stills into the job folder, `scripts/<slug>-video.mjs` one
// `<slug>.mp4`, both taking the kernel's option schema as flags.
export function createSchemaJobService({
  kinds = ['still', 'video'],
  normalizeOptions,
  options: specs,
  slug,
  tool,
}) {
  async function prepare(rootDir, { kind, outputDirectory, payload }) {
    const fail = (message) =>
      new RenderJobRequestError(400, 'INVALID_OPTION', message);
    const sent = payload.options ?? {};
    const options = normalizeOptions(kind, sent, {
      fail,
      surface: 'workbench',
    });
    const chosen = new Set(Object.keys(sent));
    const out =
      kind === 'still'
        ? outputDirectory
        : path.join(outputDirectory, `${slug}.mp4`);
    const script = `${slug}-${kind === 'still' ? 'generate' : 'video'}.mjs`;

    return {
      args: [
        path.join(rootDir, 'scripts', script),
        // A typed flag is a pin to the CLI, so a rollable option only travels
        // when the page sent it.
        ...optionsToFlags(
          { ...options, out },
          (key) => specs[key]?.facet && !chosen.has(key)
        ),
      ],
      files: {},
      options,
    };
  }

  return createRenderJobService({
    curatedRoot: path.join('public', 'images', slug),
    curatedUrl: `/images/${slug}`,
    kinds,
    maxConcurrent: 1,
    outputRoot: path.join('output', `${slug}-workbench`, 'jobs'),
    prepare,
    tool,
  });
}

// Writes a generation into the scene's PRESETS as a hand-written preset
// would be: only what differs from the scene defaults.
export function createScenePresetWriter({
  base,
  configFrom,
  name,
  presetFromConfig,
  requires,
  scene,
  value = presetFromConfig,
}) {
  return function writeScenePreset(rootDir, { name: requested, sidecar }) {
    const config = configFrom(sidecar);
    if (config[requires] == null || config[requires] === '') {
      throw new Error(`The generation has no ${requires}.`);
    }
    const clean = String(requested ?? '')
      .replace(/[^\w -]/gu, '')
      .trim();
    return appendPreset(rootDir, {
      base,
      declaration: 'export const PRESETS = {',
      file: path.join(
        'src',
        'components',
        'scenes',
        'WebGPU',
        scene,
        'presets',
        'presets.js'
      ),
      nameFor: uniqueName(clean || name(config, sidecar)),
      value: value(config),
    });
  };
}

// The /dev-api/<tool> surface for a schema generator: jobs, saved media and
// a /presets route that writes a generation into its scene.
export default function createSchemaToolPlugin({
  kinds,
  normalizeOptions,
  options,
  preset,
  routes = [],
  slug,
  tool,
  writePreset = createScenePresetWriter(preset),
}) {
  return createRenderJobPlugin({
    routes: [
      {
        handler: async (rootDir, body) => ({
          preset: await writePreset(rootDir, body),
        }),
        method: 'POST',
        path: '/presets',
      },
      ...routes,
    ],
    service: createSchemaJobService({
      kinds,
      normalizeOptions,
      options,
      slug,
      tool,
    }),
    tool,
  });
}
