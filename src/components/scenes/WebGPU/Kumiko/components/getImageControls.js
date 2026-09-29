import { folder } from 'leva';

import { IMAGE_FITS, IMAGE_MODES } from '@modules/kumiko';

import { choice, presetReader, range, shownWhen } from './controlHelpers';

const driven = (control) =>
  shownWhen(control, ['Image.imageMode'], (mode) => mode !== 'off');

// An image or the webcam drives the panel: `subdivide` splits cells where
// the picture is busy, `halftone` also picks patterns by how open they are.
export default function getImageControls(preset = {}) {
  const p = presetReader(preset);

  return folder(
    {
      imageMode: choice('Image Mode', p('imageMode'), IMAGE_MODES),
      webcam: driven({ label: 'Webcam', value: p('webcam') }),
      sourceImage: shownWhen(
        { label: 'Source Image', value: p('sourceImage') },
        ['Image.imageMode', 'Image.webcam'],
        (mode, webcam) => mode !== 'off' && !webcam
      ),
      webcamRate: shownWhen(
        range('Webcam FPS', p('webcamRate'), 1, 30, 1),
        ['Image.imageMode', 'Image.webcam'],
        (mode, webcam) => mode !== 'off' && webcam
      ),
      imageDetail: driven(range('Detail', p('imageDetail'), 0, 1, 0.01)),
      imageContrast: driven(
        range('Contrast', p('imageContrast'), 0.2, 4, 0.05)
      ),
      halftoneDither: shownWhen(
        range('Halftone Dither', p('halftoneDither'), 0, 1, 0.01),
        ['Image.imageMode'],
        (mode) => mode === 'halftone'
      ),
      imageFit: driven(choice('Fit', p('imageFit'), IMAGE_FITS)),
      imageInvert: driven({ label: 'Invert', value: p('imageInvert') }),
      cellEase: range('Cell Ease (s)', p('cellEase'), 0, 3, 0.05),
    },
    { collapsed: true }
  );
}
