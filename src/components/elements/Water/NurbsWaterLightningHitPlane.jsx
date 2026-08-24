import React from 'react';

export default function NurbsWaterLightningHitPlane({
  geometry,
  hitRef,
  interactionHitY,
  onPointerMove,
  onPointerOut,
  onPointerOver,
}) {
  return (
    <mesh
      ref={hitRef}
      geometry={geometry}
      onPointerMove={onPointerMove}
      onPointerOut={onPointerOut}
      onPointerOver={onPointerOver}
      position={[0, interactionHitY, 0]}
      rotation-x={-Math.PI / 2}
      userData={{ lightningIgnore: true }}
    >
      <meshBasicMaterial depthWrite={false} opacity={0} transparent />
    </mesh>
  );
}
