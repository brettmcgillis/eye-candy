import { lazy } from 'react';

export default {
  slug: 'print-shop',
  aliases: ['PrintShop', 'printshop'],
  label: 'PrintShop',
  description:
    'Turn scene pieces into 3D-printable STL, 3MF and GLB files, with printability checks.',
  Component: lazy(() => import('./PrintShopPage')),
};
