import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useRef } from 'react';

import { useThree } from '@react-three/fiber';

import { radians } from '../../../../../../utils/math';

const AMBIENT_DEBUG_POSITION = [-1.35, 1.8, 1.45];

function TargetDebug({ color, position, visible }) {
  if (!visible) {
    return null;
  }

  return (
    <mesh position={position}>
      <sphereGeometry args={[0.08, 10, 10]} />
      <meshBasicMaterial color={color} toneMapped={false} wireframe />
    </mesh>
  );
}

function AmbientDebug({ color, visible }) {
  if (!visible) {
    return null;
  }

  return (
    <mesh position={AMBIENT_DEBUG_POSITION}>
      <octahedronGeometry args={[0.16, 0]} />
      <meshBasicMaterial color={color} toneMapped={false} wireframe />
    </mesh>
  );
}

function DirectionalLightRig({
  color,
  debug,
  intensity,
  layer = null,
  position,
  target,
}) {
  const { scene } = useThree();
  const lightRef = useRef(null);
  const targetRef = useRef(null);
  const helperRef = useRef(null);

  useEffect(() => {
    const light = lightRef.current;
    const targetObject = targetRef.current;

    if (!light || !targetObject) {
      return;
    }

    light.target = targetObject;

    if (Number.isInteger(layer)) {
      light.layers.set(layer);
    }

    targetObject.updateMatrixWorld();
    helperRef.current?.update();
  }, [color, intensity, layer, position, target]);

  useEffect(() => {
    const light = lightRef.current;

    if (!light) {
      return undefined;
    }

    if (!debug) {
      if (helperRef.current) {
        scene.remove(helperRef.current);
        helperRef.current.dispose();
        helperRef.current = null;
      }

      return undefined;
    }

    const helper = new THREE.DirectionalLightHelper(light, 0.7);
    helperRef.current = helper;
    scene.add(helper);
    helper.update();

    return () => {
      scene.remove(helper);
      helper.dispose();

      if (helperRef.current === helper) {
        helperRef.current = null;
      }
    };
  }, [debug, scene]);

  return (
    <>
      <directionalLight
        ref={lightRef}
        color={color}
        intensity={intensity}
        position={position}
      />
      <object3D ref={targetRef} position={target} />
      <TargetDebug color={color} position={target} visible={debug} />
    </>
  );
}

function SpotLightRig({
  angle,
  color,
  decay,
  debug,
  distance,
  intensity,
  penumbra,
  position,
  target,
}) {
  const { scene } = useThree();
  const lightRef = useRef(null);
  const targetRef = useRef(null);
  const helperRef = useRef(null);

  useEffect(() => {
    const light = lightRef.current;
    const targetObject = targetRef.current;

    if (!light || !targetObject) {
      return;
    }

    light.target = targetObject;
    targetObject.updateMatrixWorld();
    helperRef.current?.update();
  }, [angle, color, decay, distance, intensity, penumbra, position, target]);

  useEffect(() => {
    const light = lightRef.current;

    if (!light) {
      return undefined;
    }

    if (!debug) {
      if (helperRef.current) {
        scene.remove(helperRef.current);
        helperRef.current.dispose();
        helperRef.current = null;
      }

      return undefined;
    }

    const helper = new THREE.SpotLightHelper(light);
    helperRef.current = helper;
    scene.add(helper);
    helper.update();

    return () => {
      scene.remove(helper);
      helper.dispose();

      if (helperRef.current === helper) {
        helperRef.current = null;
      }
    };
  }, [debug, scene]);

  return (
    <>
      <spotLight
        ref={lightRef}
        angle={angle}
        color={color}
        decay={decay}
        distance={distance}
        intensity={intensity}
        penumbra={penumbra}
        position={position}
      />
      <object3D ref={targetRef} position={target} />
      <TargetDebug color={color} position={target} visible={debug} />
    </>
  );
}

const Lighting = memo(function Lighting({ controls, floorFillLightLayer }) {
  return (
    <>
      <ambientLight
        color={controls.ambientColor}
        intensity={controls.ambientIntensity}
      />

      <AmbientDebug
        color={controls.ambientColor}
        visible={controls.ambientDebug}
      />

      <DirectionalLightRig
        color={controls.keyColor}
        debug={controls.keyDebug}
        intensity={controls.keyIntensity}
        position={[
          controls.keyPosition.x,
          controls.keyPosition.y,
          controls.keyPosition.z,
        ]}
        target={[
          controls.keyTarget.x,
          controls.keyTarget.y,
          controls.keyTarget.z,
        ]}
      />

      <DirectionalLightRig
        color={controls.floorFillColor}
        debug={controls.floorFillDebug}
        intensity={controls.floorFillIntensity}
        layer={floorFillLightLayer}
        position={[
          controls.floorFillPosition.x,
          controls.floorFillPosition.y,
          controls.floorFillPosition.z,
        ]}
        target={[
          controls.floorFillTarget.x,
          controls.floorFillTarget.y,
          controls.floorFillTarget.z,
        ]}
      />

      {controls.rimEnabled && (
        <DirectionalLightRig
          color={controls.rimColor}
          debug={controls.rimDebug}
          intensity={controls.rimIntensity}
          position={[
            controls.rimPosition.x,
            controls.rimPosition.y,
            controls.rimPosition.z,
          ]}
          target={[
            controls.rimTarget.x,
            controls.rimTarget.y,
            controls.rimTarget.z,
          ]}
        />
      )}

      <SpotLightRig
        angle={radians(controls.spotAngle)}
        color={controls.spotColor}
        decay={controls.spotDecay}
        debug={controls.spotDebug}
        distance={controls.spotDistance}
        intensity={controls.spotIntensity}
        penumbra={controls.spotPenumbra}
        position={[
          controls.spotPosition.x,
          controls.spotPosition.y,
          controls.spotPosition.z,
        ]}
        target={[
          controls.spotTarget.x,
          controls.spotTarget.y,
          controls.spotTarget.z,
        ]}
      />
    </>
  );
});

export default Lighting;
