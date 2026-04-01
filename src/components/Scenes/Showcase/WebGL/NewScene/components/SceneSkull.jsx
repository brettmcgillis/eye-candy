import { memo } from 'react';

import Skull from '../../../../../elements/skull/Skull';

const SceneSkull = memo(function SceneSkull({
  position,
  rotation,
  scale,
  visible,
  ...skullControls
}) {
  return (
    <Skull
      {...skullControls}
      position={position}
      rotation={rotation}
      scale={scale}
      visible={visible}
    />
  );
});

export default SceneSkull;
