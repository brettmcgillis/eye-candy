import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

import * as THREE from 'three';
import { Sky as ThreeSky } from 'three/addons/objects/Sky.js';

import HeightFog from './HeightFog';

function getSunDirection({ azimuth, elevation }) {
  const phi = THREE.MathUtils.degToRad(90 - elevation);
  const theta = THREE.MathUtils.degToRad(azimuth);

  return new THREE.Vector3().setFromSphericalCoords(1, phi, theta);
}

export default function SceneEnvironment({ fog, scene: sceneConfig, sky }) {
  const cameraRef = useRef();
  const skyObject = useMemo(() => {
    const object = new ThreeSky();
    object.scale.setScalar(450000);
    return object;
  }, []);
  const { gl, scene } = useThree();
  const sunDirection = useMemo(() => getSunDirection(sky), [sky]);

  useLayoutEffect(() => {
    if (!cameraRef.current) {
      return;
    }

    cameraRef.current.position.set(...sceneConfig.cameraPosition);
    cameraRef.current.fov = sceneConfig.cameraFov;
    cameraRef.current.far = sceneConfig.cameraFar;
    cameraRef.current.updateProjectionMatrix();
    cameraRef.current.lookAt(...sceneConfig.cameraTarget);
  }, [sceneConfig]);

  useEffect(() => {
    const previousToneMapping = gl.toneMapping;
    const previousExposure = gl.toneMappingExposure;

    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = sceneConfig.exposure;

    return () => {
      gl.toneMapping = previousToneMapping;
      gl.toneMappingExposure = previousExposure;
    };
  }, [gl, sceneConfig.exposure]);

  useEffect(() => {
    const { uniforms } = skyObject.material;

    uniforms.sunPosition.value.copy(sunDirection);
    uniforms.turbidity.value = sky.turbidity;
    uniforms.rayleigh.value = sky.rayleigh;
    uniforms.mieCoefficient.value = sky.mieCoefficient;
    uniforms.mieDirectionalG.value = sky.mieDirectionalG;
  }, [sky, skyObject, sunDirection]);

  useEffect(() => {
    const previousEnvironment = scene.environment;
    const pmremGenerator = new THREE.PMREMGenerator(gl);
    const environmentScene = new THREE.Scene();
    const environmentSky = skyObject.clone();

    environmentSky.material = skyObject.material.clone();
    environmentSky.material.uniforms = THREE.UniformsUtils.clone(
      skyObject.material.uniforms
    );
    environmentSky.material.uniforms.sunPosition.value.copy(sunDirection);
    environmentSky.scale.copy(skyObject.scale);
    environmentScene.add(environmentSky);

    const renderTarget = pmremGenerator.fromScene(environmentScene);
    scene.environment = renderTarget.texture;

    return () => {
      if (scene.environment === renderTarget.texture) {
        scene.environment = previousEnvironment ?? null;
      }

      renderTarget.dispose();
      pmremGenerator.dispose();
    };
  }, [gl, scene, skyObject, sunDirection]);

  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        far={sceneConfig.cameraFar}
        fov={sceneConfig.cameraFov}
        near={0.1}
        position={sceneConfig.cameraPosition}
      />
      <OrbitControls
        makeDefault
        target={sceneConfig.cameraTarget}
        enableDamping
      />
      <ambientLight
        color={sceneConfig.ambientColor}
        intensity={sceneConfig.ambientIntensity}
      />
      <hemisphereLight
        color={sceneConfig.hemisphereSkyColor}
        groundColor={sceneConfig.hemisphereGroundColor}
        intensity={sceneConfig.hemisphereIntensity}
      />
      <directionalLight
        castShadow
        color={sceneConfig.sunColor}
        intensity={sceneConfig.sunIntensity}
        position={[
          sunDirection.x * sceneConfig.sunDistance,
          sunDirection.y * sceneConfig.sunDistance,
          sunDirection.z * sceneConfig.sunDistance,
        ]}
        shadow-bias={-0.0002}
        shadow-camera-bottom={-14}
        shadow-camera-far={120}
        shadow-camera-left={-14}
        shadow-camera-near={0.5}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-mapSize-height={2048}
        shadow-mapSize-width={2048}
      />
      <primitive object={skyObject} />
      <HeightFog fog={fog} />
    </>
  );
}
