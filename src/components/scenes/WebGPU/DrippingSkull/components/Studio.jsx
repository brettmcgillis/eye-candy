import React, { memo, useEffect, useMemo } from 'react';

import { useThree } from '@react-three/fiber';

import {
  AgXToneMapping,
  Color,
  DoubleSide,
  LatheGeometry,
  PCFShadowMap,
  Vector2,
} from 'three/webgpu';

import { createReflections } from '../utils/melt';

function Studio({ config, floorY }) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const dark = config.meltSet === 'Dark';
  const lacquer =
    config.metalness < 0.5 && new Color(config.liquidColor).getHSL({}).l < 0.01;
  const environment = useMemo(
    () => createReflections(gl, dark, lacquer),
    [gl, dark, lacquer]
  );
  const geometry = useMemo(() => {
    const points = [new Vector2(0, floorY), new Vector2(7, floorY)];
    for (let i = 1; i <= 32; i += 1) {
      const a = ((i / 32) * Math.PI) / 2;
      points.push(
        new Vector2(7 + 4 * Math.sin(a), floorY + 4 * (1 - Math.cos(a)))
      );
    }
    points.push(new Vector2(11, 40));
    return new LatheGeometry(points, 96);
  }, [floorY]);
  useEffect(() => {
    const previous = scene.environment;
    scene.environment = environment.texture;
    return () => {
      if (scene.environment === environment.texture)
        scene.environment = previous;
      environment.dispose();
    };
  }, [environment, scene]);
  useEffect(() => {
    const previous = gl.toneMapping;
    const shadowType = gl.shadowMap.type;
    gl.shadowMap.type = PCFShadowMap;
    const exposure = gl.toneMappingExposure;
    gl.toneMapping = AgXToneMapping;
    return () => {
      gl.shadowMap.type = shadowType;
      gl.toneMapping = previous;
      gl.toneMappingExposure = exposure;
    };
  }, [gl]);
  useEffect(() => {
    gl.toneMappingExposure = config.meltExposure;
  }, [gl, config.meltExposure]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <>
      <color attach="background" args={[config.bgColor]} />
      <hemisphereLight
        intensity={config.ambientIntensity}
        color="#faf4ec"
        groundColor="#4d4944"
      />
      <directionalLight
        position={[-4, 7.2, 4.4]}
        intensity={config.keyIntensity}
        color={config.keyColor}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-3.5}
        shadow-camera-right={3.5}
        shadow-camera-top={3.5}
        shadow-camera-bottom={-3.5}
        shadow-normalBias={0.015}
        shadow-radius={18}
        shadow-bias={-0.0002}
      />
      <directionalLight
        position={[4, 2.4, -8]}
        intensity={config.rimIntensity}
        color={config.rimColor}
      />
      <mesh geometry={geometry} receiveShadow dispose={null}>
        <meshStandardMaterial
          color={new Color(config.bgColor).multiplyScalar(0.3)}
          roughness={0.95}
          side={DoubleSide}
        />
      </mesh>
    </>
  );
}
export default memo(Studio);
