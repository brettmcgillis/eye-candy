import { lazy } from 'react';

export default {
  slug: 'inventory',
  label: 'Inventory',
  description:
    'Size, counts, types and age of render workbench output, plus disk free.',
  Component: lazy(() => import('./InventoryPage')),
};
