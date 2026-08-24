import React, { lazy } from 'react';
import { GiSpiderWeb } from 'react-icons/gi';

function SceneIcon() {
  return <GiSpiderWeb color="#94a3b8" />;
}

export default {
  id: 'networkTest',
  label: 'Network Test',
  channel: 'webgpu',
  area: 'testlab',
  icon: SceneIcon,
  Component: lazy(() => import('./NetworkTest')),
};
