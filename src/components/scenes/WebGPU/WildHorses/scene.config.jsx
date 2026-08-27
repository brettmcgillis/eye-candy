import React, { lazy } from 'react';

import { iconFile } from '@utils/appUtils';

function SceneIcon() {
  return (
    <img
      src={iconFile('horse-gallop.png')}
      alt="Wild Horses"
      style={{
        width: 'var(--overlay-icon-size)',
        height: 'var(--overlay-icon-size)',
        verticalAlign: 'middle',
      }}
    />
  );
}

export default {
  id: 'wildHorses',
  label: 'Wild Horses',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./WildHorses')),
};
