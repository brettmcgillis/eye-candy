import React, { lazy } from 'react';
import { FaHandPaper } from 'react-icons/fa';

function SceneIcon() {
  return <FaHandPaper color="#fbbf24" />;
}

export default {
  id: 'handStuff',
  label: 'Hand Stuff',
  channel: 'webgl',
  area: 'testlab',
  icon: SceneIcon,
  Component: lazy(() => import('./HandStuff')),
};
