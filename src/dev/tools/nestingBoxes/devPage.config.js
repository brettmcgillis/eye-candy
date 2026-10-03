import { lazy } from 'react';

export default {
  slug: 'nesting-boxes',
  aliases: ['NestingBoxesCLI'],
  label: 'NestingBoxesCLI',
  group: 'render-workbenches',
  description: 'Generate images and videos using the NestingBoxesCLI.',
  Component: lazy(() => import('./NestingBoxesWorkbenchPage')),
};
