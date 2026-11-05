import { lazy } from 'react';

export default {
  slug: 'control-panel-designer',
  aliases: ['ControlPanelDesigner'],
  label: 'ControlPanelDesigner',
  description:
    'Place modules, knobs, switches and displays by hand; preview and save panels for ControlPanel.',
  Component: lazy(() => import('./ControlPanelDesignerPage')),
};
