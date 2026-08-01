import React, { memo, useCallback, useRef } from 'react';

import { Environment } from '@react-three/drei';

import { CameraRig } from '../../../../../modules/cameraRig';
import Godrays from '../../../../postprocessing/webGPU/godrays/Godrays';
import ButtonOverlay from './components/ButtonOverlay';
import CenterLight from './components/CenterLight';
import LightRig from './components/LightRig';
import VoxelField from './components/VoxelField';
import useSceneControls from './hooks/useSceneControls';

// Hierarchical cube/face/edge subdivision CA (voxel automata terrain lineage,
// ported to TSL compute — see utils/growthCompute.js) that grows into its
// shape over real time rather than resolving instantly, straddling "tiny
// cellular organism" and "futuristic megalithic structure." Phase 1 ships one
// preset: growth around a Windswept-style shadow-casting centerpiece light,
// godrays occluded by the structure as it reveals around it. See todo.md for
// the three presets deferred to Phase 2.
function FractalAutomata() {
  const config = useSceneControls();
  const godraysLightRef = useRef(null);

  const handleReplayGrowth = useCallback(() => {
    config.bumpReplayGrowth();
  }, [config]);

  return (
    <>
      <CameraRig camera={config.camera} />
      <color attach="background" args={[config.backgroundColor]} />
      <Environment
        preset="studio"
        background={false}
        environmentIntensity={config.envIntensity}
      />
      <LightRig config={config} />
      <CenterLight
        color={config.godraysColor}
        intensity={config.godraysIntensity}
        lightRef={godraysLightRef}
        position={[
          config.godraysPosition.x,
          config.godraysPosition.y,
          config.godraysPosition.z,
        ]}
        volumeSize={config.godraysVolumeSize}
      />
      <VoxelField
        config={config}
        replayGrowthToken={config.replayGrowthToken}
      />
      <ButtonOverlay
        onRegenerate={config.regenerate}
        onReplayGrowth={handleReplayGrowth}
        onTogglePause={config.togglePauseAnimation}
        paused={!config.growthEnabled}
      />
      {config.godraysEnabled && (
        <Godrays
          lightRef={godraysLightRef}
          blendColor={config.godraysBlendColor}
          density={config.godraysDensity}
          maxDensity={config.godraysMaxDensity}
          distanceAttenuation={config.godraysDistanceAttenuation}
          raymarchSteps={config.godraysRaymarchSteps}
          blur={config.godraysBlur}
          edgeRadius={config.godraysEdgeRadius}
          edgeStrength={config.godraysEdgeStrength}
        />
      )}
    </>
  );
}

export default memo(FractalAutomata);
