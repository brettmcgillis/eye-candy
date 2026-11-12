import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import materialMasks from '../../utils/materialMasks';
import createMeshGeometry from '../../utils/meshGeometry';
import Comparison from './Comparison';

function MaskSample({ config, assets, mode, time }) {
  const mesh = useRef();
  const geometry = useMemo(
    () => createMeshGeometry(config.studyShape),
    [config.studyShape]
  );
  const maps = useMemo(
    () => materialMasks(assets, config),
    [
      assets,
      config.maskSource,
      config.maskInvert,
      config.maskChannel,
      config.maskStrength,
      config.paper,
      config.pigment,
    ]
  );
  const texture = maps?.mask;
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => maps?.dispose(), [maps]);
  useFrame(() => {
    mesh.current.rotation.y = time.current;
  });
  const channel = mode === 'original' ? 'color' : config.maskChannel;
  let colorMap = assets.mainTexture;
  if (mode === 'treatment') colorMap = texture;
  else if (mode !== 'original' && channel === 'color') colorMap = maps?.color;
  return (
    <mesh ref={mesh} geometry={geometry}>
      <meshPhysicalMaterial
        key={channel}
        map={colorMap}
        roughness={channel === 'roughness' ? 1 : 0.65}
        roughnessMap={channel === 'roughness' ? texture : null}
        bumpMap={channel === 'bump' ? texture : null}
        bumpScale={config.maskStrength}
        displacementMap={channel === 'displacement' ? texture : null}
        displacementScale={channel === 'displacement' ? config.maskStrength : 0}
        clearcoat={channel === 'glaze' ? config.maskStrength / 0.6 : 0}
        clearcoatMap={channel === 'glaze' ? texture : null}
        clearcoatRoughness={0.08}
        metalness={0}
      />
    </mesh>
  );
}
const Sample = memo(MaskSample);
function MaskStudy({ config, ...props }) {
  return (
    <Comparison
      config={config}
      sourceLabel="Color only"
      treatmentLabel={`${config.maskSource} → ${config.maskChannel}`}
    >
      {(mode, time) => (
        <Sample config={config} {...props} mode={mode} time={time} />
      )}
    </Comparison>
  );
}
export default memo(MaskStudy);
