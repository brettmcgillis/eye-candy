import { lazy } from 'react';

export default {
  slug: 'kumiko',
  aliases: ['KumikoCLI'],
  label: 'KumikoCLI',
  description:
    'Generate Kumiko lattice panels — flat art, plotter SVG and 3D renders — using the KumikoCLI.',
  order: 57,
  Component: lazy(() => import('./KumikoWorkbenchPage')),
};
