import { button, folder } from 'leva';

import getTheatreSheet from '../utils/theatreSheet';

export default function getTheatreControls(preset) {
  return folder(
    {
      theatreEnabled: {
        label: 'Drive Scene',
        value: preset.theatreEnabled,
      },
      theatreStudioVisible: {
        label: 'Studio UI',
        value: preset.theatreStudioVisible,
      },
      theatreHideUi: {
        label: 'Hide App UI',
        value: preset.theatreHideUi,
      },
      theatrePlaying: { label: 'Play', value: preset.theatrePlaying },
      theatreLoop: { label: 'Loop', value: preset.theatreLoop },
      theatreRate: {
        label: 'Rate',
        min: 0.1,
        max: 3,
        step: 0.05,
        value: preset.theatreRate,
      },
      theatreTime: {
        label: 'Scrub',
        min: 0,
        max: 60,
        step: 0.01,
        value: preset.theatreTime,
      },
      'Restart Sequence': button(() => {
        getTheatreSheet().sheet.sequence.position = 0;
      }),
    },
    { collapsed: true }
  );
}
