import { lazy } from 'react';

export default {
  slug: 'hyper-cubes',
  aliases: ['HyperCubesCLI'],
  label: 'HyperCubesCLI',
  group: 'render-workbenches',
  description: 'Generate images and videos using the HyperCubesCLI.',
  Component: lazy(() => import('./HyperCubesWorkbenchPage')),
};
