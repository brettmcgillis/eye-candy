/* eslint-disable import/no-extraneous-dependencies */
import sharp from 'sharp';

import { REPO_ROOT } from './loadModules.mjs';
import overlaySvg from './overlaySvg.mjs';
import { runStage } from './progress.mjs';

// The app's overlay chrome, burnt into a render. It is identical on every
// frame of a run, but building it costs a handful of sharp calls (text
// measurement) and rasterising it costs more — together about 1.2s, which
// dwarfs the frame itself. Built and rasterised once per geometry instead.
const cache = new Map();

export default function overlayLayer({
  height,
  icon,
  ig,
  version,
  viewport,
  width,
}) {
  const key = `${width}x${height}:${icon}:${ig ?? 'none'}:${viewport ?? 'auto'}:${version}`;
  if (!cache.has(key)) {
    cache.set(
      key,
      runStage(`preparing overlay (${width}x${height})`, async () => {
        const svg = await overlaySvg({
          height,
          icon,
          ig,
          repoRoot: REPO_ROOT,
          version,
          viewport,
          width,
        });
        return sharp(Buffer.from(svg)).png().toBuffer();
      })
    );
  }
  return cache.get(key);
}
