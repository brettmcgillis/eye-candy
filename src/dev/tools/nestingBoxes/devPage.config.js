import { lazy } from 'react';

export default {
  slug: 'nesting-boxes',
  aliases: ['NestingBoxesCLI'],
  label: 'NestingBoxesCLI',
  description:
    'Generate Nesting Boxes trees in batches — stills, grow/loop/drift/turntable videos and plotter SVG — using the NestingBoxesCLI.',
  order: 59,
  Component: lazy(() => import('./NestingBoxesWorkbenchPage')),
};
