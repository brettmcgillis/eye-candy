import { lazy } from 'react';

export default {
  slug: 'trucheterie-designer',
  aliases: ['TrucheterieDesigner'],
  label: 'TrucheterieDesigner',
  description: 'Design Trucheterie fields',
  Component: lazy(() => import('./TrucheterieDesignerPage')),
};
