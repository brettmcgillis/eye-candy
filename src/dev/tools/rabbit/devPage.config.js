import { lazy } from 'react';

export default {
  slug: 'rabbit',
  aliases: ['RabbitCLI', 'stay-hunted', 'stayhunted'],
  label: 'RabbitCLI',
  group: 'render-workbenches',
  description:
    'Generate the hunted rabbit, his arrows and the graze grass: stills, videos and plots using the RabbitCLI.',
  Component: lazy(() => import('./RabbitWorkbenchPage')),
};
