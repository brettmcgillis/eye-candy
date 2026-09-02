import React, { memo } from 'react';

import { OrthographicCamera } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

import useRadialShadowPipeline from '../hooks/useRadialShadowPipeline';

// A pixel-space orthographic porthole with one quad filling it exactly, so the
// piece is always edge to edge and the shadow march works in the same pixel
// units CrossTalk's step sizes were tuned in.
//
// Must be drei's <OrthographicCamera>, not the raw primitive: `makeDefault` is
// a drei convention (it calls the R3F store's `set({ camera })` in an effect),
// and the raw primitive silently ignores it, leaving the scene rendering
// through R3F's untouched default camera — a small quad adrift in the middle
// of a black frame. Learned the hard way here, and documented the same way in
// CrossTalk's DesktopStage.
function RadiantField({ config }) {
  const size = useThree((state) => state.size);
  const material = useRadialShadowPipeline(config);

  return (
    <>
      <OrthographicCamera
        makeDefault
        manual
        left={0}
        right={size.width}
        top={0}
        bottom={size.height}
        near={-10000}
        far={10000}
        position={[0, 0, 100]}
      />
      <mesh
        frustumCulled={false}
        material={material}
        position={[size.width / 2, size.height / 2, -1]}
        scale={[size.width, size.height, 1]}
      >
        <planeGeometry args={[1, 1]} />
      </mesh>
    </>
  );
}

export default memo(RadiantField);
