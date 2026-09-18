import { lazy } from 'react';

export default {
  slug: 'fungi',
  aliases: ['FungiCLI'],
  label: 'FungiCLI',
  description:
    'Generate Fungi stills and videos in batches using the FungiCLI.',
  order: 56,
  Component: lazy(() => import('./FungiWorkbenchPage')),
};
