import React, { memo, useEffect, useMemo } from 'react';

import { Object3D } from 'three';

import cutoutGeometry from '../../utils/cutoutGeometry';
import Comparison from './Comparison';
import CutPaperLeaf from './CutPaperLeaf';

function CutoutSample({ config, assets, mode, time }) {
  const data = useMemo(() => {
    const construction = mode === 'original' ? 'card' : config.cutMode;
    const curl = mode === 'original' ? 0 : config.cutCurl;
    return {
      geometry: cutoutGeometry(
        assets.sprite,
        construction,
        config.cutThickness,
        curl
      ),
      silhouette: cutoutGeometry(assets.sprite, 'contour', 0, curl),
    };
  }, [assets, mode, config.cutMode, config.cutThickness, config.cutCurl]);
  useEffect(
    () => () => {
      data.geometry.dispose();
      data.silhouette.dispose();
    },
    [data]
  );
  return (
    <group>
      {Array.from({ length: config.cutLayers }, (_, index) => (
        <CutPaperLeaf
          key={`${data.geometry.uuid}-${index}`}
          index={index}
          geometry={data.geometry}
          silhouette={data.silhouette}
          config={config}
          assets={assets}
          time={time}
        />
      ))}
      <mesh
        position={[0, -2.4, -1.5]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={mode !== 'treatment'}
      >
        <planeGeometry args={[5.5, 7]} />
        <meshStandardMaterial color={config.paper} roughness={1} />
      </mesh>
    </group>
  );
}
const Sample = memo(CutoutSample);
function CutoutStudy({ config, ...props }) {
  const target = useMemo(() => {
    const object = new Object3D();
    object.position.set(0, -1, 0);
    return object;
  }, []);
  return (
    <>
      <primitive object={target} />
      <directionalLight position={[0, 5, 5]} target={target} intensity={1.2} />
      <Comparison
        config={config}
        sourceLabel="Transparent cards"
        treatmentLabel={config.cutMode}
      >
        {(mode, time) => (
          <Sample config={config} {...props} mode={mode} time={time} />
        )}
      </Comparison>
    </>
  );
}
export default memo(CutoutStudy);
