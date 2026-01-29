/* eslint-disable react/no-array-index-key */
import { useControls } from 'leva';

import React, { useRef, useState } from 'react';

import {
  AccumulativeShadows,
  Environment,
  PerspectiveCamera,
  RandomizedLight,
} from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import getColorsInRange from '../../../utils/colors';
import { fourtyFiveDegrees } from '../../../utils/math';
import PaperFrame from '../../elements/paperframe/PaperFrame';
import CameraRig from '../../rigging/CameraRig';
import LightingRig from '../../rigging/LightingRig';
import { getFrameData, getFrames } from './FrameData';

function Square({ size, position, color, settings }) {
  const [x, y] = position;
  const mirror = settings.symmetric && (x !== 0 || y !== 0);
  return (
    <>
      <mesh position={[x, y, 0]}>
        <boxGeometry
          castShadow
          receiveShadow
          args={[size, size, settings.paperDepth]}
        />
        <meshStandardMaterial color={color} />
      </mesh>
      {mirror && (
        <mesh castShadow receiveShadow position={[-x, -y, 0]}>
          <boxGeometry
            castShadow
            receiveShadow
            args={[size, size, settings.paperDepth]}
          />
          <meshStandardMaterial color={color} />
        </mesh>
      )}
    </>
  );
}

function Layer({ layer, squares, depth, settings }) {
  return (
    <group castShadow receiveShadow position={[0, 0, depth]}>
      {squares.map((square, index) => (
        <Square
          key={`sq-${index}`}
          index={index}
          layer={layer}
          {...square}
          settings={settings}
        />
      ))}
    </group>
  );
}

function FoldedFrame() {
  const frames = getFrames();
  const [
    {
      frame,
      rotate,
      colorRangeStart,
      colorRangeEnd,
      dataScale,
      frameScale,
      dataPosition,
      frameVisible,
      framePosition,
    },
    set,
  ] = useControls(
    'Scene',
    () => ({
      frame: {
        label: 'Select Frame',
        value: frames[0].name,
        options: frames.map((f) => f.name),
      },
      colorRangeStart: { label: 'Start', value: '#FFFFFF' },
      colorRangeEnd: { label: 'End', value: '#D8D8D8' },
      rotate: { value: true, label: 'Rotate 45*' },
      dataScale: {
        label: 'Square Scale',
        value: 0.1,
        min: 0.1,
        max: 10,
        step: 0.1,
      },
      dataPosition: {
        label: 'Square Position',
        value: { x: 0, y: 1.1, z: 0.08 },
      },
      frameVisible: { label: 'Show Frame', value: true },
      framePosition: { label: 'Frame Position', value: { x: 0, y: 1.1, z: 0 } },
      frameScale: {
        label: 'Frame Scale',
        value: 1.1,
        min: 0.1,
        max: 10,
        step: 0.1,
      },
    }),
    { collapsed: false }
  );

  const frameData = getFrameData(frame || frames[0].name);
  const { settings, layers } = frameData;

  const colorGamut = getColorsInRange(
    colorRangeStart,
    colorRangeEnd,
    layers.length
  );

  const frameLayers = layers.map((layer, index) =>
    layer.map((square) => ({
      ...square,
      color: colorGamut[index],
    }))
  );

  const [depthBuffer, setDepthBuffer] = useState(1);

  function getRandomHexColor(time) {
    const hexColor = Math.floor(time).toString(16);
    const paddedHexColor = hexColor.padStart(6, '0');
    return `#${paddedHexColor}`;
  }
  function getInverseHexColorFromTimeElapsed(time) {
    const hexColor = (16777215 - Math.floor(time)).toString(16);
    const paddedHexColor = hexColor.padStart(6, '0');
    return `#${paddedHexColor}`;
  }
  const groupRef = useRef();

  useFrame(({ clock }) => {
    if (!clock) {
      setDepthBuffer(1 + Math.sin(clock.getElapsedTime()) / 2);
      if (clock.getElapsedTime() % 2 < 0.5) {
        set({
          colorRangeStart: getRandomHexColor(
            clock.elapsedTime * clock.elapsedTime * 23
          ),
          colorRangeEnd: getInverseHexColorFromTimeElapsed(
            clock.elapsedTime * clock.elapsedTime * 23
          ),
        });
      }
    }
  });

  return (
    <>
      <LightingRig />
      <CameraRig />

      <PerspectiveCamera
        makeDefault
        position={[0, 0, 3]}
        rotation={[0, 0, 0]}
      />
      <AccumulativeShadows
        temporal
        frames={200}
        color="purple"
        colorBlend={0.5}
        opacity={1}
        scale={10}
        alphaTest={0.85}
      >
        <RandomizedLight
          amount={8}
          radius={5}
          ambient={0.5}
          position={[5, 3, 2]}
          bias={0.001}
        />
      </AccumulativeShadows>
      <Environment preset="city" background blur={1} />

      <group ref={groupRef}>
        <PaperFrame
          visible={frameVisible}
          position={[framePosition.x, framePosition.y, framePosition.z]}
          scale={frameScale}
          rotation={[0, 0, rotate ? 0 : -fourtyFiveDegrees]}
        />
        <group
          castShadow
          receiveShadow
          position={[dataPosition.x, dataPosition.y, dataPosition.z]}
          scale={dataScale}
          rotation={[0, 0, rotate ? -fourtyFiveDegrees : 0]}
        >
          {frameLayers.map((layer, index) => (
            <Layer
              key={`layer-${index}`}
              layer={index}
              squares={layer}
              depth={-(index * settings.paperDepth * depthBuffer)}
              settings={settings}
            />
          ))}
        </group>
      </group>
    </>
  );
}

export default FoldedFrame;
