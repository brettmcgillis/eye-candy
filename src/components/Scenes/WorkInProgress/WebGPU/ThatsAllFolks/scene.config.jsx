import React, { lazy } from 'react';
import { GiPistolGun } from 'react-icons/gi';
import { WiSmoke } from 'react-icons/wi';

function SceneIcon() {
  return (
    <>
      <GiPistolGun color="#374151" />
      <WiSmoke color="#9ca3af" />
    </>
  );
}

export default {
  id: 'thatsAllFolks',
  label: "That's All Folks",
  channel: 'webgpu',
  area: 'wip',
  icon: SceneIcon,
  Component: lazy(() => import('./ThatsAllFolks')),
};
