import { lazy } from 'react';

export default {
  slug: 'rug-pull',
  aliases: ['RugPullCLI'],
  label: 'RugPullCLI',
  group: 'render-workbenches',
  description: 'Generate images and videos using the RugPullCLI.',
  Component: lazy(() => import('./RugPullWorkbenchPage')),
};
