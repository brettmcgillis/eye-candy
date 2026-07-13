import React, { memo, useRef } from 'react';

import Godrays from '../../../../postprocessing/webGPU/godrays/Godrays';
import CameraRig from '../../../../rigging/CameraRig';
import CenterLight from './components/CenterLight';
import FieldLines from './components/FieldLines';
import LeafSwarm from './components/LeafSwarm';
import PhysicalAttractorMarkers from './components/PhysicalAttractorMarkers';
import useSceneControls from './hooks/useSceneControls';

// Strange attractors mode: a Thomas Labyrinth vector field driving a
// GPU-compute swarm of cartoon leaves & sakura petals, plus CPU-stepped
// streamlines tracing the same field. Physical attractors mode: draggable
// gravity+spin attractor markers pulling the same swarm. A centerpiece
// point light drives screen-space godrays, occluded by the swarm's own
// shadow-casting geometry as it flows through the beam (see todo.md). The
// procedural tree and the mossy/vined ground are deliberate later passes.
function Windswept() {
  const config = useSceneControls();
  // Shared with LeafSwarm (reads it for physics) and PhysicalAttractorMarkers
  // (owns/drags it) — lifted here since both are siblings.
  const attractorsRef = useRef([]);
  // Godrays needs the actual THREE.PointLight instance, not just its props.
  const godraysLightRef = useRef(null);

  return (
    <>
      <CameraRig camera={config.camera} />
      <color attach="background" args={['#05070c']} />
      <ambientLight intensity={0.1} />
      {/* <directionalLight position={[6, 10, 4]} intensity={1.1} /> */}
      <CenterLight
        color={config.godraysColor}
        intensity={config.godraysIntensity}
        lightRef={godraysLightRef}
        volumeSize={config.godraysVolumeSize}
      />
      <FieldLines config={config} />
      <PhysicalAttractorMarkers attractorsRef={attractorsRef} config={config} />
      <LeafSwarm attractorsRef={attractorsRef} config={config} />
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

export default memo(Windswept);
