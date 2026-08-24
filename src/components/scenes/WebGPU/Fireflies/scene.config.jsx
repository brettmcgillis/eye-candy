import React, { lazy } from 'react';
import { GiFlyingBeetle } from 'react-icons/gi';

function SceneIcon() {
  return (
    <GiFlyingBeetle
      color="#b8f58c"
      size={26}
      style={{
        backgroundColor: '#02050d',
        borderRadius: '50%',
      }}
    />
  );
}

export default {
  id: 'fireflies',
  label: 'Fireflies',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./Fireflies')),
};
