#!/usr/bin/env node

/* eslint-disable no-await-in-loop */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { usageFor } from '../src/modules/subdivision/renderOptions.mjs';
import { readPackageVersion } from './lib/cliArgs.mjs';
import createProgress, { runStage } from './lib/progress.mjs';
import {
  REPO_ROOT,
  assertPalette,
  buildPieceFor,
  loadKernel,
  parseCli,
  pieceAt,
  plotSvg,
  rasterise,
  rollArgs,
  sidecarFor,
} from './lib/subdivisionRender.mjs';

async function main() {
  const parsed = await parseCli('still', process.argv.slice(2));
  if (parsed.help) {
    process.stdout.write(
      `Usage: npm run subdivision:generate -- [options]\n${usageFor('still')}`
    );
    return;
  }
  const options = { ...parsed.options, version: await readPackageVersion() };
  const formats = ['png', 'webp'].filter((format) => options[format]);
  const outRoot = path.resolve(REPO_ROOT, String(options.out));

  await mkdir(outRoot, { recursive: true });
  process.stdout.write(
    `subdivision stills: ${options.count} piece${options.count === 1 ? '' : 's'}, ` +
      `${options.width}x${options.height} at ${options.pixelRatio}x, ` +
      `formats ${[...formats, options.svg ? 'svg' : null].filter(Boolean).join('+')}\n` +
      `output: ${outRoot}\n`
  );

  const kernel = await runStage('loading the Subdivision kernel', loadKernel);
  assertPalette(kernel, parsed);
  const roll = rollArgs(kernel, { options, typed: parsed.typed });
  const progress = createProgress('rendering pieces', options.count);

  for (let index = 0; index < options.count; index += 1) {
    const { config, seed } = pieceAt(kernel, { index, options, roll });
    const dir = path.join(outRoot, seed);

    await progress.stage(`rendering ${seed}`, async () => {
      const piece = await buildPieceFor(kernel, config, options);
      await mkdir(dir, { recursive: true });
      await writeFile(
        path.join(dir, 'props.json'),
        `${JSON.stringify(sidecarFor({ config, options, piece }), null, 2)}\n`
      );
      await Promise.all(
        formats.map(async (format) =>
          writeFile(
            path.join(dir, `piece.${format}`),
            await rasterise(kernel, piece, config, options, format)
          )
        )
      );
      if (options.svg) {
        await writeFile(
          path.join(dir, 'piece.svg'),
          plotSvg(kernel, piece, config, options)
        );
      }
    });
    progress.update(index + 1);
    progress.log(`saved ${seed}: ${dir}`);
  }
  progress.done('rendered pieces');
  process.exit(0);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
