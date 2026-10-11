import { useMemo } from 'react';

import {
  RENDER_OPTIONS,
  SCENE_KEYS,
  buildReliefPiece,
} from '@modules/subdivisionRelief';
import { useWebcamFrame } from '@modules/webcam';
import { PALETTE_NONE, getPaletteStops } from '@utils/gradientPalette';

import useSourceImage from './useSourceImage';

// Coarse on purpose: the variance driver compares a handful of samples per
// cell, and the tree is rebuilt on every frame taken.
const WEBCAM_FRAME_MAX = 480;

// Heights, motion and the loop never rebuild the tree.
const PIECE_KEYS = SCENE_KEYS.filter(
  (key) =>
    !RENDER_OPTIONS[key].sceneOnly &&
    !['loop', 'motion', 'relief'].includes(RENDER_OPTIONS[key].section)
);

// `canvas` is the panel in px. The webcam, when on, is the source image
// whatever the Field says.
export default function usePiece(config, canvas) {
  const webcam = useWebcamFrame(config.webcam, {
    facing: config.webcamFacing,
    maxSize: WEBCAM_FRAME_MAX,
    rate: config.webcamRate,
  });
  const upload = config.field === 'image' ? config.sourceUpload : null;
  const file = useSourceImage(
    config.field === 'image' ? (upload ?? config.sourceImage) : ''
  );
  const image = config.webcam ? webcam : file;
  const pieceKey = PIECE_KEYS.map((key) => config[key]).join('|');

  return useMemo(() => {
    const stops =
      config.palette === PALETTE_NONE ? null : getPaletteStops(config.palette);
    const settings = config.webcam ? { ...config, field: 'image' } : config;
    return buildReliefPiece(settings, { canvas, image, stops });
  }, [pieceKey, image, canvas, config.webcam]);
}
