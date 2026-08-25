import { lazy } from 'react';

export default {
  slug: 'gltfjsx',
  label: 'GLTF -> JSX',
  description: 'Import and optimize models.',
  order: 40,
  Component: lazy(() => import('./GltfJsxPage')),
};
