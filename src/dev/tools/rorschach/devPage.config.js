import { lazy } from 'react';

export default {
  slug: 'rorschach',
  label: 'RorschachCLI',
  group: 'render-workbenches',
  description: 'Generate images and video using the RorschachCLI.',
  Component: lazy(() => import('./RorschachWorkbenchPage')),
};
