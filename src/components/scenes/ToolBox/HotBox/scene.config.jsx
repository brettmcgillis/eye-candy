import React, { lazy } from 'react';
import { GiSmokeBomb } from 'react-icons/gi';

import { iconFile } from '../../../../utils/appUtils';

function SceneIcon() {
  return (
    <>
      <img
        src={iconFile('fire-icon.svg')}
        alt="Hot Box"
        style={{
          width: 'var(--overlay-icon-size)',
          height: 'var(--overlay-icon-size)',
          verticalAlign: 'middle',
        }}
      />
      <GiSmokeBomb color="#373839" />
    </>
  );
}

export default [
  {
    id: 'hotBox',
    label: 'Hot Box',
    channel: 'webgl',
    area: 'toolbox',
    icon: SceneIcon,
    Component: lazy(() => import('./HotBox')),
  },
  {
    id: 'hotBox',
    label: 'Hot Box',
    channel: 'webgpu',
    area: 'toolbox',
    route: 'hotBox-webgpu',
    icon: SceneIcon,
    Component: lazy(() => import('./HotBox')),
  },
];
