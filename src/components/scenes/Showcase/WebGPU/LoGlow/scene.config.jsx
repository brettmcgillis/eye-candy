import React, { lazy } from 'react';

import { iconFile } from '../../../../../utils/appUtils';

function SceneIcon() {
  return (
    <img
      src={iconFile('bret-inner.png')}
      alt="LoGlow"
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
  id: 'loGlow',
  label: 'LoGlow',
  channel: 'webgpu',
  area: 'showcase',
  icon: SceneIcon,
  Component: lazy(() => import('./LoGlow')),
};
