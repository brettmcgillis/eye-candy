import * as THREE from 'three/webgpu';

import React, { useEffect, useRef } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

import { radians } from '../../../../../utils/math';
import GroundPlane from './components/GroundPlane';
import SceneFemur from './components/SceneFemur';
import SceneSkull from './components/SceneSkull';
import StainedGlassProjector from './components/StainedGlassProjector';
import useResponsiveCamera from './hooks/useResponsiveCamera';
import useSceneControls from './hooks/useSceneControls';

const SKULL_SCALE = 0.1;
const FEMUR_SCALE = 0.75;
const BACKGROUND_COLOR = '#120d0b';
const AMBIENT_DEBUG_POSITION = [-1.35, 1.8, 1.45];
const FLOOR_FILL_LIGHT_LAYER = 7;

function LightTargetDebug({ color, position, visible }) {
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

function AmbientDebugMarker({ color, visible }) {
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

function KeyLight({ color, debug, intensity, layer = null, position, target }) {
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
      <LightTargetDebug color={color} position={target} visible={debug} />
    </>
  );
}

function SceneSpotLight({
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
      <LightTargetDebug color={color} position={target} visible={debug} />
    </>
  );
}

export default function BeautysInTheEyeOfTheBeheaded() {
  const { controls } = useSceneControls();
  const { cameraFov, cameraPosition, cameraTarget } = useResponsiveCamera({
    desktopFov: controls.desktopCameraFov,
    desktopPosition: controls.desktopCameraPosition,
    desktopTarget: controls.desktopCameraTarget,
    mobileFov: controls.mobileCameraFov,
    mobilePosition: controls.mobileCameraPosition,
    mobileTarget: controls.mobileCameraTarget,
  });

  return (
    <>
      <color attach="background" args={[BACKGROUND_COLOR]} />
      <fog attach="fog" args={[BACKGROUND_COLOR, 4, 14]} />

      <PerspectiveCamera
        makeDefault
        fov={cameraFov}
        position={cameraPosition}
        onUpdate={(camera) => {
          camera.layers.enable(FLOOR_FILL_LIGHT_LAYER);
          camera.lookAt(...cameraTarget);
        }}
      />
      <OrbitControls
        makeDefault
        enableDamping
        enableZoom
        enablePan
        maxDistance={10}
        minDistance={2.5}
        target={cameraTarget}
      />

      <ambientLight
        color={controls.ambientColor}
        intensity={controls.ambientIntensity}
      />

      <AmbientDebugMarker
        color={controls.ambientColor}
        visible={controls.ambientDebug}
      />

      <KeyLight
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

      <KeyLight
        color={controls.floorFillColor}
        debug={controls.floorFillDebug}
        intensity={controls.floorFillIntensity}
        layer={FLOOR_FILL_LIGHT_LAYER}
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

      <SceneSpotLight
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

      <StainedGlassProjector
        angle={controls.projectorAngle}
        castShadow={controls.projectorCastShadow}
        color={controls.projectorColor}
        debug={controls.projectorDebug}
        decay={controls.projectorDecay}
        distance={controls.projectorDistance}
        focus={controls.projectorFocus}
        intensity={controls.projectorIntensity}
        penumbra={controls.projectorPenumbra}
        position={controls.projectorPosition}
        repeat={controls.projectorRepeat}
        target={controls.projectorTarget}
      />

      <GroundPlane extraLightLayer={FLOOR_FILL_LIGHT_LAYER} />

      <SceneFemur
        position={controls.leftFemurPosition}
        rotation={controls.leftFemurRotation}
        scale={FEMUR_SCALE}
      />
      <SceneFemur
        position={controls.rightFemurPosition}
        rotation={controls.rightFemurRotation}
        scale={FEMUR_SCALE}
      />
      <SceneSkull
        position={controls.skullPosition}
        rotation={controls.skullRotation}
        scale={SKULL_SCALE}
      />
    </>
  );
}
