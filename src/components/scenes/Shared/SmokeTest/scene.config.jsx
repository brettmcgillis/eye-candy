import React, { lazy } from 'react';
import { GiSmokeBomb } from 'react-icons/gi';

function SceneIcon() {
  return <GiSmokeBomb color="#373839" />;
}

export default [
  {
    id: 'smokeTest',
    label: 'Smoke Test',
    channel: 'webgl',
    area: 'toolbox',
    icon: SceneIcon,
    Component: lazy(() => import('./SmokeTest')),
  },
  {
    id: 'smokeTest',
    label: 'Smoke Test',
    channel: 'webgpu',
    area: 'toolbox',
    route: 'smokeTest-webgpu',
    icon: SceneIcon,
    Component: lazy(() => import('./SmokeTest')),
  },
];
