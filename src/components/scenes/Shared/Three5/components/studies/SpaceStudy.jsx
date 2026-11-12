import React, { memo, useEffect, useMemo, useRef } from 'react';

import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import { DoubleSide } from 'three';

import useSpaceDrawing from '../../hooks/useSpaceDrawing';
import { studyGeometry } from '../../utils/studyGeometry';
import Comparison from './Comparison';
import Stroke from './SpaceGesture';

function SpaceSample({ config, mode, time, strokes, begin, move, end }) {
  const root = useRef();
  const subject = useRef();
  const geometry = useMemo(
    () => studyGeometry(config.studyShape),
    [config.studyShape]
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(() => {
    subject.current.rotation.y = time.current;
  });
  const writable = mode !== 'original' && config.spaceEnabled;
  return (
    <group ref={root}>
      <mesh ref={subject} geometry={geometry} scale={0.7}>
        <meshStandardMaterial
          color="#d8c8b8"
          roughness={0.85}
          colorWrite={mode !== 'treatment'}
        />
      </mesh>
      {strokes.map((stroke) => (
        <Stroke
          key={stroke.id}
          stroke={stroke}
          config={config}
          original={mode === 'original'}
          root={root}
        />
      ))}
      {writable && (
        <mesh
          position-z={config.spaceDepth}
          onPointerDown={(event) => begin(event, root.current)}
          onPointerMove={(event) => move(event, root.current)}
          onPointerUp={end}
          onPointerCancel={end}
        >
          <planeGeometry args={[10, 8]} />
          <meshBasicMaterial
            transparent
            opacity={0}
            depthWrite={false}
            side={DoubleSide}
          />
        </mesh>
      )}
      {writable && (
        <Html position={[0, 2.8, 0]} center style={{ pointerEvents: 'none' }}>
          <span className="three5-comparison-label">
            DRAW AT Z {config.spaceDepth.toFixed(1)} · {strokes.length}/32
            GESTURES
          </span>
        </Html>
      )}
    </group>
  );
}
const Sample = memo(SpaceSample);

function SpaceStudy({ assets, config, actionsRef }) {
  const { strokes, begin, move, end } = useSpaceDrawing(
    assets,
    config,
    actionsRef
  );
  return (
    <Comparison
      config={config}
      sourceLabel="Gesture centerlines"
      treatmentLabel="Pressure-sensitive pigment"
    >
      {(mode, time) => (
        <Sample
          mode={mode}
          time={time}
          config={config}
          strokes={strokes}
          begin={begin}
          move={move}
          end={end}
        />
      )}
    </Comparison>
  );
}
export default memo(SpaceStudy);
