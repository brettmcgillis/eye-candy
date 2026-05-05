import { useMemo } from 'react';

import getColorsInRange from '../../../../../../utils/colors';
import { getFrameData } from '../data/FrameData';

export default function useFrameLayers(frame, colorRangeStart, colorRangeEnd) {
  const frameData = getFrameData(frame);
  const { settings, layers } = frameData;

  const frameLayers = useMemo(() => {
    const colorGamut = getColorsInRange(
      colorRangeStart,
      colorRangeEnd,
      layers.length
    );
    return layers.map((layer, index) =>
      layer.map((square) => ({ ...square, color: colorGamut[index] }))
    );
  }, [layers, colorRangeStart, colorRangeEnd]);

  return { frameLayers, settings };
}
