import { lazy } from 'react';

export default {
  slug: 'kumiko',
  aliases: ['KumikoCLI'],
  label: 'KumikoCLI',
  group: 'render-workbenches',
  description: 'Generate images and videos using the KumikoCLI.',
  Component: lazy(() => import('./KumikoWorkbenchPage')),
};
