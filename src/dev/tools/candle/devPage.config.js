import { lazy } from 'react';

export default {
  slug: 'candle',
  aliases: ['CandleCLI', 'candles', 'burning-at-both-ends'],
  label: 'CandleCLI',
  group: 'render-workbenches',
  description:
    'Generate candles burning at both ends: stills, videos and plots using the CandleCLI.',
  Component: lazy(() => import('./CandleWorkbenchPage')),
};
