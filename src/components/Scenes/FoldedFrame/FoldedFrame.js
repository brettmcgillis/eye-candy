import { useControls } from 'leva';

import getColorsInRange from '../../../utils/colors';
import { _45_deg } from '../../../utils/math';

import { PaperFrame } from '../../elements/PaperFrame';
import CameraRig from '../../rigging/CameraRig';
import LightingRig from '../../rigging/LightingRig';

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
      {squares.map((square, index) => {
        return Square({ index, layer, ...square, settings });
      })}
    </group>
  );
}

function FoldedFrame() {
  const frames = getFrames();
  const {
    frame,
    rotate,
    colorRange_start,
    colorRange_end,
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
      colorRange_start: { label: 'Start', value: '#FFFFFF' },
      colorRange_end: { label: 'End', value: '#D8D8D8' },
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
    { collapsed: false },
  );

  const frameData = getFrameData(!!frame ? frame : frames[0].name);
  let { settings, layers } = frameData;

  const colorGamut = getColorsInRange(
    colorRange_start,
    colorRange_end,
    layers.length,
  );

  layers = layers.map((layer, index) => {
    return layer.map((square) => {
      square.color = colorGamut[index];
      return square;
    });
  });

  return (
    <>
      <LightingRig />
      <CameraRig />
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
        {layers.map((layer, index) => {
          return Layer({
            layer: index,
            squares: layer,
            depth: -(index * settings.paperDepth),
            settings,
          });
        })}
      </group>
    </>
  );
}

export default FoldedFrame;
