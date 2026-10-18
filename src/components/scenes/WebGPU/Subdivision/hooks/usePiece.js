import { useMemo } from 'react';

import { SCENE_NAMES, SCENE_OPTIONS, buildPiece } from '@modules/subdivision';
import { useWebcamFrame } from '@modules/webcam';
import { PALETTE_NONE, getPaletteStops } from '@utils/gradientPalette';

import useSourceImage from './useSourceImage';

// Coarse on purpose: the variance driver compares a handful of samples per
// cell, and the tree is rebuilt on every frame taken.
const WEBCAM_FRAME_MAX = 480;

const PIECE_KEYS = SCENE_NAMES.filter(
  (key) =>
    !SCENE_OPTIONS[key].sceneOnly && SCENE_OPTIONS[key].section !== 'video'
);

// `canvas` is the viewport in CSS px: the scene lays the piece out on the
// screen the way fractalPixelate does, cellSize in screen pixels. The webcam,
// when on, is the source image whatever the Field says.
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
    const piece = buildPiece(settings, { canvas, image, stops });
    const maxDepth = piece.nodes.reduce(
      (deepest, node) => Math.max(deepest, node.depth),
      0
    );
    return { ...piece, maxDepth };
  }, [pieceKey, image, canvas, config.webcam]);
}
