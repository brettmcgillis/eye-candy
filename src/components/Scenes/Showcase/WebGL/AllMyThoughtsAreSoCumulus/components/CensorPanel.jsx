import React, { memo, useMemo } from 'react';

import { radians } from '../../../../../../utils/math';
import Censor from '../../../../TestLab/WebGL/PixelHater/censor/Censor';

const CensorPanel = memo(function CensorPanel({
  visible,
  position,
  rotation,
  scale,
  pixelSize,
  refraction,
  clipOffset,
  tintVisible,
  tintColor,
  tintOpacity,
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
        <planeGeometry args={[1, 1]} />
      </Censor>

      {tintVisible && (
        <mesh position={[0, 0, 0.001]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            color={tintColor}
            transparent
            opacity={tintOpacity}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
});

export default CensorPanel;
