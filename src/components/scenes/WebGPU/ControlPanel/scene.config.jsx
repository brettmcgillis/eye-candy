import React, { lazy } from 'react';
import { GiSettingsKnobs } from 'react-icons/gi';

function SceneIcon() {
  return (
    <>
      <GiSettingsKnobs color="#000000" size={24} />
      <GiSettingsKnobs color="#000000" size={24} />
    </>
  );
}

export default {
  id: 'controlPanel',
  label: 'ControlPanel',
  channel: 'webgpu',
  area: 'showcase',
  icon: SceneIcon,
  Component: lazy(() => import('./ControlPanel')),
};
