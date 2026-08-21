#!/usr/bin/env node

/* eslint-disable import/no-extraneous-dependencies, no-await-in-loop */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  parseArgs,
  readPackageVersion,
  resolveIgPreset,
  resolveViews,
} from './lib/cliArgs.mjs';
import {
  REPO_ROOT,
  buildTest,
  disposeCapturers,
  frameSvg,
  loadSceneModules,
  renderFrame,
} from './lib/rorschachRender.mjs';

// Renders Rorschach tests entirely in Node — no browser, no GPU. The scene's
// generator (utils/testGenerator.js and everything under it) is pure math with
// no three.js imports, and its strokes are unlit flat-color lines, so
// utils/renderTestSvg.js can reproduce a frame exactly as SVG.

const DEFAULTS = {
  bloom: true,
  // Match DEFAULT_PRESET ('001') in the scene's presets.js.
  bloomRadius: 0.3,
  bloomStrength: 0.5,
  bloomThreshold: 1,
  count: 1,
  distance: 22,
  flatten: 0,
  flattenAxis: 'z',
  fov: 42,
  height: 1080,
  ig: 'post',
  out: 'output/rorschach',
  overlay: false,
  renderer: 'gpu',
  simplify: 0.4,
  viewport: null,
  stroke: 0,
  views: 'front,back,top,bottom',
  width: 1080,
};

function usage() {
  process.stdout.write(
    `Usage: npm run rorschach:generate -- [options]

  --count N           Number of tests (default ${DEFAULTS.count})
  --seed S            Seed for the first test; later tests increment from it.
                      Omit for a random seed per test.
  --out DIR           Output directory (default ${DEFAULTS.out})
  --width PX          Output width (default ${DEFAULTS.width})
  --height PX         Output height (default ${DEFAULTS.height})
  --views LIST        front,back,top,bottom (default all)
  --stroke PX         Stroke width; 0 scales it from --width (default auto)
  --simplify PX       Screen-space decimation floor (default ${DEFAULTS.simplify})
  --fov DEG           Vertical field of view (default ${DEFAULTS.fov})
  --distance N        Camera distance; lower crops in (default ${DEFAULTS.distance})
  --flatten N         0-1 squash toward 2D (default ${DEFAULTS.flatten})
  --flattenAxis A     z or y (default ${DEFAULTS.flattenAxis})
  --bloomStrength N   Additive glow gain (default ${DEFAULTS.bloomStrength})
  --bloomRadius N     Glow spread, 0-1 (default ${DEFAULTS.bloomRadius})
  --bloomThreshold N  Brightness a color must exceed to bloom (default ${DEFAULTS.bloomThreshold})
  --viewport N        CSS pixel width the overlay emulates; output width over
                      this is the device pixel ratio it draws at. Defaults to
                      390 (a vertical iPhone) with --ig, else 1440.
  --renderer R        gpu (real WebGPU + post) or svg (approximation)
                      (default ${DEFAULTS.renderer}). The .svg output always
                      uses the svg path; this only affects the .png.
  --no-bloom          Skip bloom entirely
  --overlay           Burn the scene overlay into the PNG (off by default)
  --ig PRESET         story|reel|post safe-area insets, or none (default ${DEFAULTS.ig});
                      only applies with --overlay
`
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2), DEFAULTS);
  if (args.help) {
    usage();
    return;
  }

  const views = resolveViews(args.views);
  const options = {
    ...args,
    ig: resolveIgPreset(args.ig),
    version: await readPackageVersion(),
  };

  const modules = await loadSceneModules();
  const outRoot = path.resolve(REPO_ROOT, String(args.out));
  await mkdir(outRoot, { recursive: true });

  for (let i = 0; i < args.count; i += 1) {
    const seed =
      typeof args.seed === 'number' ? args.seed + i : modules.randomSeed();

    process.stdout.write(`[${i + 1}/${args.count}] generating test ${seed}\n`);
    const config = modules.rollTestConfig(seed);
    const test = buildTest(modules, config);

    const dir = path.join(outRoot, String(seed));
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, 'props.json'),
      `${JSON.stringify({ preset: config, render: options }, null, 2)}\n`
    );

    await views.reduce(async (previous, view) => {
      await previous;
      process.stdout.write(`  drawing ${view}\n`);

      // The .svg keeps the in-file filter approximation so it still glows when
      // opened on its own; SVG has no way to express the raster bloom pass.
      await writeFile(
        path.join(dir, `${view}.svg`),
        frameSvg(modules, {
          bloomEnabled: options.bloom,
          config,
          options,
          test,
          view,
        })
      );

      const png = await renderFrame(modules, { config, options, test, view });
      return writeFile(path.join(dir, `${view}.png`), png);
    }, Promise.resolve());

    process.stdout.write(`  saved ${dir}\n`);
  }

  await disposeCapturers();
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exitCode = 1;
});
