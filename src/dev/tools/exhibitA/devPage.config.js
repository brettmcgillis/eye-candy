import { lazy } from 'react';

export default {
  slug: 'exhibit-a',
  aliases: ['ExhibitACLI'],
  label: 'ExhibitACLI',
  group: 'render-workbenches',
  description: 'Generate images and videos using the ExhibitACLI.',
  Component: lazy(() => import('./ExhibitAWorkbenchPage')),
};
