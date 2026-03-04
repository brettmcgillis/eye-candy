import { useControls } from 'leva';

import React from 'react';

import { Stats } from '@react-three/drei';

export default function StatsPanel() {
  const { showStats } = useControls(
    'Stats',
    {
      showStats: {
        label: 'Show Stats',
        value: true,
      },
    },
    { collapsed: true }
  );

  return showStats ? <Stats /> : null;
}
