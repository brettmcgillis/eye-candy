import React, { memo, useCallback, useRef, useState } from 'react';

import * as THREE from 'three/webgpu';

import Bonsai from '@elements/Bonsai/Bonsai';
import SubtleForestSkybox from '@elements/SubtleForestSkybox/SubtleForestSkybox';
import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';
import Godrays from '@postprocessing/WebGPU/godrays/Godrays';

import FieldLines from './components/FieldLines';
import LeafSwarm from './components/LeafSwarm';
import LightMarker from './components/LightMarker';
import PhysicalAttractorMarkers from './components/PhysicalAttractorMarkers';
import useSceneControls from './hooks/useSceneControls';

// Strange attractors mode: a Thomas Labyrinth vector field driving a
// GPU-compute swarm of cartoon leaves & sakura petals, plus CPU-stepped
// streamlines tracing the same field. Physical attractors mode: draggable
// gravity+spin attractor markers pulling the same swarm. A centerpiece
// point light drives screen-space godrays, occluded by the swarm's own
// shadow-casting geometry as it flows through the beam (see todo.md). A
// bonsai centerpiece anchors the swarm (pot/stalk/bud/flower hidden by
// default so it reads as a bare craggly tree); the flowing-vine ground is a
// deliberate later pass.
function Windswept() {
  const config = useSceneControls();
  // Shared with LeafSwarm (reads it for physics) and PhysicalAttractorMarkers
  // (owns/drags it) — lifted here since both are siblings.
  const attractorsRef = useRef([]);
  // Godrays raymarches this light's shadow map, so it needs the live
  // THREE.PointLight. Held in state, not a ref: toggling the slot unmounts and
  // remounts the light, and Godrays has to rebuild its pipeline when that
  // instance changes.
  const [godrayLight, setGodrayLight] = useState(null);

  const handleLightChange = useCallback((slotId, light) => {
    if (slotId === 'godray') {
      setGodrayLight(light);
    }
  }, []);

  return (
    <>
      <CameraRig camera={config.camera} />
      <color attach="background" args={['#05070c']} />
      <LightingRig
        lighting={config.lighting}
        onLightChange={handleLightChange}
      />
      <SubtleForestSkybox
        visible={config.skyboxVisible}
        rotation={[0, THREE.MathUtils.degToRad(config.skyboxRotationY), 0]}
        scale={config.skyboxScale}
      />
      <Bonsai
        visible={config.bonsaiVisible}
        position={[
          config.bonsaiPosition.x,
          config.bonsaiPosition.y,
          config.bonsaiPosition.z,
        ]}
        rotation={[0, THREE.MathUtils.degToRad(config.bonsaiRotationY), 0]}
        scale={config.bonsaiScale}
        showBud={config.bonsaiShowBud}
        showFlower={config.bonsaiShowFlower}
        showPot={config.bonsaiShowPot}
        showStalk={config.bonsaiShowStalk}
      />
      {config.lightGodrayEnabled && (
        <LightMarker
          color={config.lightGodrayColor}
          position={[
            config.lightGodrayPosition.x,
            config.lightGodrayPosition.y,
            config.lightGodrayPosition.z,
          ]}
          size={config.godraysLightSphereSize}
        />
      )}
      <group
        rotation={[
          THREE.MathUtils.degToRad(config.swarmRotation.x),
          THREE.MathUtils.degToRad(config.swarmRotation.y),
          THREE.MathUtils.degToRad(config.swarmRotation.z),
        ]}
      >
        <FieldLines attractorsRef={attractorsRef} config={config} />
        <PhysicalAttractorMarkers
          attractorsRef={attractorsRef}
          config={config}
        />
        <LeafSwarm attractorsRef={attractorsRef} config={config} />
      </group>
      {config.godraysEnabled && (
        <Godrays
          light={godrayLight}
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
