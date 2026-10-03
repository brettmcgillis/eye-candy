import { lazy } from 'react';

export default {
  slug: 'brutalist',
  aliases: ['BrutalistCLI'],
  label: 'BrutalistCLI',
  group: 'render-workbenches',
  description: 'Generate images and videos using the BrutalistCLI.',
  Component: lazy(() => import('./BrutalistWorkbenchPage')),
};
