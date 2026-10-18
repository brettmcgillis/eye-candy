import { lazy } from 'react';

export default {
  slug: 'ghost-buster',
  aliases: ['GhostBusterCLI', 'ghostbuster'],
  label: 'GhostBusterCLI',
  group: 'render-workbenches',
  description:
    'Render and plot the ghost in any GhostBuster skin: rolled stills and video from the CLI, or pause and capture a live one.',
  Component: lazy(() => import('./GhostBusterWorkbenchPage')),
};
