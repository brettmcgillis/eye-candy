import { lazy } from 'react';

export default {
  slug: 'subdivision-relief',
  aliases: ['SubdivisionReliefCLI'],
  label: 'SubdivisionReliefCLI',
  group: 'render-workbenches',
  description: 'Generate images and videos using the SubdivisionReliefCLI.',
  Component: lazy(() => import('./SubdivisionReliefWorkbenchPage')),
};
