import { lazy } from 'react';

export default {
  slug: 'subdivision',
  aliases: ['SubdivisionCLI'],
  label: 'SubdivisionCLI',
  description:
    'Generate recursive-subdivision stills (PNG, WebP, plotter SVG) using the SubdivisionCLI.',
  order: 65,
  Component: lazy(() => import('./SubdivisionWorkbenchPage')),
};
