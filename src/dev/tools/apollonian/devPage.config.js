import { lazy } from 'react';

export default {
  slug: 'apollonian',
  aliases: ['ApollonianCLI'],
  label: 'ApollonianCLI',
  group: 'render-workbenches',
  description: 'Generate images and videos using the ApollonianCLI.',
  Component: lazy(() => import('./ApollonianWorkbenchPage')),
};
