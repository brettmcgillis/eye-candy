import React, { memo } from 'react';

const SHADOW_OFFSET = 6;

function BoardQuad({ ink, paperColor, rect }) {
  return (
    <group position={[rect.centerX, rect.centerY, 0]}>
      <mesh position={[SHADOW_OFFSET, -SHADOW_OFFSET, -2]}>
        <planeGeometry args={[rect.size, rect.size]} />
        <meshBasicMaterial color="#000000" opacity={0.25} transparent />
      </mesh>
      <mesh position-z={-1}>
        <planeGeometry args={[rect.size, rect.size]} />
        <meshBasicMaterial color={paperColor} toneMapped={false} />
      </mesh>
      {ink && (
        <mesh key={ink.uuid}>
          <planeGeometry args={[rect.size, rect.size]} />
          <meshBasicMaterial map={ink} toneMapped={false} transparent />
        </mesh>
      )}
    </group>
  );
}

export default memo(BoardQuad);
