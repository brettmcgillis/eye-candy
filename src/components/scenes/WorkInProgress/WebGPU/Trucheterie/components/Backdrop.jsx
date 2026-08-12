import React, { memo } from 'react';

// Full-bleed plane behind the tiles, filling the whole camera view with
// bgColor so pixels the clip mask discards (utils/clipMask.js) read as
// solid background instead of the canvas clear color. Sits well behind z=0
// — a spinning tile's corners swing into negative z during a ySpin/zSpin
// flip (up to ~half the cell size), so anything closer than that would risk
// being occluded by this plane mid-flip.
function Backdrop({ bgColor }) {
  return (
    <mesh position={[0, 0, -5]}>
      <planeGeometry args={[200, 200]} />
      <meshBasicMaterial color={bgColor} toneMapped={false} />
    </mesh>
  );
}

export default memo(Backdrop);
