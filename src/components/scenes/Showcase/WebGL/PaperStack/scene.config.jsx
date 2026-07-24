import React, { lazy } from 'react';
import { GiPapers } from 'react-icons/gi';

function SceneIcon() {
  return <GiPapers color="#111827" />;
}

export default {
  id: 'paperStack',
  label: 'Paper Stack',
  channel: 'webgl',
  area: 'showcase',
  icon: SceneIcon,
  Component: lazy(() => import('./PaperStack')),
};
