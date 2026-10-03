import { lazy } from 'react';

export default {
  slug: 'apollian',
  aliases: ['ApollianCLI'],
  label: 'ApollianCLI',
  group: 'render-workbenches',
  description: 'Generate images and videos using the ApollianCLI.',
  Component: lazy(() => import('./ApollianWorkbenchPage')),
};
