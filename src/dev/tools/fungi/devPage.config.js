import { lazy } from 'react';

export default {
  slug: 'fungi',
  aliases: ['FungiCLI'],
  label: 'FungiCLI',
  group: 'render-workbenches',
  description: 'Generate images and videos using the FungiCLI.',
  Component: lazy(() => import('./FungiWorkbenchPage')),
};
