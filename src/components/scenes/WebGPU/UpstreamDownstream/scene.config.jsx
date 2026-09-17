import React, { lazy } from 'react';
import { GiSplashyStream } from 'react-icons/gi';

function SceneIcon() {
  return <GiSplashyStream color="#1d4c3f" size={24} />;
}

export default {
  id: 'upstreamDownstream',
  label: 'Upstream/Downstream',
  channel: 'webgpu',
  area: 'showcase',
  icon: SceneIcon,
  Component: lazy(() => import('./UpstreamDownstream')),
};
