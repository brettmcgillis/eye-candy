import { lazy } from 'react';

export default {
  slug: 'hyper-cubes',
  aliases: ['HyperCubesCLI'],
  label: 'HyperCubesCLI',
  description:
    'Generate HyperCubes structures in batches — stills, grow/morph/turntable videos and plotter SVG — using the HyperCubesCLI.',
  order: 60,
  Component: lazy(() => import('./HyperCubesWorkbenchPage')),
};
