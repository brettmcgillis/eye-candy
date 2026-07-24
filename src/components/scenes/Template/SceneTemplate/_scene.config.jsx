import React, { lazy } from 'react';
import { SiWebGpu, SiWebgl } from 'react-icons/si';

// Each scene registers itself with a config object that
// includes its id, label, channel, area, icon, and component.
// The scene registry uses these configs to build the scene list and routing.
// Remove the underscore prefix from the file name to automatically register a scene in the registry.

function SceneIcon() {
  return (
    <>
      <SiWebgl color="#000000" size={26} />
      <SiWebGpu color="#000000" size={26} />
    </>
  );
}

export default {
  id: 'sceneTemplae',
  label: 'Template Scene',
  channel: 'webgpu or webgl',
  area: 'wip or showcase or testlab or toolbox',
  icon: SceneIcon,
  Component: lazy(() => import('./SceneTemplate')),
};
