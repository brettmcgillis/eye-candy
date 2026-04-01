import { memo } from 'react';

import Femur from '../../../../../elements/femur/Femur';

const SceneFemur = memo(function SceneFemur({
  position,
  rotation,
  scale,
  visible,
}) {
  return (
    <Femur
      position={position}
      rotation={rotation}
      scale={scale}
      visible={visible}
    />
  );
});

export default SceneFemur;
