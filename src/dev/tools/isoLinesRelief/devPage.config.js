import { lazy } from 'react';

export default {
  slug: 'iso-lines-relief',
  aliases: ['IsoLinesReliefCLI'],
  label: 'IsoLinesReliefCLI',
  group: 'render-workbenches',
  description: 'Generate images and videos using the IsoLinesReliefCLI.',
  Component: lazy(() => import('./IsoLinesReliefWorkbenchPage')),
};
