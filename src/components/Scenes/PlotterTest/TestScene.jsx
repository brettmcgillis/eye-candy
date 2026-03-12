import { folder, useControls } from 'leva';

import React from 'react';

import { CameraControls, PerspectiveCamera } from '@react-three/drei';

const SOURCE_THEME_COLORS = {
  light: {
    ambient: 2.0,
    gridCenter: '#cccccc',
    gridLines: '#dddddd',
  },
  dark: {
    ambient: 0.25,
    gridCenter: '#444444',
    gridLines: '#333333',
  },
};

export default function TestScene() {
  const config = useControls(
    'Plotter Source Scene',
    {
      Theme: folder(
        {
          sourceTheme: {
            label: 'Theme',
            value: 'dark',
            options: {
              Dark: 'dark',
              Light: 'light',
            },
          },
        },
        { collapsed: true }
      ),
      Lighting: folder(
        {
          lightIntensity: {
            label: 'Point Light Intensity',
            value: 1,
            min: 0,
            max: 8,
            step: 0.1,
          },
          lightX: { label: 'Light X', value: 5, min: -20, max: 20, step: 0.1 },
          lightY: { label: 'Light Y', value: 5, min: -20, max: 20, step: 0.1 },
          lightZ: { label: 'Light Z', value: 5, min: -20, max: 20, step: 0.1 },
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );

  const themeColors =
    SOURCE_THEME_COLORS[config.sourceTheme] || SOURCE_THEME_COLORS.dark;

  return (
    <>
      <PerspectiveCamera makeDefault fov={45} position={[8, 6, 10]} />
      <CameraControls />

      <ambientLight intensity={themeColors.ambient} />
      <pointLight
        castShadow
        intensity={config.lightIntensity}
        position={[config.lightX, config.lightY, config.lightZ]}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />

      <mesh castShadow position={[-3, 1.25, -3]}>
        <coneGeometry args={[1.5, 2.5, 4]} />
        <meshPhongMaterial color="#ff6644" flatShading shininess={0} />
      </mesh>

      <mesh castShadow position={[3, 1.25, -3]}>
        <cylinderGeometry args={[1, 1, 2.5, 12]} />
        <meshPhongMaterial color="#44ff66" flatShading shininess={0} />
      </mesh>

      <mesh castShadow position={[-3, 1.25, 3]}>
        <sphereGeometry args={[1.25, 18, 12]} />
        <meshPhongMaterial color="#ffcc44" flatShading shininess={0} />
      </mesh>

      <mesh castShadow position={[3, 1.5, 3]}>
        <icosahedronGeometry args={[1.5, 0]} />
        <meshPhongMaterial color="#4466ff" flatShading shininess={0} />
      </mesh>

      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.02, 0]}
      >
        <planeGeometry args={[20, 20, 1, 1]} />
        <meshPhongMaterial color="#b7b7b7" shininess={0} />
      </mesh>

      <gridHelper
        args={[20, 20, themeColors.gridCenter, themeColors.gridLines]}
      />
    </>
  );
}
