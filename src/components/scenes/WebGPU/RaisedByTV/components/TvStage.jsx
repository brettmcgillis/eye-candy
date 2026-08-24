import React from 'react';

import { CrtStageFloor } from '@elements/Crt/CrtPanelParts';

import {
  HERO_TV_LAYOUT,
  RAISED_BY_TV_STAGE_FLOOR,
} from '../utils/raisedByTvSceneConfig';
import InteractiveTvController from './InteractiveTvController';

function RingLight() {
  return (
    <group>
      <directionalLight position={[0, 10, 0]} intensity={0.7} />
      <directionalLight position={[0, 10, 0]} intensity={0.7} />
      <mesh position={[0, 10, 5]} rotation={[-Math.PI / 4, 0, 0]}>
        <torusGeometry args={[5, 0.16, 18, 72]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={1}
        />
      </mesh>
    </group>
  );
}

export default function TvStage({ channels }) {
  return (
    <>
      <ambientLight intensity={0.1} />
      <directionalLight position={[5, 6, 4]} intensity={0.25} />
      <directionalLight position={[-5, 6, -4]} intensity={0.25} />

      <group>
        {HERO_TV_LAYOUT.map((tv) => (
          <InteractiveTvController
            key={`${tv.defaultChannel}-${tv.position.join('-')}`}
            channels={channels}
            defaultChannel={tv.defaultChannel}
            isTurnedOn={tv.isTurnedOn}
            position={tv.position}
            rotation={tv.rotation}
            scale={tv.scale}
          />
        ))}
      </group>

      <CrtStageFloor
        color={RAISED_BY_TV_STAGE_FLOOR.color}
        metalness={RAISED_BY_TV_STAGE_FLOOR.metalness}
        position={RAISED_BY_TV_STAGE_FLOOR.position}
        rotation={RAISED_BY_TV_STAGE_FLOOR.rotation}
        roughness={RAISED_BY_TV_STAGE_FLOOR.roughness}
        size={RAISED_BY_TV_STAGE_FLOOR.size}
      />
      <RingLight />
    </>
  );
}
