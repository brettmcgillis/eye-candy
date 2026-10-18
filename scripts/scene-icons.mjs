#!/usr/bin/env node

/* eslint-disable no-console */
// Writes the scene icons the render workbenches burn into their overlay from
// each scene's own scene.config.jsx. `npm run overlay:check` fails when one is
// stale. See docs/render-workbench.md §7.
import { readFile, writeFile } from 'node:fs/promises';

import {
  OVERLAY_TOOLS,
  sceneIconFile,
  sceneIconPath,
  sceneIconSvg,
} from './lib/sceneIcons.mjs';

const written = (
  await Promise.all(
    Object.keys(OVERLAY_TOOLS).map(async (slug) => {
      const svg = await sceneIconSvg(slug);
      if (svg === null) return null;
      const file = sceneIconFile(slug);
      const current = await readFile(sceneIconPath(file), 'utf8').catch(
        () => null
      );
      if (current === svg) return null;
      await writeFile(sceneIconPath(file), svg);
      return file;
    })
  )
).filter(Boolean);

written.forEach((file) => console.log(`wrote public/icons/${file}`));
console.log(
  written.length > 0 ? 'scene icons: written.' : 'scene icons: up to date.'
);
