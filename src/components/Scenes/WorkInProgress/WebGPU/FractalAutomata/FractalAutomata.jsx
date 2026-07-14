import React, { memo, useCallback, useRef } from 'react';

import AngularFlowField from '../../../../elements/AngularFlowField/AngularFlowField';
import Godrays from '../../../../postprocessing/webGPU/godrays/Godrays';
import CameraRig from '../../../../rigging/CameraRig';
import ButtonOverlay from './components/ButtonOverlay';
import CenterLight from './components/CenterLight';
import VoxelField from './components/VoxelField';
import useSceneControls from './hooks/useSceneControls';

// Hierarchical cube/face/edge subdivision CA (voxel automata terrain lineage,
// ported to TSL compute — see utils/growthCompute.js) that grows into its
// shape over real time rather than resolving instantly, straddling "tiny
// cellular organism" and "futuristic megalithic structure." Phase 1 ships one
// preset: growth around a Windswept-style shadow-casting centerpiece light,
// godrays occluded by the structure as it reveals around it. See todo.md for
// the three presets and the AngularFlowField cloud-preset wiring deferred to
// Phase 2.
function FractalAutomata() {
  const config = useSceneControls();
  const godraysLightRef = useRef(null);

  const handleReplayGrowth = useCallback(() => {
    config.bumpReplayGrowth();
  }, [config]);

  return (
    <>
      <CameraRig camera={config.camera} />
      <color attach="background" args={['#03040a']} />
      <ambientLight intensity={0.08} />
      <CenterLight
        color={config.godraysColor}
        intensity={config.godraysIntensity}
        lightRef={godraysLightRef}
        volumeSize={config.godraysVolumeSize}
      />
      <VoxelField
        config={config}
        replayGrowthToken={config.replayGrowthToken}
      />
      {/* Dev-verification mount for AngularFlowField (Phase 1 built it as a
          standalone element; Phase 2 wires it into the Cloud + Flow Field
          preset for real). Remove once verified. */}
      <AngularFlowField position={[0, 6, -10]} />
      <ButtonOverlay
        onRegenerate={config.regenerate}
        onReplayGrowth={handleReplayGrowth}
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
