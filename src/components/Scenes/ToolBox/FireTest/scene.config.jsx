import React, { lazy } from 'react';

import { iconFile } from '../../../../utils/appUtils';

function SceneIcon() {
  return (
    <img
      src={iconFile('fire-icon.svg')}
      alt="Fire Test"
      style={{
        width: 'var(--overlay-icon-size)',
        height: 'var(--overlay-icon-size)',
        verticalAlign: 'middle',
      }}
    />
  );
}

export default [
  {
    id: 'fireTest',
    label: 'Fire Test',
    channel: 'webgl',
    area: 'toolbox',
    icon: SceneIcon,
    Component: lazy(() => import('./FireTest')),
  },
  {
    id: 'fireTest',
    label: 'Fire Test',
    channel: 'webgpu',
    area: 'toolbox',
    route: 'fireTest-webgpu',
    icon: SceneIcon,
    Component: lazy(() => import('./FireTest')),
  },
];
