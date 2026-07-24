import React, { lazy } from 'react';
import { GiPistolGun } from 'react-icons/gi';
import { WiSmoke } from 'react-icons/wi';

function SceneIcon() {
  return (
    <>
      <GiPistolGun
        color="#000000"
        size={24}
        style={{ transform: 'translate(0, 0.25em)' }}
      />
      <WiSmoke
        color="#000000"
        size={24}
        style={{ transform: 'translate(-0.25em, -0.25em)' }}
      />
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
