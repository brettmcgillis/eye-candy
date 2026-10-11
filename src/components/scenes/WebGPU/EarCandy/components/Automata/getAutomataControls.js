import { button, folder } from 'leva';

import { VOICE_NAMES } from '../../utils/audio/voices';
import { RULES } from '../../utils/automata';

export const DEFAULTS = {
  lifeAutoReseed: true,
  lifeCols: 16,
  lifeDeathNotes: true,
  lifeDensity: 0.22,
  lifeHue: 0.6,
  lifeMaxNotes: 5,
  lifeOctaves: 2,
  lifeRows: 12,
  lifeRule: RULES.Life,
  lifeStepsPerBeat: 2,
  lifeVoice: 'marimba',
  lifeVoiceB: 'pad',
  lifeWrap: true,
};

export default function getAutomataControls(
  p,
  { onClear, onRandomize },
  render
) {
  return folder(
    {
      automataHint: {
        editable: false,
        label: 'Paint',
        value: 'drag to draw / shift or start on a cell to erase',
      },
      lifeRule: { label: 'Rule', options: RULES, value: p.lifeRule },
      lifeStepsPerBeat: {
        label: 'Generations / Beat',
        options: [1, 2, 4],
        value: p.lifeStepsPerBeat,
      },
      lifeCols: {
        label: 'Columns (pitch)',
        max: 36,
        min: 6,
        step: 1,
        value: p.lifeCols,
      },
      lifeRows: {
        label: 'Rows',
        max: 28,
        min: 4,
        step: 1,
        value: p.lifeRows,
      },
      lifeOctaves: {
        label: 'Octave Bands',
        max: 3,
        min: 1,
        step: 1,
        value: p.lifeOctaves,
      },
      lifeMaxNotes: {
        label: 'Max Births Voiced',
        max: 16,
        min: 1,
        step: 1,
        value: p.lifeMaxNotes,
      },
      lifeDeathNotes: { label: 'Voice Deaths', value: p.lifeDeathNotes },
      lifeAutoReseed: { label: 'Reseed When Stuck', value: p.lifeAutoReseed },
      lifeWrap: { label: 'Wrap Edges', value: p.lifeWrap },
      lifeDensity: {
        label: 'Seed Density',
        max: 0.6,
        min: 0.04,
        step: 0.01,
        value: p.lifeDensity,
      },
      lifeVoice: {
        label: 'Birth Voice',
        options: VOICE_NAMES,
        value: p.lifeVoice,
      },
      lifeVoiceB: {
        label: 'Death Voice',
        options: VOICE_NAMES,
        value: p.lifeVoiceB,
      },
      lifeHue: {
        label: 'Hue',
        max: 1,
        min: 0,
        step: 0.01,
        value: p.lifeHue,
      },
      randomize: button(() => onRandomize()),
      clearCells: button(() => onClear()),
    },
    { collapsed: true, render }
  );
}
