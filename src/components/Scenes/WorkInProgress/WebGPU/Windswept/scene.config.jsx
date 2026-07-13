import React, { lazy } from 'react';
import { GiFallingLeaf } from 'react-icons/gi';

function SceneIcon() {
  return (
    <GiFallingLeaf
      color="#e8c15a"
      size={26}
      style={{
        backgroundColor: '#05070c',
        borderRadius: '50%',
      }}
    />
  );
}

export default {
  id: 'windswept',
  label: 'Windswept',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./Windswept')),
};
