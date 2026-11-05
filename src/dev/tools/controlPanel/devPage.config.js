import { lazy } from 'react';

export default {
  slug: 'control-panel',
  aliases: ['ControlPanelCLI'],
  label: 'ControlPanelCLI',
  group: 'render-workbenches',
  description: 'Generate images, videos and plots using the ControlPanelCLI.',
  Component: lazy(() => import('./ControlPanelWorkbenchPage')),
};
