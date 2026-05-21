import React, { useCallback, useState } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import FIRE_PRESETS from '../../../../../presets/fire/firePresets';
import FireAndSmoke from '../../../../elements/fireAndSmoke/FireAndSmoke';
import Fireball from '../../../../elements/fireball/Fireball';
import FireballSpline from '../../../../elements/fireball/FireballSpline';
import Flame from '../../../../elements/flame/Flame';
import GridBox from '../../../../elements/gridbox/GridBox';
import SplineLine from '../../../../elements/spline/SplineLine';
import SplinePoints from '../../../../elements/spline/SplinePoints';
import SplineGroup from '../../../../elements/splineGroup/SplineGroup';
import CS184VolumetricFire from '../../../../elements/volumetricFire/CS184VolumetricFire';
import VolumetricFire from '../../../../elements/volumetricFire/VolumetricFire';
import {
  filterParsedPresetByType,
  parsePreset,
} from '../shared/splineDefaults';
import useFireTestControls from './hooks/useFireTestControls';

const DEFAULT_PRESET_KEY = Object.keys(FIRE_PRESETS)[0];
const { splineInstances: DEFAULT_SPLINES } = filterParsedPresetByType(
  parsePreset(FIRE_PRESETS[DEFAULT_PRESET_KEY]),
  'Fire'
);

// ─── Component ───────────────────────────────────────────────────────────────

export default function FireTest() {
  const [splines, setSplines] = useState(() => DEFAULT_SPLINES);

  const setSplinePoints = useCallback((splineIndex, updater) => {
    setSplines((prev) =>
      prev.map((spline, i) => {
        if (i !== splineIndex) return spline;
        return {
          ...spline,
          points:
            typeof updater === 'function' ? updater(spline.points) : updater,
        };
      })
    );
  }, []);

  const config = useFireTestControls(splines, setSplines);

  return (
    <>
      <color attach="background" args={[config.bgColor]} />

      <PerspectiveCamera
        makeDefault
        position={[0, 2, 10]}
        fov={70}
        near={0.01}
        far={1000}
      />

      <ambientLight intensity={3} color={0xf0f0f0} />
      <spotLight
        position={[0, 15, 2]}
        angle={Math.PI * 0.2}
        intensity={4.5}
        decay={0}
      />

      <GridBox
        bgColor={config.bgColor}
        lineColor={config.lineColor}
        lineWidth={0.02}
        size={20}
        gridSize={1}
      />

      <OrbitControls makeDefault dampingFactor={0.2} />

      {/* ── Multi-spline SplineGroups (fire types) ────────────────────────── */}
      {/* eslint-disable react/no-array-index-key */}
      {splines.map((spline, index) => (
        <group
          key={index}
          position={spline.pos}
          rotation={spline.rot}
          scale={spline.scale}
        >
          <SplineGroup
            index={index}
            points={spline.points}
            config={config}
            splineConfig={config.splineConfigs[index] ?? {}}
            setSplinePoints={setSplinePoints}
            allowedTypes="fire"
          />
        </group>
      ))}
      {/* eslint-enable react/no-array-index-key */}

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

      {config.fireSplineInstances.map((instance) => {
        const fireballControlPoints = instance.controlPoints.map((point) => ({
          position: point.position,
          radius: instance.config.baseRadius * (point.scale?.x ?? 1),
        }));
        const splinePositions = instance.controlPoints.map(
          (point) => point.position
        );

        return (
          <group
            key={instance.id}
            position={instance.pos}
            rotation={instance.rot}
            scale={instance.scale}
          >
            <FireballSpline
              controlPoints={fireballControlPoints}
              tubularSegments={instance.config.tubularSegments}
              radialSegments={instance.config.radialSegments}
              capSegments={instance.config.capSegments}
              speed={instance.config.speed}
              weight={instance.config.weight}
              noiseFreq={instance.config.noiseFreq}
              noiseAmp={instance.config.noiseAmp}
              animated={instance.config.animated}
              smokeLightColor={instance.config.smokeLightColor}
              smokeDarkColor={instance.config.smokeDarkColor}
            />

            <SplineLine
              points={splinePositions}
              curveType="centripetal"
              color="#ff8844"
              visible={instance.showSpline}
              arcSegments={200}
            />

            <SplinePoints
              points={instance.controlPoints}
              setPoints={(updater) =>
                config.setFireSplinePoints(instance.id, updater)
              }
              visible={instance.showHandles}
              mode={instance.pointMode}
              pointSize={0.3}
            />
          </group>
        );
      })}

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

      {config.volumetricFireInstances.map((instance) => (
        <group
          key={instance.id}
          position={instance.pos}
          rotation={instance.rot}
          scale={instance.scale}
        >
          <VolumetricFire {...instance.config} />
        </group>
      ))}

      {config.cs184FireInstances.map((instance) => (
        <group
          key={instance.id}
          position={instance.pos}
          rotation={instance.rot}
          scale={instance.scale}
        >
          <CS184VolumetricFire {...instance.config} />
        </group>
      ))}

      {config.fireAndSmokeInstances.map((instance) => {
        const splinePositions = instance.controlPoints.map(
          (point) => point.position
        );

        return (
          <group
            key={instance.id}
            position={instance.pos}
            rotation={instance.rot}
            scale={instance.scale}
          >
            <FireAndSmoke
              controlPoints={instance.controlPoints}
              {...instance.config}
            />

            <SplineLine
              points={splinePositions}
              curveType="centripetal"
              color={instance.config.particleColor}
              visible={instance.showSpline}
              arcSegments={200}
            />

            <SplinePoints
              points={instance.controlPoints}
              setPoints={(updater) =>
                config.setFireAndSmokePoints(instance.id, updater)
              }
              visible={instance.showHandles}
              mode={instance.pointMode}
              pointSize={0.3}
            />
          </group>
        );
      })}
    </>
  );
}
