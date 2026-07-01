import { button, useControls } from 'leva';

import isMobileDevice from '../utils/platform';

// Leva folder mirroring the old App.Screenshot folder: an editable filename field
// plus screenshot / toggle-recording buttons.
export default function useMediaRecorderControls({
  fileName,
  onFileNameChange,
  onScreenshot,
  onToggleRecording,
}) {
  useControls(
    'App.Media',
    {
      name: {
        label: 'filename',
        value: fileName,
        onChange: onFileNameChange,
      },
      png: button(() => onScreenshot()),
      'Toggle Recording': button(() => onToggleRecording()),
    },
    { collapsed: true, render: () => !isMobileDevice() }
  );
}
