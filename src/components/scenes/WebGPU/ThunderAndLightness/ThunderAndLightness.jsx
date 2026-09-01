import React, { memo, useCallback, useState } from 'react';

import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';
import Bloom from '@postprocessing/WebGPU/bloom/Bloom';
import Godrays from '@postprocessing/WebGPU/godrays/Godrays';

import GrainField from './components/GrainField';
import Studio from './components/Studio';
import useSceneControls from './hooks/useSceneControls';

// Godrays and Bloom each own a full RenderPipeline, so mounting both renders
// the scene twice and throws one away — Godrays does its own bloom instead.
//
// One pool of sand grains is the whole scene: some rest as the bed, some
// accrete grain-by-grain into a stepped leader, and the ones the shock ring
// passes get thrown. Roles are state in a single storage buffer drawn by a
// single material, so bolt, bed and ejecta cannot drift apart in look or speed.
function ThunderAndLightness() {
  const config = useSceneControls();
  const [spotLight, setSpotLight] = useState(null);

  const handleLightChange = useCallback((slotId, light) => {
    if (slotId === 'spot') {
      setSpotLight(light);
    }
  }, []);

  return (
    <>
      <CameraRig camera={config.camera} />
      <color attach="background" args={[config.backgroundColor]} />
      <fog
        attach="fog"
        args={[config.backgroundColor, config.fogNear, config.fogFar]}
      />
      <LightingRig
        lighting={config.lighting}
        onLightChange={handleLightChange}
      />
      <Studio config={config} />
      <GrainField config={config} />
      {config.godraysEnabled ? (
        <Godrays
          light={spotLight}
          blendColor={config.lightSpotColor}
          density={config.godraysDensity}
          maxDensity={config.godraysMaxDensity}
          distanceAttenuation={1.2}
          raymarchSteps={48}
          edgeRadius={3}
          edgeStrength={1.4}
          blur
          bloomStrength={config.bloomEnabled ? config.bloomStrength : 0}
          bloomThreshold={config.bloomThreshold}
          bloomRadius={config.bloomRadius}
        />
      ) : (
        config.bloomEnabled && (
          <Bloom
            radius={config.bloomRadius}
            strength={config.bloomStrength}
            threshold={config.bloomThreshold}
          />
        )
      )}
    </>
  );
}

export default memo(ThunderAndLightness);
