import React, { lazy } from 'react';
import { FaPaw } from 'react-icons/fa';

function SceneIcon() {
  return <FaPaw color="#a78bfa" />;
}

export default {
  id: 'quinnsPlayground',
  label: "Quinn's Playground",
  channel: 'webgl',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./QuinnsPlayground')),
};
