import { lazy } from 'react';

export default {
  slug: 'darkroom',
  label: 'Darkroom',
  group: 'general',
  description:
    'Stills, clips, the webcam or a phone camera through Subdivision, Kumiko, Relief and the screen-space effects — preview live, export stills and video.',
  Component: lazy(() => import('./DarkroomPage')),
};
