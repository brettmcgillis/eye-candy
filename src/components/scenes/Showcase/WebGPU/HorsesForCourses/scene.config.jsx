import React, { lazy } from 'react';
import { GiHorseHead } from 'react-icons/gi';

function SceneIcon() {
  return <GiHorseHead color="#b87333" />;
}

export default {
  id: 'horsesForCourses',
  label: 'Horses For Courses',
  channel: 'webgpu',
  area: 'showcase',
  icon: SceneIcon,
  Component: lazy(() => import('./HorsesForCourses')),
};
