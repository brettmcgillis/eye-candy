import { lazy } from 'react';

export default {
  slug: 'cataloggr',
  label: 'Cataloggr',
  description: 'Track scene maturity, local presets, and publishing progress.',
  order: 5,
  Component: lazy(() => import('./CataloggrPage')),
};
