import { lazy } from 'react';

export default {
  slug: 'gltfjsx',
  label: 'GLTF -> JSX',
  description: 'Import, optimize, and export models.',
  order: 40,
  Component: lazy(() => import('./GltfJsxPage')),
};
