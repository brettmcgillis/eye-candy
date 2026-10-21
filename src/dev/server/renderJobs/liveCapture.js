import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import { RenderJobRequestError } from './jobService';

const MAX_CAPTURE_BYTES = 128 * 1024 * 1024;

const invalid = (message) =>
  new RenderJobRequestError(400, 'INVALID_CAPTURE', message);

// A Live-tab capture: the page's PNG and plot are staged, then finished by
// `<slug>-generate --capture` as an ordinary stills job, so a capture gets
// the same formats, overlay and sidecar as a CLI render.
async function createCapture(
  rootDir,
  { service, slug },
  { config, name, options, png, svg }
) {
  if (typeof png !== 'string' || png.length === 0) {
    throw invalid('A capture needs its PNG.');
  }
  if (!config || typeof config !== 'object') {
    throw invalid('A capture needs the generation it shows.');
  }
  const folder = path.join(
    'output',
    `${slug}-workbench`,
    'captures',
    randomUUID()
  );
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

// The `POST /captures` route a tool with a Live tab adds to its plugin.
export default function liveCaptureRoute({ service, slug }) {
  return {
    handler: async (rootDir, body) => ({
      job: await createCapture(rootDir, { service, slug }, body),
    }),
    maxBytes: MAX_CAPTURE_BYTES,
    method: 'POST',
    path: '/captures',
  };
}
