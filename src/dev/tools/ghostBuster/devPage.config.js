import { lazy } from 'react';

export default {
  slug: 'ghost-buster',
  aliases: ['GhostBusterCLI', 'ghostbuster'],
  label: 'GhostBusterCLI',
  group: 'render-workbenches',
  description: 'Generate images and videos using the GhostBusterCLI.',
  Component: lazy(() => import('./GhostBusterWorkbenchPage')),
};
