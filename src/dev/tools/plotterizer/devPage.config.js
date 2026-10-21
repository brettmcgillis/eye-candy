import { lazy } from 'react';

export default {
  slug: 'plotterizer',
  aliases: ['Plotterizer'],
  label: 'Plotterizer',
  description:
    'Prep a plot for the cutter: pens per layer, real size and nib, fewer pen lifts, DXF per pen.',
  Component: lazy(() => import('./PlotterizerPage')),
};
