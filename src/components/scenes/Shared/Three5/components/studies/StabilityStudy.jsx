import React, { memo, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { DoubleSide } from 'three';

import useCameraInk from '../../hooks/useCameraInk';
import { curvePaths } from '../../utils/subjects';
import BrushRibbons from '../BrushRibbons';
import Comparison from './Comparison';
import InkStatus from './InkStatus';

function StabilitySample({ config, assets, mode, time, runtimeRef }) {
  const root = useRef();
  const moving = useRef();
  const plane = useRef();
  const paths = useMemo(() => curvePaths('helix'), []);
  const repaint =
    mode !== 'original' && config.stabilityAnchor === 'camera repaint';
  const { texture, job } = useCameraInk({
    root,
    plane,
    paths,
    time,
    config,
    runtimeRef,
    enabled: repaint,
  });
  useFrame(() => {
    moving.current.rotation.y = time.current;
    moving.current.position.x = Math.sin(time.current * 2) * 0.2;
  }, -1);
  return (
    <group ref={root}>
      {repaint && <InkStatus job={job} />}
      <group ref={moving} visible={!repaint}>
        <BrushRibbons
          paths={paths}
          assets={assets}
          config={{
            ...config,
            ribbonWidth: config.stabilityWidth,
            faceCamera: true,
            growth: 1,
            cleanLines: mode === 'original',
          }}
        />
      </group>
      <mesh ref={plane} visible={repaint}>
        <planeGeometry args={[6, 6]} />
        <meshBasicMaterial map={texture} side={DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  );
}
const Sample = memo(StabilitySample);
function StabilityStudy({ config, ...props }) {
  return (
    <Comparison
      config={config}
      sourceLabel="Live surface marks"
      treatmentLabel={config.stabilityAnchor}
    >
      {(mode, time) => (
        <Sample config={config} {...props} mode={mode} time={time} />
      )}
    </Comparison>
  );
}
export default memo(StabilityStudy);
