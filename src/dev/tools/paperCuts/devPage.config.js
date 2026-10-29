import { lazy } from 'react';

export default {
  slug: 'paper-cuts',
  aliases: ['PaperCutsCLI'],
  label: 'PaperCutsCLI',
  group: 'render-workbenches',
  description: 'Generate layered paper compositions, videos and pen plots.',
  Component: lazy(() => import('./PaperCutsWorkbenchPage')),
};
