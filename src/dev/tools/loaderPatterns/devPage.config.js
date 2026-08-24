import { lazy } from 'react';

export default {
  slug: 'loaderpattern',
  label: 'loaderPatterns',
  description: 'Preview loader animations and pattern references.',
  order: 30,
  Component: lazy(() => import('./LoadersPage')),
};
