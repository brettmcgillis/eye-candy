import { lazy } from 'react';

export default {
  slug: 'flora',
  aliases: ['FloraCLI'],
  label: 'FloraCLI',
  description: 'Generate Flora stills, videos and bouquets using the FloraCLI.',
  order: 55,
  Component: lazy(() => import('./FloraWorkbenchPage')),
};
