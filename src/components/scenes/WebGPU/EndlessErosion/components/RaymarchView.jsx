import React, { memo, useEffect, useMemo } from 'react';

import buildRaymarchMaterial from '../utils/raymarchMaterial';

// The march resolution is the canvas drawing buffer, so render scale is dropped
// DPR and the browser upscales for free.
function RaymarchView({ field, quality, uniforms, view }) {
  const material = useMemo(
    () => buildRaymarchMaterial({ field, quality, uniforms, view }),
    [field, quality, uniforms, view]
  );

  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh frustumCulled={false} material={material} renderOrder={-1}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

export default memo(RaymarchView);
