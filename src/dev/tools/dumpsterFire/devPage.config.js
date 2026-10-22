import { lazy } from 'react';

export default {
  slug: 'dumpster-fire',
  aliases: ['DumpsterFireCLI', 'dumpsterfire'],
  label: 'DumpsterFireCLI',
  group: 'render-workbenches',
  description: 'Generate images, videos and plots using the DumpsterFireCLI.',
  Component: lazy(() => import('./DumpsterFireWorkbenchPage')),
};
