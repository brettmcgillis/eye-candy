import { button, folder } from 'leva';

import { facets } from '@modules/kumiko';

// Leva labels a button by its key, so the key is the label.
const FACET_LABELS = {
  layout: 'Roll Layout',
  mix: 'Roll Mix',
  palette: 'Roll Palette',
  patterns: 'Roll Patterns',
};

// The dice: rolling a facet re-rolls only that group of controls, the same
// facets KumikoCLI holds and rolls.
export default function getSceneControls({ onRegenerate, onRoll } = {}) {
  return folder(
    {
      Regenerate: button(() => onRegenerate?.()),
      ...Object.fromEntries(
        facets().map((facet) => [
          FACET_LABELS[facet] ?? `Roll ${facet}`,
          button(() => onRoll?.(facet)),
        ])
      ),
    },
    { collapsed: false }
  );
}
