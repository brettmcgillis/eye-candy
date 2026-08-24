import React, { lazy } from 'react';
import { TbVectorSpline } from 'react-icons/tb';

function SceneIcon() {
  return <TbVectorSpline color="#a855f7" />;
}

export default {
  id: 'splineEditor',
  label: 'Spline Editor',
  channel: 'webgl',
  area: 'toolbox',
  icon: SceneIcon,
  Component: lazy(() => import('./SplineEditor')),
};
