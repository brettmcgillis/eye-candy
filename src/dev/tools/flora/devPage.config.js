import { lazy } from 'react';

export default {
  slug: 'flora',
  aliases: ['FloraCLI'],
  label: 'FloraCLI',
  group: 'render-workbenches',
  description: 'Generate images and videos using the FloraCLI.',
  Component: lazy(() => import('./FloraWorkbenchPage')),
};
