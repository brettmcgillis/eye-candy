import { button } from 'leva';

import {
  LEVA_KEYS,
  RENDER_OPTIONS,
  randomSeed,
  rollControlPanelConfig,
} from '@modules/controlPanel';
import createSchemaFolders from '@modules/schemaControls';

export const SCENE_LABEL = 'ControlPanel';

const FOLDERS = {
  layout: 'Layout',
  catalogue: 'Catalogue',
  look: 'Look',
  stage: 'Stage',
  motion: 'Motion',
  patch: 'Patch cables',
};

const schemaFolders = createSchemaFolders({
  folders: FOLDERS,
  keys: LEVA_KEYS,
  label: SCENE_LABEL,
  options: RENDER_OPTIONS,
  controls: { patchState: { render: () => false } },
});

// Rolls one facet with the rest held; a new layout rises in.
export function rollFacet(current, facet) {
  const rolled = rollControlPanelConfig(randomSeed(), {
    base: current,
    keep: ['layout', 'look', 'patch'].filter((name) => name !== facet),
  });
  return {
    ...Object.fromEntries(
      LEVA_KEYS.filter((key) => RENDER_OPTIONS[key].facet === facet).map(
        (key) => [key, rolled[key]]
      )
    ),
    ...(facet !== 'look' && { patchState: '' }),
    ...(facet === 'layout' && { panelDesign: '' }),
  };
}

export default function sceneFolders(
  saved,
  { onRelease, onRoll, onReplay, onSavePatch, onResetPatch, onDesign }
) {
  const extras = {
    buildIn: { after: { 'replay build': button(() => onReplay?.()) } },
    domain: { before: { 'roll look': button(() => onRoll?.('look')) } },
    motionMode: {
      after: { 'release controls': button(() => onRelease?.()) },
    },
    patchState: {
      after: {
        'save patch arrangement': button(() => onSavePatch?.()),
        'reset patch arrangement': button(() => onResetPatch?.()),
      },
    },
    patchSeed: { before: { 'roll cables': button(() => onRoll?.('patch')) } },
    panelDesign: import.meta.env.DEV
      ? {
          after: {
            'Design your own': button(() => {
              const code = onDesign?.();
              window.open(
                `/dev/control-panel-designer${code ? `?code=${encodeURIComponent(code)}` : ''}`,
                '_blank',
                'noopener,noreferrer'
              );
            }),
          },
        }
      : {},
    seed: { before: { 'roll layout': button(() => onRoll?.('layout')) } },
  };
  return schemaFolders(saved, extras);
}
