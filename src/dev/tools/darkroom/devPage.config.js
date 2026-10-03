import { lazy } from 'react';

export default {
  slug: 'darkroom',
  label: 'Darkroom',
  group: 'general',
  description: 'Videos and stills in various techniques',
  Component: lazy(() => import('./DarkroomPage')),
};
