import frameData1 from './frameData1';
import frameData2 from './frameData2';
import frameData3 from './frameData3';
import gptFrames from './gpt_data';
import sonnetFrames from './sonnet_data';

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

const FRAMES = [
  { name: '1', frame: normalizeFrameFit(frameData1) },
  { name: '2', frame: normalizeFrameFit(frameData2) },
  { name: '3', frame: normalizeFrameFit(frameData3) },
  ...gptFrames.map((frameEntry) => ({
    ...frameEntry,
    frame: normalizeFrameFit(frameEntry.frame),
  })),
  ...sonnetFrames.map((frameEntry) => ({
    ...frameEntry,
    frame: normalizeFrameFit(frameEntry.frame),
  })),
];

export function getFrames() {
  return FRAMES;
}

export function getFrameData(name) {
  return FRAMES.find((frameEntry) => frameEntry.name === name)?.frame;
}
