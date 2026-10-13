import { lazy } from 'react';

export default {
  slug: 'trucheterie3d',
  aliases: ['Trucheterie3DCLI'],
  label: 'Trucheterie3DCLI',
  group: 'render-workbenches',
  description: 'Generate images and videos using the Trucheterie3DCLI.',
  Component: lazy(() => import('./Trucheterie3DWorkbenchPage')),
};
