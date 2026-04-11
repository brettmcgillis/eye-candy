import { useMemo } from 'react';

/**
 * Memoises the MediaPipe and hand-control config objects that every fluid
 * scene passes to FluidHandsBridge.  Extracts the identical useMemo blocks
 * shared by FluidTest, WatercolorSquares, and Cardinals.
 */
export default function useFluidHandsConfig(config) {
  const mediaPipeConfig = useMemo(
    () => ({
      maxHands: config.handsMaxHands || 1,
      modelComplexity: config.handsModelComplexity || 1,
      minDetectionConfidence: config.handsMinDetectionConfidence || 0.6,
      minTrackingConfidence: config.handsMinTrackingConfidence || 0.6,
      showVideo: !!config.handsShowVideo,
      showDebugSkeleton: !!config.handsShowDebugSkeleton,
      landmarkStyle: {
        color: config.handsLandmarkColor || '#ff0000',
        radius: config.handsLandmarkRadius || 4,
      },
      connectorStyle: {
        color: config.handsConnectorColor || '#000000',
        lineWidth: config.handsConnectorLineWidth || 3,
      },
    }),
    [
      config.handsConnectorColor,
      config.handsConnectorLineWidth,
      config.handsLandmarkColor,
      config.handsLandmarkRadius,
      config.handsMaxHands,
      config.handsMinDetectionConfidence,
      config.handsMinTrackingConfidence,
      config.handsModelComplexity,
      config.handsShowDebugSkeleton,
      config.handsShowVideo,
    ]
  );

  const handControlConfig = useMemo(
    () => ({
      maxHands: config.handsMaxHands || 1,
      xScale: config.handsXScale || 4,
      yScale: config.handsYScale || 3,
      zScale: config.handsZScale || 5,
    }),
    [
      config.handsMaxHands,
      config.handsXScale,
      config.handsYScale,
      config.handsZScale,
    ]
  );

  return { mediaPipeConfig, handControlConfig };
}
