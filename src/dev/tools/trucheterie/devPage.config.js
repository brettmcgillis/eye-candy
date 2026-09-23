import { lazy } from 'react';

export default {
  slug: 'trucheterie',
  aliases: ['TrucheterieCLI'],
  label: 'TrucheterieCLI',
  description:
    'Generate Trucheterie blob-field stills using the TrucheterieCLI.',
  order: 60,
  Component: lazy(() => import('./TrucheterieWorkbenchPage')),
};
