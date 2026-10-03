import { lazy } from 'react';

export default {
  slug: 'trucheterie',
  aliases: ['TrucheterieCLI'],
  label: 'TrucheterieCLI',
  group: 'render-workbenches',
  description: 'Generate images and videos using the TrucheterieCLI.',
  Component: lazy(() => import('./TrucheterieWorkbenchPage')),
};
