import React, { lazy } from 'react';

import { iconFile } from '../../../../../utils/appUtils';

function SceneIcon() {
  return (
    <img
      src={iconFile('aisle9-icon.png')}
      alt="Aisle 9"
      style={{
        width: 'auto',
        height: 'calc(var(--overlay-icon-size) * 1.4)',
        verticalAlign: 'middle',
        objectFit: 'contain',
      }}
    />
  );
}

export default {
  id: 'aisle9',
  label: 'Aisle 9',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./Aisle9')),
};
