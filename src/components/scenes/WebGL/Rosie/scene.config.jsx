import React, { lazy } from 'react';
import { FaHeart } from 'react-icons/fa';

import { iconFile } from '@utils/appUtils';

function SceneIcon() {
  return (
    <>
      <FaHeart color="#f43f5e" />
      <img
        src={iconFile('rose.png')}
        alt="Rosie"
        style={{
          width: 'var(--overlay-icon-size)',
          height: 'var(--overlay-icon-size)',
          verticalAlign: 'middle',
        }}
      />
    </>
  );
}

export default {
  id: 'rosie',
  label: 'Rosie',
  channel: 'webgl',
  area: 'showcase',
  icon: SceneIcon,
  Component: lazy(() => import('./Rosie')),
};
