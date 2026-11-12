import React, { Suspense, lazy, memo, useMemo } from 'react';

import { useThree } from '@react-three/fiber';

import { DoubleSide } from 'three';

import NurbsWaterColumn from '@elements/Water/NurbsWaterColumn';

import { boxPaths } from '../utils/subjects';
import BrushRibbons from './BrushRibbons';

const WaterColorEffect = lazy(
  () => import('@postprocessing/WebGL/waterColorEffect/WaterColorEffect')
);

function WaterStudy({ assets, config }) {
  const isWebGPU = useThree((state) => state.gl.isWebGPURenderer === true);
  const paths = useMemo(
    () => boxPaths(3, config.waterHeight, 3),
    [config.waterHeight]
  );
  return (
    <>
      {config.waterSource === 'shared water' ? (
        <NurbsWaterColumn
          width={3}
          depth={3}
          height={config.waterHeight}
          segments={16}
          topColor={config.waterTopColor}
          bottomColor={config.waterBottomColor}
          opacity={config.waterOpacity}
          transmission={0}
          roughness={0.35}
          waveHeight={config.waveHeight}
          waveSpeed={config.waveSpeed}
          showEdges={false}
        />
      ) : (
        <mesh>
          <boxGeometry args={[3, config.waterHeight, 3]} />
          <meshBasicMaterial
            map={assets.mainTexture}
            transparent
            opacity={config.waterOpacity}
            side={DoubleSide}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}
      {config.brushEdges && (
        <BrushRibbons paths={paths} assets={assets} config={config} />
      )}
      <mesh position={[0, 0.2, 0]} rotation={[0, 0, 0.3]}>
        <torusGeometry args={[0.65, 0.2, 16, 48]} />
        <meshStandardMaterial map={assets.mainTexture} roughness={0.8} />
      </mesh>
      {config.postEnabled && !isWebGPU && (
        <Suspense fallback={null}>
          <WaterColorEffect
            radius={config.postRadius}
            qualityScale={config.postQuality}
            paperStrength={config.postPaper}
            outlineStrength={config.postOutline}
            hatchingEnabled={false}
            bloomEnabled={false}
          />
        </Suspense>
      )}
    </>
  );
}

export default memo(WaterStudy);
