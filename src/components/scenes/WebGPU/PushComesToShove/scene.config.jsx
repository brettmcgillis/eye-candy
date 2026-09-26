import React, { lazy } from 'react';
import { GiKnot } from 'react-icons/gi';

function SceneIcon() {
  return <GiKnot color="#a8a29e" size={24} />;
}

export default {
  id: 'pushComesToShove',
  label: 'Push Comes to Shove',
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./PushComesToShove')),
};
