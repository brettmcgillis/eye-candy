#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { parseArgs } from './lib/cliArgs.mjs';
import { REPO_ROOT } from './lib/loadModules.mjs';
import {
  encodePng,
  loadPrintShop,
  printEnv,
  printName,
} from './lib/printShop.mjs';

const USAGE = `PrintShop export — turns a scene piece into STL / 3MF / GLB.

  node scripts/print-shop-export.mjs --printable ghost [options]
  node scripts/print-shop-export.mjs --list
  node scripts/print-shop-export.mjs --printable ghost --help
  node scripts/print-shop-export.mjs --job job.json   (what the dev tool runs)

Batch with --variants a,b and --sizes 60,150: every variant at every size.
Each print gets a folder: its model files (a removable stand is its own
<name>-stand.*), a <name>.png preview and props.json (options and checks).
`;

function list(items, fallback) {
  if (items == null || items === '') return [fallback];
  return String(items)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

async function main() {
  const args = parseArgs(process.argv.slice(2), {});
  const job = args.job
    ? JSON.parse(await readFile(path.resolve(args.job), 'utf8'))
    : null;
  const shop = await loadPrintShop();

  if (args.list) {
    shop.PRINTABLES.forEach((printable) => {
      process.stdout.write(
        `${printable.id}\t${printable.label} — ${printable.description}\n  variants: ${(printable.variants ?? []).join(', ')}\n`
      );
    });
    return;
  }

  const printableId = job?.printable ?? args.printable ?? 'ghost';
  const printable = shop.getPrintable(printableId);
  const schema = shop.schemaFor(printableId);
  if (args.help) {
    process.stdout.write(`${USAGE}${schema.usageFor('export')}`);
    return;
  }

  const raw = { ...(job?.options ?? {}), ...args };
  delete raw.job;
  delete raw.printable;
  const options = schema.normalizeOptions('export', raw);
  const out = path.resolve(
    REPO_ROOT,
    args.out ?? job?.out ?? path.join('output', 'print-shop')
  );
  await mkdir(out, { recursive: true });

  const variants = printable.variants
    ? list(options.variants, options.variant)
    : [null];
  const sizes = list(options.sizes, options.size).map(Number);
  const runs = variants.flatMap((variant) =>
    sizes.map((size) => ({
      ...options,
      size,
      ...(variant == null ? {} : { variant }),
    }))
  );
  runs.forEach((run) => {
    if (printable.variants && !printable.variants.includes(run.variant)) {
      throw new Error(
        `Unknown variant "${run.variant}". Known: ${printable.variants.join(', ')}.`
      );
    }
  });

  const formats = shop.FORMATS.filter((format) => options[format]);
  const env = await printEnv();
  process.stdout.write(
    `PrintShop · ${printable.label} · ${runs.length} print(s) · ${formats.join(', ')} → ${path.relative(REPO_ROOT, out)}\n`
  );

  for (let i = 0; i < runs.length; i += 1) {
    const run = runs[i];
    const name = printName(printable, run);
    process.stdout.write(`[${i + 1}/${runs.length}] ${name}\n`);
    // eslint-disable-next-line no-await-in-loop
    const { bodies, report } = await shop.assemblePrint(printable, run, env);
    const folder = path.join(out, name);
    // eslint-disable-next-line no-await-in-loop
    await mkdir(folder, { recursive: true });
    const title = `${printable.label} ${run.variant ?? ''}`.trim();
    const files = [];
    bodies.forEach((body) => {
      const base = body.id === 'piece' ? name : `${name}-${body.id}`;
      const seated = shop.seatModel(body.model);
      formats.forEach((format) => {
        const writer = shop.WRITERS[format];
        files.push({
          body: body.id,
          bytes: writer.write(seated, { title: `${title} ${body.label}` }),
          format,
          name: `${base}.${writer.extension}`,
        });
      });
    });
    // eslint-disable-next-line no-await-in-loop
    await Promise.all(
      files.map((file) => writeFile(path.join(folder, file.name), file.bytes))
    );
    // eslint-disable-next-line no-await-in-loop
    await writeFile(
      path.join(folder, `${name}.png`),
      // eslint-disable-next-line no-await-in-loop
      await encodePng(shop.renderThumbnail(bodies))
    );
    const printOptions = { ...run };
    ['out', 'sizes', 'variants'].forEach((key) => delete printOptions[key]);
    // eslint-disable-next-line no-await-in-loop
    await writeFile(
      path.join(folder, 'props.json'),
      `${JSON.stringify(
        {
          files: files.map(({ body, format, name: file }) => ({
            body,
            file,
            format,
          })),
          name,
          options: printOptions,
          printable: printable.id,
          report,
        },
        null,
        2
      )}\n`
    );
    report.bodies.forEach((body) => {
      const a = body.analysis;
      process.stdout.write(
        `  ${body.label}: ${a.bounds.size.map((v) => v.toFixed(1)).join(' × ')} mm · ${a.volumeCm3.toFixed(1)} cm³ · ${a.triangles} tris · ${a.watertight ? 'watertight' : 'NOT watertight'} · ${a.shells} shell(s)\n`
      );
    });
    process.stdout.write(`  built in ${report.buildMs} ms\n`);
    report.warnings.forEach((warning) => {
      process.stdout.write(`  ! ${warning}\n`);
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  });
