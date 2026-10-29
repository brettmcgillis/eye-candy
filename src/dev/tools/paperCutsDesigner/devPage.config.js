import { lazy } from 'react';

export default {
  slug: 'paper-cuts-designer',
  aliases: ['PaperCutsDesigner'],
  label: 'PaperCutsDesigner',
  description:
    'Place, move and layer paper squares, then render saved designs in PaperCutsCLI.',
  Component: lazy(() => import('./PaperCutsDesignerPage')),
};
