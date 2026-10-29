#!/usr/bin/env node

/* eslint-disable no-console */
import {
  FAMILIES,
  RENDER_OPTIONS,
  defaultsFor,
  normalizeOptions,
} from '../src/modules/paperCuts/renderOptions.mjs';
import loadModules from './lib/loadModules.mjs';
import schemaControlCoverage from './lib/schemaControlCoverage.mjs';
import checkWorkbenchPage from './lib/workbenchPage.mjs';

// Scene controls whose schema folders the presets are applied through.
const CONTROLS = ['/src/components/scenes/WebGL/PaperCuts/utils/controls.js'];

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};
const entry = '/src/modules/paperCuts/index.js';
const { [entry]: kernel } = await loadModules([entry]);
let inspected = 0;
FAMILIES.forEach((family) =>
  ['halfTurn', 'quarterTurn'].forEach((symmetry) => {
    for (let seed = 0; seed < 24; seed += 1) {
      const config = {
        ...kernel.rollConfig(`check-${seed}`),
        generationFamily: family,
        symmetry,
      };
      const frame = kernel.generate(config);
      const label = `${family}/${symmetry}/${seed}`;
      check(
        frame.layers.length > 0 && frame.stats.pieces <= 160,
        `${label}: invalid piece budget`
      );
      check(
        JSON.stringify(frame) === JSON.stringify(kernel.generate(config)),
        `${label}: not deterministic`
      );
      const nearer = [];
      frame.layers.forEach((layer) => {
        layer.forEach((s, i) => {
          check([1, 2, 4].includes(s.size), `${label}: invalid size`);
          check(
            s.position.every((v) => Number.isInteger(v * 4)),
            `${label}: off-grid`
          );
          check(
            s.position.every((v) => Math.abs(v) + s.size / 2 <= config.reach),
            `${label}: outside extent`
          );
          check(
            !layer.slice(i + 1).some((t) => kernel.overlaps(s, t)),
            `${label}: coplanar overlap`
          );
          check(
            kernel.coveredArea(s, nearer) <= s.size * s.size * 0.85 + 1e-8,
            `${label}: hidden paper`
          );
          kernel.orbitOf(s.position, symmetry).forEach((p) =>
            check(
              layer.some(
                (t) =>
                  t.size === s.size && t.position.every((v, k) => v === p[k])
              ),
              `${label}: broken symmetry`
            )
          );
        });
        nearer.push(...layer);
      });
      inspected += 1;
    }
  })
);
const paletteNames = new Set(
  Array.from(
    { length: 32 },
    (_, index) => kernel.rollConfig(`palette-${index}`).paletteName
  )
);
check(
  paletteNames.size > 12,
  'Palette rolls do not explore the shared library.'
);
const manual = kernel.normalizeDesign({
  layerCount: 3,
  rotate: false,
  pieces: [
    [0, 0, 1, 0, 0],
    [1, 1, 2, 0, 0],
    [2, 2, 4, 0, 0],
  ],
});
const code = kernel.encodeDesign(manual);
check(
  kernel.encodeDesign(kernel.decodeDesign(code)) === code,
  'Design code does not round-trip.'
);
const duplicate = kernel.editPieces(
  manual,
  [0],
  (piece) => ({ x: piece.x + 2 }),
  { duplicate: true }
);
check(duplicate?.pieces.length === 4, 'Duplicate does not add a piece.');
check(
  kernel.placePiece(manual, { layer: 0, size: 1, x: 0, y: 0 }) === null,
  'Designer permits coplanar overlap.'
);
const moved = kernel.editPieces(manual, [0], (piece) => ({
  x: piece.x + 0.25,
}));
check(
  moved?.pieces[0].x === 0.25 && manual.pieces[0].x === 0,
  'Design movement is not immutable.'
);
const held = Array.from({ length: 3 }, (_, i) =>
  kernel.generate({ ...kernel.rollConfig(`manual-${i}`), paperDesign: code })
);
check(
  held.every(
    (frame) => JSON.stringify(frame.layers) === JSON.stringify(held[0].layers)
  ),
  'A design layout changes during look rolls.'
);
const options = {
  ...kernel.defaultsFor('still', 'workbench'),
  width: 256,
  height: 256,
  svgOcclusion: false,
};
const config = { ...kernel.sceneDefaults(), paperDesign: code, rotate: false };
const frame = kernel.generate(config);
const camera = kernel.frameView({
  bounds: { min: [-2, -2, -1], max: [2, 2, 1] },
  options,
  view: 'angle',
});
const facePlot = kernel.renderSvg({
  frame,
  config,
  camera,
  options: { ...options, svgStyle: 'faces' },
});
const edgePlot = kernel.renderSvg({
  frame,
  config,
  camera,
  options: { ...options, svgStyle: 'edges' },
});
check(
  (edgePlot.match(/M[0-9-]/gu) ?? []).length >
    (facePlot.match(/M[0-9-]/gu) ?? []).length,
  'Faces and edges produce identical angled line work.'
);
['still', 'video'].forEach((kind) =>
  normalizeOptions(kind, defaultsFor(kind, 'workbench'), 'workbench')
);
await checkWorkbenchPage(
  'src/dev/tools/paperCuts/PaperCutsWorkbenchPage.jsx',
  RENDER_OPTIONS,
  check
);
failures.push(...(await schemaControlCoverage(CONTROLS)));
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(
  `PaperCuts: ${inspected} seeded compositions preserve the grammar; schema, palettes, SVG modes and manual designs agree.`
);
