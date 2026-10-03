import { lazy } from 'react';

export default {
  slug: 'subdivision',
  aliases: ['SubdivisionCLI'],
  label: 'SubdivisionCLI',
  group: 'render-workbenches',
  description: 'Generate images and videos using the SubdivisionCLI.',
  Component: lazy(() => import('./SubdivisionWorkbenchPage')),
};
