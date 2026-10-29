import { button } from 'leva';

import {
  LEVA_KEYS,
  RENDER_OPTIONS,
  designFromFrame,
  encodeDesign,
  generate,
  keysInFacet,
  randomSeed,
  rollConfig,
} from '@modules/paperCuts';
import createSchemaFolders from '@modules/schemaControls';
import { PALETTE_NAMES } from '@utils/paletteRegistry';

import { getFrameData } from '../data/FrameData';

const folders = createSchemaFolders({
  label: 'Paper Cuts',
  controls: { paletteName: { options: ['None', ...PALETTE_NAMES] } },
  options: RENDER_OPTIONS,
  keys: LEVA_KEYS,
  folders: {
    data: 'Data',
    generation: 'Generation',
    paper: 'Paper',
    color: 'Colors',
    art: 'Art',
    frame: 'Frame',
    light: 'Studio',
    motion: 'Animation',
  },
});
export default function sceneFolders(saved, apply, current) {
  return folders(saved, {
    paletteName: {
      before: {
        'Roll palette': button(() => {
          const rolled = rollConfig(randomSeed(), {
            base: current(),
            keep: ['structure', 'relief'],
          });
          apply(
            Object.fromEntries(
              keysInFacet('color').map((key) => [key, rolled[key]])
            )
          );
        }),
      },
    },
    paperDesign: {
      before: import.meta.env.DEV
        ? {
            'Design your own': button(() => {
              const value = current();
              const code =
                value.frame === 'generated' && value.paperDesign
                  ? value.paperDesign
                  : encodeDesign(
                      designFromFrame(
                        value.frame === 'generated'
                          ? generate(value)
                          : getFrameData(value.frame),
                        { rotate: value.rotate }
                      )
                    );
              window.open(
                `/dev/paper-cuts-designer?code=${encodeURIComponent(code)}`,
                '_blank',
                'noopener'
              );
            }),
          }
        : {},
    },
    generationSeed: {
      before: {
        'Roll composition': button(() => {
          const rolled = rollConfig(randomSeed(), {
            base: current(),
            keep: ['color', 'relief'],
          });
          apply({
            ...Object.fromEntries(
              keysInFacet('structure').map((key) => [key, rolled[key]])
            ),
            frame: 'generated',
            paperDesign: '',
          });
        }),
      },
    },
  });
}
