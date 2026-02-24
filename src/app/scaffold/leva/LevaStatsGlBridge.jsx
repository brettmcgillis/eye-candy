import React from 'react';

import { StatsGl } from '@react-three/drei';

import { useLevaStatsGlState } from './levaStatsGlPlugin';

export default function LevaStatsGlBridge() {
  const { enabled, parent, showPanel, options } = useLevaStatsGlState();

  if (!enabled || !parent?.current) return null;

  return (
    <StatsGl
      parent={parent}
      showPanel={showPanel}
      clearStatsGlStyle
      className="leva-statsgl-panel"
      {...options}
    />
  );
}
