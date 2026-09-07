import React, { memo, useMemo } from 'react';

import { Flare } from '@modules/houseOfLeaves';

import { jitterBranchConfig, mouthVariant } from '../utils/jitter';
import HallwayAssembly from './HallwayAssembly';

// One flight: the treads, the shaft wall behind them, and the landing that
// closes it with whatever that landing carries.
function FlightUnit({
  config,
  index = 0,
  kit,
  material,
  variation,
  wallMaterial,
  withLanding = true,
}) {
  const flareAngle = kit.landingArc * 0.5;
  const variant = mouthVariant(index, config.variance);
  const branch = useMemo(
    () => ({
      ...jitterBranchConfig(config, index, variant),
      wallRadius: kit.wallRadius,
    }),
    [config, index, kit.wallRadius, variant]
  );

  const flare = (position, seed) => (
    <Flare
      color={config.flareColor}
      glow={config.flareGlow}
      intensity={config.flareIntensity}
      length={config.flareLength}
      position={position}
      radius={config.flareRadius}
      range={config.flareRange}
      shadows={config.flareShadows && index < config.flareShadowCount}
      seed={seed}
    />
  );

  return (
    <>
      <mesh castShadow receiveShadow geometry={kit.stair} material={material} />
      <mesh
        geometry={kit.wallFlight}
        material={material}
        position={[0, -kit.span.rise * 0.5, 0]}
        rotation={[0, -kit.span.arc * 0.5, 0]}
      />
      {withLanding && (
        <group
          position={[0, -kit.landingDrop, 0]}
          rotation={[0, -kit.span.arc, 0]}
        >
          <mesh
            castShadow
            receiveShadow
            geometry={kit.landing}
            material={material}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={
              variation.hallway ? kit.wallOpenVariants[variant] : kit.wallSolid
            }
            material={wallMaterial}
            visible={config.wallMode !== 'Hidden'}
            rotation={[0, -kit.landingArc * 0.5, 0]}
          />
          {variation.flare === 'landing' &&
            flare(
              [
                Math.cos(flareAngle) * kit.landingMidRadius,
                0.0,
                Math.sin(flareAngle) * kit.landingMidRadius,
              ],
              index
            )}
          {variation.hallway && (
            <group
              position={[
                Math.cos(flareAngle) * kit.wallRadius,
                0,
                Math.sin(flareAngle) * kit.wallRadius,
              ]}
              rotation={[0, -flareAngle, 0]}
            >
              <HallwayAssembly
                castShadows={
                  config.flareShadows && index < config.flareShadowCount
                }
                config={branch}
                flare={variation.flare}
                material={material}
                room={variation.room}
                seed={index}
              />
            </group>
          )}
        </group>
      )}
    </>
  );
}

export default memo(FlightUnit);
