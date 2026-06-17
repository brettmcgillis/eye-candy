import React from 'react';

import Egg from '../Egg/Egg';
import Sticks from '../Sticks/Sticks';

// A pigeon nest: the Sticks bundle as the base with two eggs nestled on top.
//
// The Egg component pre-rotates its mesh and leaves the egg floating ~0.498 above
// its group origin (model-local), so blind defaults are unreliable — each egg gets
// its own position + rotation (nest-local, so it rides with the nest) plus a shared
// eggScale, all tuned live from the scene's Nest controls.
//
// `eggQrMap` (+ shared QR placement) stamps a texture once on each egg's shell — the
// scene uses it for a QR sticker that makes the fake eggs read as mass-produced.

const v3 = (o) => [o.x, o.y, o.z];

export default function Nest({
  eggScale = 0.5,
  egg1Pos = { x: -0.08, y: -0.16, z: 0.03 },
  egg1Rot = { x: 0, y: 0.4, z: 0 },
  egg2Pos = { x: 0.09, y: -0.16, z: -0.05 },
  egg2Rot = { x: 0, y: -0.3, z: 0 },
  eggQrMap,
  eggQrScale = 0.22,
  eggQrU = 0.02,
  eggQrV = 0,
  eggQrSpin = 0,
  ...props
}) {
  const qrProps = {
    qrMap: eggQrMap,
    qrScale: eggQrScale,
    qrU: eggQrU,
    qrV: eggQrV,
    qrSpin: eggQrSpin,
  };
  return (
    <group {...props} dispose={null}>
      <Sticks />
      <Egg
        scale={eggScale}
        position={v3(egg1Pos)}
        rotation={v3(egg1Rot)}
        {...qrProps}
      />
      <Egg
        scale={eggScale}
        position={v3(egg2Pos)}
        rotation={v3(egg2Rot)}
        {...qrProps}
      />
    </group>
  );
}
