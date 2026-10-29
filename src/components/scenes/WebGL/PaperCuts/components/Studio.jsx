import React, { memo, useEffect, useMemo } from 'react';

import { createStudio } from '@modules/paperCutsRender';

function Studio({ config, position, scale }) {
  const studio = useMemo(() => createStudio({ scale }), [scale]);
  useEffect(() => {
    studio.apply(config);
  }, [studio, config.keyIntensity, config.fillIntensity]);
  useEffect(() => () => studio.dispose(), [studio]);
  return (
    <group position={[position.x, position.y, position.z]}>
      <primitive object={studio.group} dispose={null} />
    </group>
  );
}
export default memo(Studio);
