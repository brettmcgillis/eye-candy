import { AUTHORED_FRAMES } from '@modules/paperCuts';

const FRAME_SAFE_HALF_EXTENT = 3.5;

function getFrameHalfExtent(layers) {
  return layers.reduce((frameMax, layer) => {
    return Math.max(
      frameMax,
      ...layer.map(({ size, position: [x, y] }) => {
        const halfSize = size / 2;
        return Math.max(Math.abs(x) + halfSize, Math.abs(y) + halfSize);
      })
    );
  }, 0);
}

function normalizeFrameFit(frame) {
  const frameHalfExtent = getFrameHalfExtent(frame.layers);
  const computedMultiplier =
    frameHalfExtent > FRAME_SAFE_HALF_EXTENT
      ? FRAME_SAFE_HALF_EXTENT / frameHalfExtent
      : 1;

  return {
    ...frame,
    settings: {
      ...frame.settings,
      dataScaleMultiplier:
        frame.settings.dataScaleMultiplier ?? computedMultiplier,
    },
  };
}

const FRAMES = AUTHORED_FRAMES.map(({ name, frame }) => ({
  name,
  frame: normalizeFrameFit(frame),
}));

export function getFrames() {
  return FRAMES;
}

export function getFrameData(name) {
  return FRAMES.find((frameEntry) => frameEntry.name === name)?.frame;
}
