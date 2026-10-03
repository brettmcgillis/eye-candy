import { lazy } from 'react';

export default {
  slug: 'iso-lines',
  aliases: ['IsoLinesCLI'],
  label: 'IsoLinesCLI',
  group: 'render-workbenches',
  description: 'Generate images and videos using the IsoLinesCLI.',
  Component: lazy(() => import('./IsoLinesWorkbenchPage')),
};
