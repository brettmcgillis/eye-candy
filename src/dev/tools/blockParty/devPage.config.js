import { lazy } from 'react';

export default {
  slug: 'block-party',
  aliases: ['BlockPartyCLI'],
  label: 'BlockPartyCLI',
  description:
    'Generate Block Party cities in batches — stills, build/rebuild/turntable videos and plotter SVG — using the BlockPartyCLI.',
  order: 58,
  Component: lazy(() => import('./BlockPartyWorkbenchPage')),
};
