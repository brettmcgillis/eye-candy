import { useControls } from 'leva';
import React from 'react';

import { PerspectiveCamera } from '@react-three/drei';

import { PaperFrame } from 'components/elements/PaperFrame';
import CameraRig from 'components/rigging/CameraRig';
import LightingRig from 'components/rigging/LightingRig';

import getColorsInRange from 'utils/colors';
import { _45_deg } from 'utils/math';

import { getFrameData, getFrames } from './FrameData';

function Square({ index, layer, size, position, color, settings }) {
  const [x, y] = position;
  const mirror = settings.symmetric && (x !== 0 || y !== 0);
  return (
    <>
      <mesh castShadow receiveShadow position={[x, y, 0]}>
        <boxGeometry args={[size, size, settings.paperDepth]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {mirror && (
        <mesh castShadow receiveShadow position={[-x, -y, 0]}>
          <boxGeometry args={[size, size, settings.paperDepth]} />
          <meshStandardMaterial color={color} />
        </mesh>
      )}
    </>
  );
}

function Layer({ layer, squares, depth, settings }) {
  return (
    <group position={[0, 0, depth]}>
      {squares.map((square, index) =>
        Square({ index, layer, ...square, settings })
      )}
    </group>
  );
}

function FoldedFrame() {
  const frames = getFrames();
  const {
    frame,
    rotate,
    colorRangeStart,
    colorRangeEnd,
    dataScale,
    frameScale,
    dataPosition,
    framePosition,
  } = useControls(
    'Scene',
    {
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
        value: { x: 0, y: 0, z: 0.08 },
      },
      framePosition: { label: 'Frame Position', value: { x: 0, y: 0, z: 0 } },
      frameScale: {
        label: 'Frame Scale',
        value: 1.1,
        min: 0.1,
        max: 10,
        step: 0.1,
      },
    },
    { collapsed: false }
  );

  const frameData = getFrameData(frame || frames[0].name);
  let { settings, layers } = frameData;

  const colorGamut = getColorsInRange(
    colorRangeStart,
    colorRangeEnd,
    layers.length
  );

  layers = layers.map((layer, index) =>
    layer.map((square) => {
      square.color = colorGamut[index];
      return square;
    })
  );

  return (
    <>
      <LightingRig />
      <CameraRig />

      <PerspectiveCamera makeDefault position={[0, 0, 3]} />

      <PaperFrame
        position={[framePosition.x, framePosition.y, framePosition.z]}
        scale={frameScale}
        rotation={[0, 0, rotate ? 0 : -_45_deg]}
      />
      <group
        position={[dataPosition.x, dataPosition.y, dataPosition.z]}
        scale={dataScale}
        rotation={[0, 0, rotate ? -_45_deg : 0]}
      >
        {layers.map((layer, index) =>
          Layer({
            layer: index,
            squares: layer,
            depth: -(index * settings.paperDepth),
            settings,
          })
        )}
      </group>
    </>
  );
}

export default FoldedFrame;
