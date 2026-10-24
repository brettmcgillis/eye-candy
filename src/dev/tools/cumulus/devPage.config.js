import { lazy } from 'react';

export default {
  slug: 'cumulus',
  aliases: ['CumulusCLI'],
  label: 'CumulusCLI',
  group: 'render-workbenches',
  description:
    'Randomize All My Thoughts Are So Cumulus halos, capture stills and video, and plot in color or black ink.',
  Component: lazy(() => import('./CumulusWorkbenchPage')),
};
