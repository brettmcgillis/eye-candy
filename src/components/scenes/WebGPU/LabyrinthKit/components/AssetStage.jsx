import React, { memo, useEffect, useMemo } from 'react';

import {
  Flare,
  createLanding,
  createStairSegment,
  createStoneMaterial,
  createWallSegment,
} from '@modules/houseOfLeaves';

import useFlightKit from '../hooks/useFlightKit';
import useKitMaterials from '../hooks/useKitMaterials';
import {
  assetHasFlare,
  assetHasHallway,
  assetHasOpening,
  assetHasRoom,
  variationByLabel,
} from '../utils/assets';
import FlightUnit from './FlightUnit';
import HallwayAssembly from './HallwayAssembly';

function useDisposable(factory, deps) {
  const value = useMemo(factory, deps);
  useEffect(() => () => value.dispose?.(), [value]);
  return value;
}

function AssetStage({ config }) {
  const material = useDisposable(
    () => createStoneMaterial({ color: config.stoneColor }),
    [config.stoneColor]
  );

  const stair = useDisposable(
    () =>
      createStairSegment({
        innerRadius: config.voidRadius,
        outerRadius: config.voidRadius + config.stairWidth,
        riser: config.riser,
        stepCount: config.stepCount,
        arcPerStep: (Math.PI * 2) / config.stepsPerTurn,
        thickness: config.landingThickness,
      }),
    [
      config.riser,
      config.stairWidth,
      config.stepCount,
      config.landingThickness,
      config.stepsPerTurn,
      config.voidRadius,
    ]
  );

  const landing = useDisposable(
    () =>
      createLanding({
        innerRadius: config.voidRadius - config.landingOvershoot,
        outerRadius: config.voidRadius + config.stairWidth,
        arc: config.landingArc * Math.PI * 2,
        thickness: config.landingThickness,
      }),
    [
      config.landingArc,
      config.landingThickness,
      config.landingOvershoot,
      config.stairWidth,
      config.voidRadius,
    ]
  );

  const wall = useDisposable(
    () =>
      createWallSegment({
        radius: config.voidRadius + config.stairWidth,
        arc: config.wallArc,
        base: -config.wallHeight * 0.5,
        height: config.wallHeight * 0.5,
        opening: assetHasOpening(config.asset)
          ? {
              width: config.mouthWidth,
              height: config.mouthHeight,
              offset: 0,
              archRise: config.mouthWidth * 0.5,
            }
          : null,
      }),
    [
      config.asset,
      config.mouthHeight,
      config.mouthWidth,
      config.stairWidth,
      config.voidRadius,
      config.wallArc,
      config.wallHeight,
    ]
  );

  const kit = useFlightKit(config);
  const materials = useKitMaterials(config);
  const { asset } = config;

  if (asset === 'Landing Variation') {
    return (
      <FlightUnit
        config={config}
        kit={kit}
        material={materials.stone}
        variation={variationByLabel(config.variation)}
        wallMaterial={materials.wall}
      />
    );
  }

  const wallRadius = config.voidRadius + config.stairWidth;

  if (asset === 'Stair Segment') {
    return (
      <mesh castShadow receiveShadow geometry={stair} material={material} />
    );
  }
  if (asset === 'Landing') {
    return (
      <mesh castShadow receiveShadow geometry={landing} material={material} />
    );
  }
  if (asset === 'Wall Segment' || asset === 'Wall + Opening') {
    return (
      <mesh castShadow receiveShadow geometry={wall} material={material} />
    );
  }
  if (asset === 'Flare') {
    return (
      <Flare
        color={config.flareColor}
        glow={config.flareGlow}
        intensity={config.flareIntensity}
        length={config.flareLength}
        radius={config.flareRadius}
        range={config.flareRange}
        shadows={config.flareShadows}
      />
    );
  }

  if (assetHasHallway(asset)) {
    return (
      <group position={[wallRadius, 0, 0]}>
        <HallwayAssembly
          config={config}
          flare={
            assetHasFlare(asset)
              ? (assetHasRoom(asset) && 'room') || 'hallway'
              : null
          }
          material={material}
          room={assetHasRoom(asset) ? config.roomSide : null}
        />
      </group>
    );
  }

  return null;
}

export default memo(AssetStage);
