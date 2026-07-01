import React, { lazy } from 'react';
import { FcFullTrash } from 'react-icons/fc';

function SceneIcon() {
  return <FcFullTrash />;
}

export default {
  id: 'trashcollector',
  label: 'TrashCollector',
  channel: 'webgl',
  area: 'toolbox',
  icon: SceneIcon,
  Component: lazy(() => import('./TrashCollector')),
};
