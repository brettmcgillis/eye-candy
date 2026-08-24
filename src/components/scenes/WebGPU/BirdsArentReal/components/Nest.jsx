import React, { memo } from 'react';

import { useTexture } from '@react-three/drei';

import * as THREE from 'three';

import Egg from '@elements/Egg/Egg';
import NestModel from '@elements/Nest/Nest';
import { imageFile } from '@utils/appUtils';

import v3 from '../utils/vec';

// QR sticker stamped on the nest eggs — sells the "mass-produced fake" gag. Unlit decal
// map; sRGB so the black/white code stays crisp. Preloaded so the first apply is instant.
const QR_TEXTURE = imageFile(
  'brettmcgillis-github-io-eyecandy-dumpsterFire-brickWall-qr.png'
);
useTexture.preload(QR_TEXTURE);

// The scene's nest: the generic sticks bundle with two eggs nestled on top, each
// stamped with the QR decal. The Egg component pre-rotates its mesh and leaves the egg
// floating ~0.498 above its group origin, so blind defaults are unreliable — each egg
// gets its own nest-local position + rotation (so it rides with the nest) plus a shared
// eggScale, all tuned live from the scene's Nest controls.
function Nest({
  eggScale = 0.5,
  egg1Pos = { x: -0.08, y: -0.16, z: 0.03 },
  egg1Rot = { x: 0, y: 0.4, z: 0 },
  egg2Pos = { x: 0.09, y: -0.16, z: -0.05 },
  egg2Rot = { x: 0, y: -0.3, z: 0 },
  qrShow = true,
  qrScale = 0.22,
  qrU = 0.02,
  qrV = 0,
  qrSpin = 0,
  ...props
}) {
  const qrMap = useTexture(QR_TEXTURE);
  qrMap.colorSpace = THREE.SRGBColorSpace;
  qrMap.wrapS = THREE.ClampToEdgeWrapping;
  qrMap.wrapT = THREE.ClampToEdgeWrapping;

  const decalProps = {
    decalMap: qrShow ? qrMap : undefined,
    decalScale: qrScale,
    decalU: qrU,
    decalV: qrV,
    decalSpin: qrSpin,
  };

  return (
    <NestModel {...props}>
      <Egg
        scale={eggScale}
        position={v3(egg1Pos)}
        rotation={v3(egg1Rot)}
        {...decalProps}
      />
      <Egg
        scale={eggScale}
        position={v3(egg2Pos)}
        rotation={v3(egg2Rot)}
        {...decalProps}
      />
    </NestModel>
  );
}

export default memo(Nest);
