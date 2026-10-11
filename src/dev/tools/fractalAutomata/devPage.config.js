import { lazy } from 'react';

export default {
  slug: 'fractal-automata',
  aliases: ['FractalAutomataCLI'],
  label: 'FractalAutomataCLI',
  group: 'render-workbenches',
  description: 'Generate images and videos using the FractalAutomataCLI.',
  Component: lazy(() => import('./FractalAutomataWorkbenchPage')),
};
