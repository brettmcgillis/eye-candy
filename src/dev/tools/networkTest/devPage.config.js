import { lazy } from 'react';

export default {
  slug: 'network-test',
  aliases: ['NetworkTestCLI'],
  label: 'NetworkTestCLI',
  group: 'render-workbenches',
  description: 'Generate images and videos using the NetworkTestCLI.',
  Component: lazy(() => import('./NetworkTestWorkbenchPage')),
};
