import { writeFile } from 'node:fs/promises';

import createBrowser from './lib/cumulusBrowser.mjs';

const browser = await createBrowser(
  {},
  {
    api: 'paintedBake',
    entry: 'scripts/lib/paintedBake.js',
  }
);
try {
  const { width, height, data } = await browser.capture();
  await writeFile(
    new URL('../src/modules/paintedRender/pigment.json', import.meta.url),
    `${JSON.stringify(
      {
        source:
          'p5.brush 3.0.0; scripts/bake-painted-assets.mjs; seeds 3719, 212, 937, 734; channels: wash, pencil, cloud, leaf',
        width,
        height,
        data: data.toString('base64'),
      },
      null,
      2
    )}\n`
  );
  const botanical = await browser.capture('botanical');
  await writeFile(
    new URL('../src/modules/paintedRender/botanical.json', import.meta.url),
    `${JSON.stringify({ source: 'p5.brush 3.0.0; Three5 leaf outline, wash, native hatch and stroke mechanism; seeds 734–737; channels: wash, hatched fill, outline and veins, stem stroke', width: botanical.width, height: botanical.height, data: botanical.data.toString('base64') }, null, 2)}\n`
  );
} finally {
  await browser.dispose();
}
