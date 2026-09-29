import { useMemo } from 'react';

import { RENDER_OPTIONS, SCENE_KEYS, buildPiece } from '@modules/subdivision';
import { PALETTE_NONE, getPaletteStops } from '@utils/gradientPalette';

import useSourceImage from './useSourceImage';
import useWebcamImage from './useWebcamImage';

const PIECE_KEYS = SCENE_KEYS.filter(
  (key) =>
    !RENDER_OPTIONS[key].sceneOnly && RENDER_OPTIONS[key].section !== 'video'
);

// `canvas` is the viewport in CSS px: the scene lays the piece out on the
// screen the way fractalPixelate does, cellSize in screen pixels. The webcam,
// when on, is the source image whatever the Field says.
export default function usePiece(config, canvas) {
  const webcam = useWebcamImage(config.webcam, config.webcamRate);
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
