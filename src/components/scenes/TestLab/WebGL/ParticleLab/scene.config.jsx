import React, { lazy } from 'react';
import { GiAtomCore } from 'react-icons/gi';

function SceneIcon() {
  return <GiAtomCore color="#991b1b" />;
}

export default {
  id: 'particleLab',
  label: 'Particle Lab',
  channel: 'webgl',
  area: 'testlab',
  icon: SceneIcon,
  Component: lazy(() => import('./ParticleLab')),
};
