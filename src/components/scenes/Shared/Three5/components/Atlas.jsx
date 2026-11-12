import React, { memo } from 'react';

function Atlas({ assets }) {
  return (
    <mesh>
      <planeGeometry args={[7, 7]} />
      <meshBasicMaterial map={assets.mainTexture} toneMapped={false} />
    </mesh>
  );
}

export default memo(Atlas);
