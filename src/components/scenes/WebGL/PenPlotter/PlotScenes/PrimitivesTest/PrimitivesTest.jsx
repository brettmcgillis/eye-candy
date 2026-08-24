import React, { useEffect, useMemo } from 'react';

import { CameraControls, PerspectiveCamera } from '@react-three/drei';

import { folder, useControls } from 'leva';
import * as THREE from 'three';
import {
  klein,
  mobius,
  mobius3d,
  plane,
} from 'three/addons/geometries/ParametricFunctions.js';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';

import MiniNeuralNet from './MiniNetwork';
import MiniParticleCloud from './MiniParticleCloud';

const FIXED_SCENE_COLORS = {
  background: '#1c1c1c',
  ambient: 0.25,
  gridCenter: '#444444',
  gridLines: '#333333',
};

export default function PrimitivesTest() {
  const config = useControls(
    'Primitives Test Scene',
    {
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
      Visibility: folder(
        {
          showCube: { label: 'Cube', value: true },
          showCone: { label: 'Cone', value: true },
          showCylinder: { label: 'Cylinder', value: true },
          showSphere: { label: 'Sphere', value: true },
          showIcosahedron: { label: 'Icosahedron', value: true },
          showOctahedron: { label: 'Octahedron', value: true },
          showTetrahedron: { label: 'Tetrahedron', value: true },
          showTorusKnot: { label: 'Torus Knot', value: true },
          showPlanePrimitive: { label: 'Plane Primitive', value: true },
          showCircle: { label: 'Circle', value: true },
          showRing: { label: 'Ring', value: true },
          showLathe: { label: 'Lathe', value: true },
          showTorus: { label: 'Torus', value: true },
          showCapsule: { label: 'Capsule', value: true },
          showParametricPlane: { label: 'Parametric Plane', value: true },
          showKlein: { label: 'Klein', value: true },
          showMobius: { label: 'Mobius', value: true },
          showMobius3d: { label: 'Mobius 3D', value: true },
          showMiniNeuralNet: { label: 'Mini Neural Net', value: true },
          showMiniParticleCloud: { label: 'Mini Particle Cloud', value: true },
          showGroundPlane: { label: 'Ground Plane', value: true },
          showGrid: { label: 'Grid', value: true },
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );

  const lightPosition = [config.lightX, config.lightY, config.lightZ];

  const lathePoints = useMemo(() => {
    const points = [];
    for (let i = 0; i < 50; i += 1) {
      points.push(
        new THREE.Vector2(
          Math.sin(i * 0.2) * Math.sin(i * 0.1) * 0.45 + 1.1,
          (i - 25) * 0.05
        )
      );
    }
    return points;
  }, []);

  const parametricGeometries = useMemo(() => {
    const parametricPlane = new ParametricGeometry(plane, 10, 10);
    parametricPlane.scale(1.8, 1.8, 1.8);
    parametricPlane.center();

    const kleinGeometry = new ParametricGeometry(klein, 20, 20);
    kleinGeometry.scale(0.18, 0.18, 0.18);
    kleinGeometry.center();

    const mobiusGeometry = new ParametricGeometry(mobius, 20, 20);
    mobiusGeometry.scale(1.2, 1.2, 1.2);
    mobiusGeometry.center();

    const mobius3dGeometry = new ParametricGeometry(mobius3d, 30, 16);
    mobius3dGeometry.scale(0.7, 0.7, 0.7);
    mobius3dGeometry.center();

    return {
      parametricPlane,
      kleinGeometry,
      mobiusGeometry,
      mobius3dGeometry,
    };
  }, []);

  useEffect(() => {
    return () => {
      parametricGeometries.parametricPlane.dispose();
      parametricGeometries.kleinGeometry.dispose();
      parametricGeometries.mobiusGeometry.dispose();
      parametricGeometries.mobius3dGeometry.dispose();
    };
  }, [parametricGeometries]);

  const layoutPlaneSize = 40;
  const layoutPadding = 4;
  const baseY = 1.5;
  const objects = [
    {
      key: 'cube',
      visible: config.showCube,
      element: (
        <mesh castShadow>
          <boxGeometry args={[2.4, 2.4, 2.4]} />
          <meshPhongMaterial
            color="#44ccff"
            flatShading
            shininess={0}
            side={THREE.DoubleSide}
          />
        </mesh>
      ),
    },
    {
      key: 'cone',
      visible: config.showCone,
      element: (
        <mesh castShadow>
          <coneGeometry args={[1.5, 2.5, 4]} />
          <meshPhongMaterial
            color="#ff6644"
            flatShading
            shininess={0}
            side={THREE.DoubleSide}
          />
        </mesh>
      ),
    },
    {
      key: 'cylinder',
      visible: config.showCylinder,
      element: (
        <mesh castShadow>
          <cylinderGeometry args={[1, 1, 2.5, 12]} />
          <meshPhongMaterial
            color="#44ff66"
            flatShading
            shininess={0}
            side={THREE.DoubleSide}
          />
        </mesh>
      ),
    },
    {
      key: 'sphere',
      visible: config.showSphere,
      element: (
        <mesh castShadow>
          <sphereGeometry args={[1.25, 18, 12]} />
          <meshPhongMaterial
            color="#ffcc44"
            flatShading
            shininess={0}
            side={THREE.DoubleSide}
          />
        </mesh>
      ),
    },
    {
      key: 'icosahedron',
      visible: config.showIcosahedron,
      element: (
        <mesh castShadow>
          <icosahedronGeometry args={[1.5, 0]} />
          <meshPhongMaterial
            color="#4466ff"
            flatShading
            shininess={0}
            side={THREE.DoubleSide}
          />
        </mesh>
      ),
    },
    {
      key: 'octahedron',
      visible: config.showOctahedron,
      element: (
        <mesh castShadow>
          <octahedronGeometry args={[1.5, 0]} />
          <meshPhongMaterial
            color="#2f88ff"
            flatShading
            shininess={0}
            side={THREE.DoubleSide}
          />
        </mesh>
      ),
    },
    {
      key: 'tetrahedron',
      visible: config.showTetrahedron,
      element: (
        <mesh castShadow>
          <tetrahedronGeometry args={[1.7, 0]} />
          <meshPhongMaterial
            color="#7c5cff"
            flatShading
            shininess={0}
            side={THREE.DoubleSide}
          />
        </mesh>
      ),
    },
    {
      key: 'torusKnot',
      visible: config.showTorusKnot,
      element: (
        <mesh castShadow>
          <torusKnotGeometry args={[2, 0.4, 128, 16, 5, 6]} />
          <meshPhongMaterial
            color="#ff44cc"
            flatShading
            shininess={0}
            side={THREE.DoubleSide}
          />
        </mesh>
      ),
    },
    {
      key: 'planePrimitive',
      visible: config.showPlanePrimitive,
      element: (
        <mesh castShadow>
          <planeGeometry args={[2.6, 2.6, 4, 4]} />
          <meshPhongMaterial
            color="#7acba8"
            flatShading
            shininess={0}
            side={THREE.DoubleSide}
          />
        </mesh>
      ),
    },
    {
      key: 'circle',
      visible: config.showCircle,
      element: (
        <mesh castShadow>
          <circleGeometry args={[1.35, 24, 0, Math.PI * 2]} />
          <meshPhongMaterial
            color="#f57a52"
            flatShading
            shininess={0}
            side={THREE.DoubleSide}
          />
        </mesh>
      ),
    },
    {
      key: 'ring',
      visible: config.showRing,
      element: (
        <mesh castShadow>
          <ringGeometry args={[0.45, 1.35, 24, 6, 0, Math.PI * 2]} />
          <meshPhongMaterial
            color="#ffd166"
            flatShading
            shininess={0}
            side={THREE.DoubleSide}
          />
        </mesh>
      ),
    },
    {
      key: 'lathe',
      visible: config.showLathe,
      element: (
        <mesh castShadow>
          <latheGeometry args={[lathePoints, 24]} />
          <meshPhongMaterial
            color="#5dd39e"
            flatShading
            shininess={0}
            side={THREE.DoubleSide}
          />
        </mesh>
      ),
    },
    {
      key: 'torus',
      visible: config.showTorus,
      element: (
        <mesh castShadow>
          <torusGeometry args={[1.4, 0.45, 20, 28]} />
          <meshPhongMaterial
            color="#ff77aa"
            flatShading
            shininess={0}
            side={THREE.DoubleSide}
          />
        </mesh>
      ),
    },
    {
      key: 'capsule',
      visible: config.showCapsule,
      element: (
        <mesh castShadow>
          <capsuleGeometry args={[0.75, 1.45, 8, 16]} />
          <meshPhongMaterial
            color="#76c0ff"
            flatShading
            shininess={0}
            side={THREE.DoubleSide}
          />
        </mesh>
      ),
    },
    {
      key: 'parametricPlane',
      visible: config.showParametricPlane,
      element: (
        <mesh castShadow>
          <primitive
            object={parametricGeometries.parametricPlane}
            attach="geometry"
          />
          <meshPhongMaterial
            color="#9fe870"
            flatShading
            shininess={0}
            side={THREE.DoubleSide}
          />
        </mesh>
      ),
    },
    {
      key: 'klein',
      visible: config.showKlein,
      element: (
        <mesh castShadow>
          <primitive
            object={parametricGeometries.kleinGeometry}
            attach="geometry"
          />
          <meshPhongMaterial
            color="#93a8ff"
            flatShading
            shininess={0}
            side={THREE.DoubleSide}
          />
        </mesh>
      ),
    },
    {
      key: 'mobius',
      visible: config.showMobius,
      element: (
        <mesh castShadow>
          <primitive
            object={parametricGeometries.mobiusGeometry}
            attach="geometry"
          />
          <meshPhongMaterial
            color="#ffab91"
            flatShading
            shininess={0}
            side={THREE.DoubleSide}
          />
        </mesh>
      ),
    },
    {
      key: 'mobius3d',
      visible: config.showMobius3d,
      element: (
        <mesh castShadow>
          <primitive
            object={parametricGeometries.mobius3dGeometry}
            attach="geometry"
          />
          <meshPhongMaterial
            color="#ff8dc7"
            flatShading
            shininess={0}
            side={THREE.DoubleSide}
          />
        </mesh>
      ),
    },
    {
      key: 'miniNeuralNet',
      visible: config.showMiniNeuralNet,
      element: <MiniNeuralNet />,
    },
    {
      key: 'miniParticleCloud',
      visible: config.showMiniParticleCloud,
      element: <MiniParticleCloud />,
    },
  ];

  const totalObjects = objects.length;
  const objectPositions = useMemo(() => {
    const columns = Math.max(1, Math.ceil(Math.sqrt(totalObjects)));
    const rows = Math.max(1, Math.ceil(totalObjects / columns));
    const usableSpan = Math.max(0, layoutPlaneSize - layoutPadding * 2);
    const stepX = columns > 1 ? usableSpan / (columns - 1) : 0;
    const stepZ = rows > 1 ? usableSpan / (rows - 1) : 0;
    const xStart = -usableSpan / 2;
    const zStart = -usableSpan / 2;

    return Array.from({ length: totalObjects }, (_, i) => {
      const col = i % columns;
      const row = Math.floor(i / columns);
      return [xStart + col * stepX, baseY, zStart + row * stepZ];
    });
  }, [baseY, layoutPadding, layoutPlaneSize, totalObjects]);

  return (
    <>
      <color attach="background" args={[FIXED_SCENE_COLORS.background]} />
      <PerspectiveCamera makeDefault fov={45} position={[8, 6, 10]} />
      <CameraControls />

      <ambientLight intensity={FIXED_SCENE_COLORS.ambient} />
      <pointLight
        castShadow
        intensity={config.lightIntensity}
        position={lightPosition}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />

      <mesh position={lightPosition} userData={{ excludeFromSVG: true }}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshBasicMaterial
          color={0xff8800}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Stable slots prevent remaining objects from shifting when toggled */}
      {objects.map((obj, i) => {
        if (!obj.visible) {
          return null;
        }

        return (
          <group key={obj.key} position={objectPositions[i]}>
            {obj.element}
          </group>
        );
      })}

      {/* Plane and grid */}
      {config.showGroundPlane ? (
        <mesh
          receiveShadow
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.02, 0]}
        >
          <planeGeometry args={[layoutPlaneSize, layoutPlaneSize, 1, 1]} />
          <meshPhongMaterial
            color="#b7b7b7"
            shininess={0}
            side={THREE.DoubleSide}
          />
        </mesh>
      ) : null}
      {config.showGrid ? (
        <gridHelper
          args={[
            layoutPlaneSize,
            layoutPlaneSize,
            FIXED_SCENE_COLORS.gridCenter,
            FIXED_SCENE_COLORS.gridLines,
          ]}
        />
      ) : null}
    </>
  );
}
