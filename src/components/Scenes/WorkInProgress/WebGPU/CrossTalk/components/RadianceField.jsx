import React, { memo } from 'react';

import useRadialShadowPipeline from '../hooks/useRadialShadowPipeline';

// The whole radial-shadow radiance render, as one fullscreen-in-this-window
// quad. Sized/positioned exactly like every other world-space entity in this
// scene (a plane covering `selfRect`, inside DesktopStage's eased world group)
// so it glides the same way on window drag; the shader's own notion of "world
// position" is driven by live uniforms (see useRadialShadowPipeline) rather
// than that eased transform.
function RadianceField({
  ambient,
  exposure,
  sceneDetail,
  selfId,
  selfLight,
  selfOccluder,
  selfRect,
  shadowSoftness,
  windows,
}) {
  const { material, meshRef } = useRadialShadowPipeline({
    ambient,
    exposure,
    sceneDetail,
    selfId,
    selfLight,
    selfOccluder,
    selfRect,
    shadowSoftness,
    windows,
  });

  if (!selfRect) return null;

  return (
    <mesh
      ref={meshRef}
      frustumCulled={false}
      material={material}
      position={[selfRect.x + selfRect.w / 2, selfRect.y + selfRect.h / 2, -1]}
      scale={[selfRect.w, selfRect.h, 1]}
    >
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}

export default memo(RadianceField);
