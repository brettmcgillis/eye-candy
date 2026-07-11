import React, { memo, useCallback, useState } from 'react';

import Camera from './components/Camera';
import FloidsSwarm from './components/FloidsSwarm';
import RendererSettings from './components/RendererSettings';
import VolumetricAtmosphere from './components/VolumetricAtmosphere';
import VolumetricPost from './components/VolumetricPost';
import useSceneControls from './hooks/useSceneControls';

function Fireflies() {
  const config = useSceneControls();
  const [volumeMaterial, setVolumeMaterial] = useState(null);
  const handleMaterialChange = useCallback((material) => {
    setVolumeMaterial(material);
  }, []);

  return (
    <>
      <color attach="background" args={[config.backgroundColor]} />
      <RendererSettings exposure={config.toneMappingExposure} />
      <Camera />
      <mesh receiveShadow rotation-x={-Math.PI / 2} position-y={0}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial
          color="#030713"
          metalness={0.1}
          roughness={0.96}
        />
      </mesh>
      <FloidsSwarm config={config} />
      <VolumetricAtmosphere
        config={config}
        onMaterialChange={handleMaterialChange}
      />
      <VolumetricPost config={config} volumeMaterial={volumeMaterial} />
    </>
  );
}

export default memo(Fireflies);
