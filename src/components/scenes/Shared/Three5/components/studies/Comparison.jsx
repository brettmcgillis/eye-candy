import React, { memo, useRef } from 'react';

import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

function Comparison({
  config,
  children,
  sourceLabel = 'Original',
  treatmentLabel = 'Combined',
}) {
  const time = useRef(0);
  useFrame((_state, delta) => {
    if (config.studyMotion)
      time.current += Math.min(delta, 0.05) * config.studySpeed;
  }, -2);
  const compare = config.studyView === 'compare';
  const modes = compare ? ['original', 'combined'] : [config.studyView];
  return modes.map((mode, index) => (
    <group
      key={mode}
      position-x={compare ? (index * 2 - 1) * 2.75 : 0}
      scale={compare ? 0.84 : 1}
    >
      {children(mode, time)}
      <Html position={[0, -3.05, 0]} center style={{ pointerEvents: 'none' }}>
        <div className="three5-comparison-label">
          {mode === 'original' ? sourceLabel : treatmentLabel}
        </div>
      </Html>
    </group>
  ));
}
export default memo(Comparison);
