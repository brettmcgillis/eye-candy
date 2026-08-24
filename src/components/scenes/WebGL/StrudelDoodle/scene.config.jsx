import React, { lazy } from 'react';
import { FaMusic } from 'react-icons/fa';

function SceneIcon() {
  return <FaMusic color="#e879f9" />;
}

export default {
  id: 'strudelDoodle',
  label: 'StrudelDoodle',
  channel: 'webgl',
  area: 'testlab',
  icon: SceneIcon,
  Component: lazy(() => import('./StrudelDoodle')),
};
