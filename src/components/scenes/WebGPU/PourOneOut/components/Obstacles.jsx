import React, { memo, useMemo } from 'react';

import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);

function Obstacles({ config, plate, pins }) {
  const orientations = useMemo(
    () =>
      pins.map((pin) =>
        new THREE.Quaternion().setFromUnitVectors(UP, pin.axis)
      ),
    [pins]
  );

  return (
    <group>
      {config.showPlate && (
        <mesh position={plate.center} castShadow receiveShadow>
          <boxGeometry
            args={[plate.half.x * 2, plate.half.y * 2, plate.half.z * 2]}
          />
          <meshStandardMaterial
            color={config.solidColor}
            metalness={0.05}
            roughness={0.55}
          />
        </mesh>
      )}

      {config.showPins &&
        pins.map((pin, index) => (
          <mesh
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            castShadow
            position={pin.origin}
            quaternion={orientations[index]}
            receiveShadow
          >
            <capsuleGeometry args={[pin.radius, pin.length, 6, 20]} />
            <meshStandardMaterial
              color={config.solidColor}
              metalness={0.05}
              roughness={0.35}
            />
          </mesh>
        ))}
    </group>
  );
}

export default memo(Obstacles);
