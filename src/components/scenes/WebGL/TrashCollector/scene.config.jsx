import React, { lazy } from 'react';
import { BsTrash3Fill } from 'react-icons/bs';

function SceneIcon() {
  return <BsTrash3Fill size={26} />;
}

export default {
  id: 'trashcollector',
  label: 'TrashCollector',
  channel: 'webgl',
  area: 'toolbox',
  icon: SceneIcon,
  Component: lazy(() => import('./TrashCollector')),
};
