import React, { lazy } from 'react';
import { MdDirectionsRun } from 'react-icons/md';

function SceneIcon() {
  return <MdDirectionsRun color="#10b981" />;
}

export default {
  id: 'characterController',
  label: 'Character Controller',
  channel: 'webgpu',
  area: 'toolbox',
  route: 'characterController-webgpu',
  icon: SceneIcon,
  Component: lazy(() => import('./CharacterController')),
};
