import { lazy } from 'react';

export default {
  slug: 'iso-meter',
  aliases: ['IsoMeterCLI'],
  label: 'IsoMeterCLI',
  group: 'render-workbenches',
  description: 'Generate Isoverse pieces in bulk with the IsoMeterCLI.',
  Component: lazy(() => import('./IsoMeterWorkbenchPage')),
};
