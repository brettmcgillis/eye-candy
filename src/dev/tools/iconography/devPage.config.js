import { lazy } from 'react';

export default {
  slug: 'iconography',
  label: 'Iconography',
  description: 'Reference UI and scene icons.',
  order: 20,
  Component: lazy(() => import('./IconsPage')),
};
