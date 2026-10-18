#!/usr/bin/env node

/* eslint-disable no-console */
// Drift alarm for the overlay burn-in: every render workbench must declare the
// overlay options, wear its own scene's icon in both CLIs, and have that icon
// in public/icons. See docs/render-workbench.md §7.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { REPO_ROOT } from './lib/loadModules.mjs';
import {
  OVERLAY_TOOLS,
  sceneIconFile,
  sceneIconPath,
  sceneIconSvg,
} from './lib/sceneIcons.mjs';

const OVERLAY_KEYS = ['overlay', 'ig', 'viewport'];
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

// Every render workbench, by the slug its CLIs are named for.
async function workbenchSlugs() {
  const toolsDir = path.join(REPO_ROOT, 'src/dev/tools');
  const sources = await Promise.all(
    (await readdir(toolsDir)).map((name) =>
      readFile(path.join(toolsDir, name, 'devPage.config.js'), 'utf8').catch(
        () => ''
      )
    )
  );
  return sources
    .filter((source) => source.includes("group: 'render-workbenches'"))
    .map((source) => /slug: '([^']+)'/u.exec(source)?.[1])
    .filter(Boolean);
}

async function checkIcon(slug) {
  const file = sceneIconFile(slug);
  const target = sceneIconPath(file);
  const svg = await sceneIconSvg(slug);
  const current = await readFile(target, 'utf8').catch(() => null);
  if (svg === null) {
    check(current !== null, `${slug}: public/icons/${file} is missing.`);
  } else {
    check(
      current === svg,
      `${slug}: public/icons/${file} is ${current === null ? 'missing' : 'not the scene’s icon'} — run npm run scene-icons.`
    );
  }
}

async function checkOptions(slug, { module }) {
  const { RENDER_OPTIONS } = await import(
    path.join(REPO_ROOT, 'src/modules', module, 'renderOptions.mjs')
  );
  OVERLAY_KEYS.forEach((key) =>
    check(
      key in RENDER_OPTIONS,
      `${slug}: src/modules/${module}/renderOptions.mjs has no "${key}" option — add standard.overlayOptions().`
    )
  );
  check(
    RENDER_OPTIONS.overlay?.section === 'overlay',
    `${slug}: "overlay" is not in the overlay section.`
  );
}

// Each CLI names its scene's icon through sceneIconFile(slug); Rorschach's
// bespoke renderer does it in one place for both of its CLIs.
async function checkClis(slug) {
  const call = `sceneIconFile('${slug}')`;
  const files =
    slug === 'rorschach'
      ? ['lib/rorschachRender.mjs']
      : ['generate', 'video'].map((kind) => `${slug}-${kind}.mjs`);
  await Promise.all(
    files.map(async (name) => {
      const file = path.join(REPO_ROOT, 'scripts', name);
      const source = await readFile(file, 'utf8').catch(() => null);
      // A generator may have no video CLI (Kumiko, Rug Pull).
      if (source === null) {
        check(
          name.endsWith('-video.mjs'),
          `${slug}: scripts/${name} is missing.`
        );
        return;
      }
      check(
        source.includes(call),
        `${slug}: scripts/${name} does not wear its scene's icon — add overlay: ${call}.`
      );
    })
  );
}

const slugs = await workbenchSlugs();
slugs.forEach((slug) =>
  check(
    slug in OVERLAY_TOOLS,
    `${slug}: a render workbench with no overlay burn-in — add it to OVERLAY_TOOLS in scripts/lib/sceneIcons.mjs.`
  )
);
Object.keys(OVERLAY_TOOLS).forEach((slug) =>
  check(
    slugs.includes(slug),
    `${slug}: in OVERLAY_TOOLS but not a render workbench.`
  )
);

await Promise.all(
  Object.entries(OVERLAY_TOOLS).flatMap(([slug, tool]) => [
    checkIcon(slug),
    checkOptions(slug, tool),
    checkClis(slug),
  ])
);

if (failures.length > 0) {
  console.error(`overlay check failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(
  `overlay check: ${slugs.length} workbenches burn in their own scene's icon.`
);
