import React, { lazy } from 'react';

import { iconFile } from '@utils/appUtils';

function SceneIcon() {
  return (
    <img
      alt="Rorschach"
      src={iconFile('rorschach.webp')}
      style={{
        width: 'auto',
        height: 'calc(var(--overlay-icon-size) * 1.6)',
        objectFit: 'contain',
        verticalAlign: 'middle',
      }}
    />
  );
}

export default {
  id: 'rorschach',
  label: 'Rorschach',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./Rorschach')),
};
