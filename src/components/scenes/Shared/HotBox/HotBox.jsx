import React, { useCallback, useRef, useState } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import Attractors from '@elements/Attractors/Attractors';
import FireAndSmoke from '@elements/FireAndSmoke/FireAndSmoke';
import Fireball from '@elements/Fireball/Fireball';
import FireballSpline from '@elements/Fireball/FireballSpline';
import Flame from '@elements/Flame/Flame';
import GridBox from '@elements/Gridbox/GridBox';
import Smoke2D from '@elements/Smoke/Smoke2D';
import SmokeBall from '@elements/Smokeball/SmokeBall';
import SmokeBallSpline from '@elements/Smokeball/SmokeBallSpline';
import SplineLine from '@elements/Spline/SplineLine';
import SplinePoints from '@elements/Spline/SplinePoints';
import SplineGroup from '@elements/SplineGroup/SplineGroup';
import { parsePreset } from '@elements/SplineGroup/splineDefaults';
import CS184VolumetricFire from '@elements/VolumetricFire/CS184VolumetricFire';
import VolumetricFire from '@elements/VolumetricFire/VolumetricFire';

import useHotBoxControls, {
  HOTBOX_DEFAULT_PRESET_KEY,
  getHotBoxPreset,
} from './hooks/useHotBoxControls';

const { splineInstances: DEFAULT_SPLINES } = parsePreset(
  getHotBoxPreset(HOTBOX_DEFAULT_PRESET_KEY)
);

export default function HotBox() {
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
            attractorsRef={attractorsRef}
            setSplinePoints={setSplinePoints}
          />
        </group>
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

      {config.smokeBallSplineInstances.map((instance) => {
        const controlPoints = instance.controlPoints.map((point) => ({
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
            <SmokeBallSpline
              controlPoints={controlPoints}
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
              color="#8888aa"
              visible={instance.showHandles}
              arcSegments={200}
            />
            <SplinePoints
              points={instance.controlPoints}
              setPoints={(updater) =>
                config.setSmokeBallSplinePoints(instance.id, updater)
              }
              visible={instance.showHandles}
              mode={instance.pointMode}
              pointSize={0.3}
            />
          </group>
        );
      })}

      {config.billboardSmokeInstances.map((instance) => (
        <Smoke2D
          key={instance.id}
          position={instance.pos}
          inverted={instance.config.inverted}
          smoke={instance.config}
        />
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
              attractorsRef={
                instance.config.enableAttractors === false
                  ? null
                  : attractorsRef
              }
              attractorStrength={config.attractorStrength}
              attractorRadius={config.attractorRadius}
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

      <Attractors
        attractorsRef={attractorsRef}
        mode={config.attractorMode}
        visible={config.showAttractors}
        strength={config.attractorStrength}
        radius={config.attractorRadius}
        version={config.attractorVersion}
        levaPrefix="Hot Box.Attractors"
      />
    </>
  );
}
