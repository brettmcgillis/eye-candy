/* eslint-disable react/no-array-index-key */

/* eslint-disable no-unused-vars */
import { folder, useControls } from 'leva';
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { degToRad } from 'three/src/math/MathUtils';

import { Addition, Base, Geometry, Subtraction } from '@react-three/csg';
import { MeshTransmissionMaterial } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import CameraRig from 'components/rigging/CameraRig';
import LightingRig from 'components/rigging/LightingRig';

function Stack() {
  const geometryRef = useRef();
  const subtractionRef = useRef();

  const update = (_) => geometryRef?.current?.update();

  const {
    layerWidth,
    layerDepth,
    layerDepthBuffer,
    layerHeight,
    windowPosition,
    windowSize,
    windowDepth,
    splitWidth,
  } = useControls(
    'Paper Stack',
    {
      Stack: folder(
        {
          layerHeight: {
            label: 'Height',
            value: 4,
            min: 1,
            max: 10,
          },
          layerWidth: {
            label: 'Width',
            value: 10,
            min: 1,
            max: 20,
          },
          layerDepth: {
            label: 'Layer Depth',
            value: 0.01,
            min: 0.005,
            max: 0.1,
          },
          layerDepthBuffer: {
            label: 'Buffer',
            value: 0.01,
            min: 0.01,
            max: 0.1,
          },
        },
        { collapsed: true }
      ),
      Window: folder(
        {
          windowSize: { label: 'Size', value: 2, min: 1, max: 4 },
          windowDepth: { label: 'Depth', value: 0.03, min: 0.01, max: 0.5 },
          windowPosition: {
            label: 'Position',
            value: { x: 0, y: 0, z: 0.005 },
          },
          splitWidth: {
            label: 'Split Width',
            value: 0.05,
            min: 0.01,
            max: 0.5,
          },
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );

  const layers = [
    'black',
    'violet',
    'indigo',
    'blue',
    'green',
    'yellow',
    'orange',
    'red',
    'white',
    'black',
  ];

  // useFrame(({ clock }) => {
  //   const time = clock.getElapsedTime();
  //   subtractionRef.current.position.z = Math.sin(time) / 4 + 0.25;
  //   geometryRef.current.update();
  // });

  const paper = useMemo(
    () => new THREE.BoxGeometry(layerWidth, layerHeight, layerDepth),
    [layerWidth, layerHeight, layerDepth]
  );

  const windowBox = useMemo(
    () =>
      new THREE.BoxGeometry(
        windowSize,
        windowSize,
        (layerDepth + layerDepthBuffer) * 2
      ),
    [windowSize, windowDepth, layerDepth, layerDepthBuffer]
  );

  const windowSplit = useMemo(
    () =>
      new THREE.BoxGeometry(windowSize, windowSize * splitWidth, windowSize),
    [windowSize, splitWidth, windowSize]
  );

  return (
    <mesh receiveShadow castShadow>
      <Geometry ref={geometryRef} useGroups>
        <Base position={[0, 0, 0]} geometry={paper}>
          <meshStandardMaterial color={layers[0]} side={THREE.DoubleSide} />
        </Base>

        {layers.slice(1).map((color, index) => (
          <Addition
            key={`layer-${index}`}
            position={[0, 0, -(index + 1) * (layerDepth + layerDepthBuffer)]}
            geometry={paper}
          >
            <meshStandardMaterial color={color} side={THREE.DoubleSide} />
          </Addition>
        ))}

        <Subtraction
          position={[windowPosition.x, windowPosition.y, windowPosition.z]}
          ref={subtractionRef}
        >
          <Geometry>
            <Base geometry={windowBox}>
              <MeshTransmissionMaterial side={THREE.DoubleSide} />
            </Base>
            {layers.slice(2).map((_, index, arr) => {
              const layerIx = index + 2;
              const zDepth = layerIx * (layerDepth + layerDepthBuffer);
              const xyScale = 1 - (1 / arr.length) * layerIx;

              return (
                <Addition
                  key={`sublayer-${index}`}
                  geometry={windowBox}
                  position={[0, 0, windowPosition.z - zDepth]}
                  scale={[xyScale, xyScale, 1]}
                >
                  <MeshTransmissionMaterial side={THREE.DoubleSide} />
                </Addition>
              );
            })}

            {/* {layers.slice(1).map((_, index) => {
              const layer = index + 1;
              const scale = -((1 - 0.1) / layers.length) * layer;
              const winDepth = layerDepth + layerDepthBuffer + 0.1;
              return (
                <Addition
                  position={[
                    windowPosition.x,
                    windowPosition.y,
                    windowPosition.z - layer * winDepth,
                  ]}
                  scale={[scale, scale, 1]}
                  geometry={windowBox}
                >
                  <MeshTransmissionMaterial side={THREE.DoubleSide} />
                </Addition>
              );
            })} */}
            <Subtraction geometry={windowSplit} />
            <Subtraction
              geometry={windowSplit}
              rotation={[0, 0, degToRad(90)]}
            />
          </Geometry>
          <MeshTransmissionMaterial side={THREE.DoubleSide} />
        </Subtraction>
      </Geometry>
    </mesh>
  );
}

export default function PaperStack() {
  return (
    <>
      <color attach="background" args={['#f0f0f0']} />
      <ambientLight intensity={1} />
      <LightingRig />
      <CameraRig screenShot />
      {/* <GridHelper x y z /> */}
      <Stack />
    </>
  );
}
