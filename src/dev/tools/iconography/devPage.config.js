import { lazy } from 'react';

export default {
  slug: 'iconography',
  label: 'Iconography',
  description: 'Reference UI and scene icons.',
  Component: lazy(() => import('./IconsPage')),
};
