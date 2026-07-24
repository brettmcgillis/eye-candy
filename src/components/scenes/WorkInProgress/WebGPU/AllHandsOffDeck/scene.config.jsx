import React, { lazy } from 'react';

import { iconFile } from '../../../../../utils/appUtils';

function SceneIcon() {
  return (
    <img
      src={iconFile('skateboard.png')}
      alt="All Hands Off Deck"
      style={{
        width: 'auto',
        height: 'calc(var(--overlay-icon-size) * 1.5)',
        verticalAlign: 'middle',
        objectFit: 'contain',
      }}
    />
  );
}

export default {
  id: 'allHandsOffDeck',
  label: 'All Hands Off Deck',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./AllHandsOffDeck')),
};
