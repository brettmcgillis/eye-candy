#!/usr/bin/env node

/* eslint-disable no-console, no-await-in-loop, no-restricted-syntax, import/no-extraneous-dependencies */
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

import {
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
} from '../src/modules/cumulus/renderOptions.mjs';
import createBrowser from './lib/cumulusBrowser.mjs';
import { loadKernel } from './lib/cumulusRender.mjs';
import schemaControlCoverage from './lib/schemaControlCoverage.mjs';
import checkWorkbenchPage from './lib/workbenchPage.mjs';

// Scene controls whose schema folders the presets are applied through.
const CONTROLS = [
  '/src/components/scenes/WebGL/AllMyThoughtsAreSoCumulus/utils/controls.js',
];

const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};
await checkWorkbenchPage(
  'src/dev/tools/cumulus/CumulusWorkbenchPage.jsx',
  RENDER_OPTIONS,
  check
);
const { thoughts } = await loadKernel();
const defaults = normalizeOptions('still', defaultsFor('still'));
const fromCli = thoughts.rollConfig(
  'cli-seed',
  thoughts.rollArgs({ options: defaults, typed: new Set() })
);
check(fromCli.haloSeed === 'cli-seed', 'CLI defaults pinned the halo seed');
check(
  Number.isFinite(thoughts.controlsFor(fromCli).ringsPosition.y),
  'CLI options overwrote authored transforms'
);
for (const halo of thoughts.HALOS) {
  const config = thoughts.rollConfig('cumulus-check', { halos: halo });
  check(
    JSON.stringify(config) ===
      JSON.stringify(thoughts.rollConfig('cumulus-check', { halos: halo })),
    `${halo}: roll is not reproducible`
  );
  const c = thoughts.controlsFor(config);
  check(
    c.skullVisible && c.femurVisible,
    `${halo}: anatomy visibility changed`
  );
  check(
    c.skullScale === 0.1 && c.femurScale === 0.75,
    `${halo}: anatomy scale changed`
  );
  normalizeOptions('still', {
    ...defaultsFor('still'),
    ...thoughts.optionsFromConfig(config),
  });
}
const stat = thoughts.rollConfig('cumulus-check', {
  ...thoughts.rollArgs({ options: defaults, typed: new Set() }),
  halos: 'crtStaticRing',
});
check(
  stat.backgroundColor === '#000000' && stat.spotlightEnabled,
  'unpinned stage controls overrode the Static preset'
);
const held = thoughts.rollConfig(
  'cumulus-check',
  thoughts.rollArgs({
    options: {
      ...defaults,
      bloomEnabled: false,
      femurVisible: false,
      plPosition: { x: 1, y: 2, z: 3 },
    },
    typed: new Set(['bloomEnabled', 'femurVisible', 'plPosition']),
  })
);
check(
  !held.bloomEnabled && !held.femurVisible && held.plPosition.z === 3,
  'pinned stage and anatomy controls did not reach the config'
);
check(
  normalizeOptions('still', {
    ...defaultsFor('still'),
    skullPosition: '{"x":"1","y":2,"z":3}',
  }).skullPosition.x === 1,
  'vector options are not coerced to numbers'
);
let badVector = false;
try {
  normalizeOptions('still', {
    ...defaultsFor('still'),
    skullPosition: '{"x":"left"}',
  });
} catch {
  badVector = true;
}
check(badVector, 'a non-numeric vector was accepted');
for (const [name, preset] of Object.entries(thoughts.PRESETS)) {
  const pinned = thoughts.presetPins(name);
  const config = thoughts.rollConfig(
    'cumulus-check',
    thoughts.rollArgs({
      options: { ...defaults, ...pinned },
      typed: new Set(Object.keys(pinned)),
    })
  );
  const drifted = Object.keys(thoughts.optionsFromConfig(preset)).filter(
    (key) => JSON.stringify(config[key]) !== JSON.stringify(preset[key])
  );
  check(!drifted.length, `${name}: starting from it drifted ${drifted}`);
}
if (process.argv.includes('--render')) {
  const options = normalizeOptions('still', {
    width: 160,
    height: 200,
    pixelRatio: 1,
    svg: true,
  });
  const capturer = await createBrowser(options);
  try {
    for (const halo of thoughts.HALOS) {
      const drawn = {
        config: thoughts.rollConfig(
          `check-${halo}`,
          thoughts.rollArgs({
            options: { ...options, halos: halo },
            typed: new Set(),
          })
        ),
        name: `check-${halo}`,
      };
      const bounds = await capturer.load(drawn);
      const view = thoughts.frameThought({
        bounds,
        config: drawn.config,
        options,
      });
      const frame = await capturer.capture(view);
      let lo = 765;
      let hi = 0;
      for (let i = 0; i < frame.data.length; i += 4) {
        const luma = frame.data[i] + frame.data[i + 1] + frame.data[i + 2];
        lo = Math.min(lo, luma);
        hi = Math.max(hi, luma);
      }
      check(hi - lo > 30, `${halo}: empty or flat frame`);
      const svg = await capturer.svg(view, options);
      check(
        svg.includes('<path') && !svg.includes('<image'),
        `${halo}: missing vector plot`
      );
      if (process.env.CUMULUS_CHECK_OUT) {
        await mkdir(process.env.CUMULUS_CHECK_OUT, { recursive: true });
        await sharp(frame.data, {
          raw: { channels: 4, height: frame.height, width: frame.width },
        })
          .png()
          .toFile(`${process.env.CUMULUS_CHECK_OUT}/${halo}.png`);
        await writeFile(`${process.env.CUMULUS_CHECK_OUT}/${halo}.svg`, svg);
      }
      console.log(`${halo}: frame and SVG captured`);
    }
  } finally {
    await capturer.dispose();
  }
}
failures.push(...(await schemaControlCoverage(CONTROLS)));
if (failures.length) {
  failures.forEach((message) => console.error(message));
  process.exitCode = 1;
} else
  console.log(
    'Cumulus pipeline checks passed. Use --render for all eight WebGL frames and plots.'
  );
