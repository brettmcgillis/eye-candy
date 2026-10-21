import { readFile, rm } from 'node:fs/promises';
import path from 'node:path';

import { REPO_ROOT, sidecarFor } from './generatorCli.mjs';

// A Live-tab capture folder (live.png, optional live.svg, capture.json) as
// the dev server staged it.
export async function readCapture(folder) {
  const dir = path.resolve(REPO_ROOT, folder);
  const manifest = JSON.parse(
    await readFile(path.join(dir, 'capture.json'), 'utf8')
  );
  return { ...manifest, dir };
}

// A Live-tab capture arrives rendered: the page drew the PNG and the plot
// from the running stage, and this only finishes it the way any still is
// finished — formats, overlay and sidecar — then drops the upload.
export async function finishCapture({ capture, options, save }) {
  const out = await save(
    capture.name,
    sidecarFor({ config: capture.config, name: capture.name, options })
  );
  await out.view('live', async () => {
    await out.image('live', () => readFile(path.join(capture.dir, 'live.png')));
    if (options.svg && capture.svg) {
      await out.svg(
        'live',
        await readFile(path.join(capture.dir, 'live.svg'), 'utf8')
      );
    }
  });
  await rm(capture.dir, { force: true, recursive: true });
}
