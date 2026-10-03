import { lazy } from 'react';

export default {
  slug: 'block-party',
  aliases: ['BlockPartyCLI'],
  label: 'BlockPartyCLI',
  group: 'render-workbenches',
  description: 'Generate images and videos using the BlockPartyCLI.',
  Component: lazy(() => import('./BlockPartyWorkbenchPage')),
};
