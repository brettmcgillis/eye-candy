import { folder, useControls } from 'leva';

import React from 'react';

import { localEnv } from '../../../utils/appUtils';
import LevaStatsGlBridge from './LevaStatsGlBridge';
import LevaStatsTicker from './LevaStatsTicker';
import { levaStatsGlPlugin } from './levaStatsGlPlugin';
import { levaStatsPlugin } from './levaStatsPlugin';

function hasStatsQuery() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.has('Stats') || params.has('stats');
}

export default function AppStats() {
  const showStats = localEnv() || hasStatsQuery();

  useControls(
    'Stats',
    {
      statsJs: folder(
        {
          statsJsPanel: levaStatsPlugin({ panels: [0, 1, 2] }),
        },
        { collapsed: true }
      ),
      statsGl: folder(
        {
          statsGlPanel: levaStatsGlPlugin({
            showPanel: 0,
            trackGPU: true,
            logsPerSecond: 8,
            samplesLog: 60,
            samplesGraph: 30,
            precision: 1,
          }),
        },
        { collapsed: true }
      ),
    },
    { collapsed: true, render: () => showStats }
  );

  return (
    <>
      <LevaStatsGlBridge />
      <LevaStatsTicker />
    </>
  );
}
