import { lazy } from 'react';

export default {
  slug: 'argyle',
  aliases: ['ArgyleCLI'],
  label: 'ArgyleCLI',
  group: 'render-workbenches',
  description:
    'Layered argyle: Perlin fields, colour choreography, relief, loops and vector plots.',
  Component: lazy(() => import('./ArgyleWorkbenchPage')),
};
