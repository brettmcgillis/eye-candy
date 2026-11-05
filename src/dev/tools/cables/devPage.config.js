import { lazy } from 'react';

export default {
  slug: 'cables',
  aliases: ['CablesCLI'],
  label: 'CablesCLI',
  group: 'render-workbenches',
  description: 'Generate images and videos using the CablesCLI.',
  Component: lazy(() => import('./CablesWorkbenchPage')),
};
