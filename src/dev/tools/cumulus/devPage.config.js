import { lazy } from 'react';

export default {
  slug: 'cumulus',
  aliases: ['CumulusCLI'],
  label: 'CumulusCLI',
  group: 'render-workbenches',
  description: 'Generate images and videos using the CumulusCLI.',
  Component: lazy(() => import('./CumulusWorkbenchPage')),
};
