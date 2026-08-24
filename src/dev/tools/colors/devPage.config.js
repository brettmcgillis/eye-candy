import { lazy } from 'react';

export default {
  slug: 'colors',
  aliases: ['color'],
  label: 'Colors & Gradients',
  description: 'Browse and edit shared palette entries.',
  order: 10,
  Component: lazy(() => import('./GradientsPage')),
};
