import { useMemo } from 'react';

import {
  RENDER_OPTIONS,
  SCENE_KEYS,
  buildPiece,
  sceneDefaults,
} from '@modules/subdivision';
import { useWebcamFrame } from '@modules/webcam';
import { PALETTE_NONE, getPaletteStops } from '@utils/gradientPalette';

import useSourceImage from './useSourceImage';

// Coarse on purpose: the variance driver compares a handful of samples per
// cell, and the tree is rebuilt on every frame taken.
const WEBCAM_FRAME_MAX = 480;

const PIECE_KEYS = SCENE_KEYS.filter(
  (key) =>
    !RENDER_OPTIONS[key].sceneOnly && RENDER_OPTIONS[key].section !== 'video'
);

// `canvas` is the panel in px. The webcam, when on, is the source image
// whatever the Field says. Outline keys have no control here, so the kernel
// reads their defaults.
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
    const settings = {
      ...sceneDefaults(),
      ...config,
      ...(config.webcam ? { field: 'image' } : {}),
    };
    const piece = buildPiece(settings, { canvas, image, stops });
    const maxDepth = piece.nodes.reduce(
      (deepest, node) => Math.max(deepest, node.depth),
      0
    );
    return { ...piece, maxDepth };
  }, [pieceKey, image, canvas, config.webcam]);
}
