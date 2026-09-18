import { button, folder } from 'leva';

import { facets } from '@modules/fungi';

import { presetReader } from './controlHelpers';

// Leva labels a button by its key, so the key is the label.
const FACET_LABELS = {
  cluster: 'Roll Cluster',
  form: 'Roll Form',
  palette: 'Roll Palette',
};

// The scene's own chrome, and the dice. Rolling a facet re-rolls only that
// group of controls — the same facets FungiCLI holds and rolls.
export default function getSceneControls(preset = {}, { onRoll } = {}) {
  const p = presetReader(preset);

  return folder(
    {
      showOverlay: { label: 'Show Overlay', value: p('showOverlay') },
      Roll: folder(
        Object.fromEntries(
          facets().map((facet) => [
            FACET_LABELS[facet] ?? `Roll ${facet}`,
            button(() => onRoll?.(facet)),
          ])
        ),
        { collapsed: false }
      ),
    },
    { collapsed: true }
  );
}
