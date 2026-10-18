import { lazy } from 'react';

export default {
  slug: 'imperfection',
  aliases: ['ImperfectionCLI'],
  label: 'ImperfectionCLI',
  group: 'render-workbenches',
  description:
    'Generate Imperfection paintings and loops using the ImperfectionCLI.',
  Component: lazy(() => import('./ImperfectionWorkbenchPage')),
};
