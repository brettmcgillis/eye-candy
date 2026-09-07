import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

const DEG = Math.PI / 180;

// Carried, not worn. The lamp sits slightly off the eye and its aim lags the
// look, so the beam swings into a turn a moment late and the lit patch never
// sits perfectly centred in frame — which is most of what separates a torch in
// someone's hand from a headlight bolted to the camera.
function Flashlight({ config, flashlight }) {
  const camera = useThree((state) => state.camera);
  const lightRef = useRef(null);
  const targetRef = useRef(null);
  const { beam, cookie } = flashlight;

  const scratch = useMemo(() => ({ dir: new THREE.Vector3() }), []);

  useEffect(() => {
    const light = lightRef.current;
    if (light && targetRef.current) light.target = targetRef.current;
  }, []);

  useFrame((_, rawDelta) => {
    const light = lightRef.current;
    const target = targetRef.current;
    if (!light || !target) return;
    const dt = Math.min(rawDelta, 1 / 20);
    const { dir } = scratch;

    camera.getWorldDirection(dir);
    beam.origin.copy(camera.position).addScaledVector(dir, config.beamForward);
    beam.origin.y += config.beamDrop;
    light.position.copy(beam.origin);

    const desired = dir.multiplyScalar(config.beamRange).add(camera.position);
    if (!beam.ready) {
      beam.aim.copy(desired);
      beam.ready = true;
    }
    // Exponential, so the lag is frame-rate independent; a plain lerp factor
    // would tighten up as the frame rate rose.
    beam.aim.lerp(desired, 1 - Math.exp(-config.beamLag * dt));
    target.position.copy(beam.aim);

    // Object3D.lookAt orients -Z at the target, which is the spotlight's own
    // convention, so this frame is the cone's frame exactly.
    beam.frame.position.copy(beam.origin);
    beam.frame.lookAt(beam.aim);
    beam.frame.updateMatrix();
    beam.matrix.copy(beam.frame.matrix).invert();
  });

  return (
    <>
      <object3D ref={targetRef} />
      <spotLight
        angle={config.beamAngle * DEG}
        castShadow={config.beamShadows}
        color={config.beamColor}
        decay={config.beamDecay}
        distance={config.beamRange}
        intensity={config.beamIntensity}
        map={cookie}
        penumbra={config.beamPenumbra}
        ref={lightRef}
        shadow-bias={-0.0015}
        shadow-camera-far={config.beamRange}
        shadow-camera-near={0.4}
        shadow-mapSize-height={config.beamShadowSize}
        shadow-mapSize-width={config.beamShadowSize}
      />
    </>
  );
}

export default memo(Flashlight);
