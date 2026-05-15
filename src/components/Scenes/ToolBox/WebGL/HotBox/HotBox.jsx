import React, { useCallback, useRef, useState } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import FIRE_PRESETS from '../../../../../presets/fire/firePresets';
import Attractors from '../../../../elements/attractors/Attractors';
import Fireball from '../../../../elements/fireball/Fireball';
import Flame from '../../../../elements/flame/Flame';
import GridBox from '../../../../elements/gridbox/GridBox';
import SmokeBall from '../../../../elements/smokeball/SmokeBall';
import SplineGroup from '../../../../elements/splineGroup/SplineGroup';
import FireballVolume from '../../../../elements/volumetricFire/FireballVolume';
import { parsePreset } from '../shared/splineDefaults';
import useHotBoxControls from './hooks/useHotBoxControls';

const DEFAULT_PRESET_KEY = Object.keys(FIRE_PRESETS)[0];
const { splines: DEFAULT_SPLINES } = parsePreset(
  FIRE_PRESETS[DEFAULT_PRESET_KEY]
);

export default function HotBox() {
  const [splines, setSplines] = useState(() => DEFAULT_SPLINES);

  const setSplinePoints = useCallback((splineIndex, updater) => {
    setSplines((prev) =>
      prev.map((pts, i) => {
        if (i !== splineIndex) return pts;
        return typeof updater === 'function' ? updater(pts) : updater;
      })
    );
  }, []);

  const attractorsRef = useRef([]);

  const config = useHotBoxControls(splines, setSplines, attractorsRef);

  return (
    <>
      <color attach="background" args={[config.bgColor ?? '#ffffff']} />

      <PerspectiveCamera
        makeDefault
        position={[0, 3, 12]}
        fov={70}
        near={0.01}
        far={500}
      />

      <ambientLight intensity={3} color={0xf0f0f0} />
      <spotLight
        position={[0, 15, 2]}
        angle={Math.PI * 0.2}
        intensity={4.5}
        decay={0}
        castShadow
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-bias={-0.000222}
        shadow-mapSize={[1024, 1024]}
      />

      <GridBox
        bgColor={config.bgColor ?? '#ffffff'}
        lineColor="#d1d1d1"
        lineWidth={0.02}
        size={20}
        gridSize={1}
      />

      <OrbitControls makeDefault dampingFactor={0.2} />

      {/* eslint-disable react/no-array-index-key */}
      {splines.map((points, index) => (
        <SplineGroup
          key={index}
          index={index}
          points={points}
          config={config}
          splineConfig={config.splineConfigs[index] ?? {}}
          attractorsRef={attractorsRef}
          setSplinePoints={setSplinePoints}
        />
      ))}
      {/* eslint-enable react/no-array-index-key */}

      {config.smokeBallInstances.map((instance) => (
        <group
          key={instance.id}
          position={instance.pos}
          rotation={instance.rot}
          scale={instance.scale}
        >
          <SmokeBall {...instance.config} />
        </group>
      ))}

      {config.fireballInstances.map((instance) => (
        <group
          key={instance.id}
          position={instance.pos}
          rotation={instance.rot}
          scale={instance.scale}
        >
          <Fireball {...instance.config} />
        </group>
      ))}

      {config.flameInstances.map((instance) => (
        <group
          key={instance.id}
          position={instance.pos}
          rotation={instance.rot}
          scale={instance.scale}
        >
          <Flame
            inverted={instance.config.inverted}
            motion={instance.config.motion}
          />
        </group>
      ))}

      {config.fireballVolumeInstances.map((instance) => (
        <group
          key={instance.id}
          position={instance.pos}
          rotation={instance.rot}
          scale={instance.scale}
        >
          <FireballVolume {...instance.config} />
        </group>
      ))}

      <Attractors
        attractorsRef={attractorsRef}
        mode={config.attractorMode}
        visible={config.showAttractors}
        radius={config.attractorRadius}
        version={config.attractorVersion}
        levaPrefix="Hot Box.Attractors"
      />
    </>
  );
}
