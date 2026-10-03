import { lazy } from 'react';

export default {
  slug: 'gltfjsx',
  label: 'GLTF -> JSX',
  description: 'Import and optimize models.',
  Component: lazy(() => import('./GltfJsxPage')),
};
