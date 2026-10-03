import { lazy } from 'react';

export default {
  slug: 'projection-mapper',
  label: 'Projection Mapper',
  description: 'Compose and corner-pin live Eye Candy scenes for projectors.',
  Component: lazy(() => import('./ProjectionMappingPage')),
};
