import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

// Relative, not `@modules/ghostBuster`: this runs inside Vite's config
// loader, which resolves no aliases.
import {
  RENDER_OPTIONS,
  normalizeOptions,
} from '../../../modules/ghostBuster/renderOptions.mjs';
import { RenderJobRequestError } from '../renderJobs/jobService';
import createRenderJobPlugin from '../renderJobs/plugin';
import { createSchemaJobService } from '../renderJobs/schemaTool';

const SLUG = 'ghost-buster';
const CAPTURES = path.join('output', `${SLUG}-workbench`, 'captures');
const MAX_CAPTURE_BYTES = 128 * 1024 * 1024;

const invalid = (message) =>
  new RenderJobRequestError(400, 'INVALID_CAPTURE', message);

// A Live-tab capture: the page's PNG and plot are staged, then finished by
// `ghost-buster-generate --capture` as an ordinary stills job, so a capture
// gets the same formats, overlay and sidecar as a CLI render.
async function createCapture(
  rootDir,
  service,
  { config, name, options, png, svg }
) {
  if (typeof png !== 'string' || png.length === 0) {
    throw invalid('A capture needs its PNG.');
  }
  if (!config || typeof config !== 'object') {
    throw invalid('A capture needs the generation it shows.');
  }
  const folder = path.join(CAPTURES, randomUUID());
  const dir = path.resolve(rootDir, folder);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'live.png'), Buffer.from(png, 'base64'));
  if (typeof svg === 'string' && svg.length > 0) {
    await fs.writeFile(path.join(dir, 'live.svg'), svg);
  }
  const clean = String(name ?? '')
    .replace(/[^\w-]/gu, '')
    .slice(0, 60);
  await fs.writeFile(
    path.join(dir, 'capture.json'),
    `${JSON.stringify(
      {
        config,
        name: clean || `live-${Date.now().toString(36)}`,
        svg: Boolean(svg),
      },
      null,
      2
    )}\n`
  );
  return service.createJob(rootDir, {
    kind: 'still',
    options: { ...options, capture: folder, count: 1 },
  });
}

export default function ghostBusterDevPlugin() {
  const service = createSchemaJobService({
    normalizeOptions,
    options: RENDER_OPTIONS,
    slug: SLUG,
    tool: 'ghostBuster',
  });
  return createRenderJobPlugin({
    routes: [
      {
        handler: async (rootDir, body) => ({
          job: await createCapture(rootDir, service, body),
        }),
        maxBytes: MAX_CAPTURE_BYTES,
        method: 'POST',
        path: '/captures',
      },
    ],
    service,
    tool: 'ghostBuster',
  });
}
