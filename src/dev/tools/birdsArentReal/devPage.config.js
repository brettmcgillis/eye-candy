import { lazy } from 'react';

export default {
  slug: 'birds-arent-real',
  aliases: ['BirdsArentRealCLI', 'birdsarentreal', 'fake-birds'],
  label: 'BirdsArentRealCLI',
  group: 'render-workbenches',
  description: 'Generate images and videos using the BirdsArentRealCLI.',
  Component: lazy(() => import('./BirdsArentRealWorkbenchPage')),
};
