import React, { memo, useMemo } from 'react';

import { Censor } from '@elements/Censor';
import { radians } from '@utils/math';

const CensorPanel = memo(function CensorPanel({
  visible,
  position,
  rotation,
  scale,
  pixelSize,
  refraction,
  clipOffset,
}) {
  const panelPosition = useMemo(
    () => [position.x, position.y, position.z],
    [position.x, position.y, position.z]
  );

  const panelRotation = useMemo(
    () => [radians(rotation.x), radians(rotation.y), radians(rotation.z)],
    [rotation.x, rotation.y, rotation.z]
  );

  return (
    <group
      visible={visible}
      position={panelPosition}
      rotation={panelRotation}
      scale={scale}
    >
      <Censor
        pixelSize={pixelSize}
        refraction={refraction}
        clipOffset={clipOffset}
      >
        <boxGeometry args={[1, 1, 0.1]} />
      </Censor>
    </group>
  );
});

export default CensorPanel;
