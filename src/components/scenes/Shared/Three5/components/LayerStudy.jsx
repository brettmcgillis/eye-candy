import React, { memo, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { DoubleSide } from 'three';

import { makeRng } from '../utils/paintStyle';

function LayerStudy({ assets, config }) {
  const group = useRef();
  const items = useMemo(() => {
    const rng = makeRng(config.seed);
    return Array.from({ length: config.layerCount }, (_, index) => ({
      id: index,
      position: [
        (rng() - 0.5) * 6,
        (rng() - 0.5) * 4.8,
        (rng() - 0.5) * config.layerDepth,
      ],
      angle: (rng() - 0.5) * 1.4,
      size: 0.65 + rng() * 0.7,
    }));
  }, [config.seed, config.layerCount, config.layerDepth]);
  useFrame(({ camera, clock }) => {
    group.current.children.forEach((child, index) => {
      const item = items[index];
      if (config.billboard) child.quaternion.copy(camera.quaternion);
      else
        child.rotation.set(
          Math.sin(clock.elapsedTime * 0.4 + index) * config.flutter,
          item.angle,
          item.angle * 0.2
        );
    });
  });
  return (
    <group ref={group}>
      {items.map((item) => (
        <group
          key={item.id}
          position={item.position}
          scale={config.layerScale * item.size}
        >
          {config.paperBacking && (
            <mesh position-z={-0.005}>
              <planeGeometry args={[1.8, 1.8]} />
              <meshBasicMaterial color={config.paper} side={DoubleSide} />
            </mesh>
          )}
          <mesh>
            <planeGeometry args={[1.8, 1.8]} />
            <meshBasicMaterial
              map={assets.spriteTexture}
              side={DoubleSide}
              transparent
              alphaTest={0.01}
              depthWrite={config.depthWrite}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default memo(LayerStudy);
