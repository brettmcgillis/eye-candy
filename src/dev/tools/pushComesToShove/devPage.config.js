import { lazy } from 'react';

export default {
  slug: 'push-comes-to-shove',
  aliases: ['PushComesToShoveCLI'],
  label: 'PushComesToShoveCLI',
  group: 'render-workbenches',
  description: 'Generate images and videos using the PushComesToShoveCLI.',
  Component: lazy(() => import('./PushComesToShoveWorkbenchPage')),
};
