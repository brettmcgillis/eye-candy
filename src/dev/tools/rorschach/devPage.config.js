import { lazy } from 'react';

export default {
  slug: 'rorschach',
  label: 'RorschachCLI',
  description: 'Generate images and video using the RorschachCLI.',
  order: 50,
  Component: lazy(() => import('./RorschachWorkbenchPage')),
};
