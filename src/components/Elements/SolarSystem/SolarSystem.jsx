import React from 'react';

import Sun from '../webgl/sun/Sun';
import AsteroidBelt from './AsteroidBelt';
import SolarPlanet from './SolarPlanet';
import {
  SOLAR_SYSTEM_ASTEROID_BELTS,
  SOLAR_SYSTEM_DEFAULT_SUN_RADIUS,
  SOLAR_SYSTEM_PLANETS,
} from './solarSystem.constants';
import useSolarSystemTextures from './useSolarSystemTextures';

export { default as AsteroidBelt } from './AsteroidBelt';
export { default as SolarPlanet } from './SolarPlanet';
export { default as useSolarSystemTextures } from './useSolarSystemTextures';
export {
  SOLAR_SYSTEM_ASTEROID_BELTS,
  SOLAR_SYSTEM_DEFAULT_SUN_RADIUS,
  SOLAR_SYSTEM_PLANETS,
} from './solarSystem.constants';

export default function SolarSystem({
  asteroidBelts = SOLAR_SYSTEM_ASTEROID_BELTS,
  asteroidMode = 'mesh',
  orbitSpeed = 1,
  orbitOpacity = 0.14,
  orbitColor = '#8ea2ff',
  rotationSpeed = 1,
  showAsteroidBelts = true,
  showOrbits = true,
  sunRadius = SOLAR_SYSTEM_DEFAULT_SUN_RADIUS,
  sunEmissiveIntensity = 2.8,
  sunLightIntensity = 18,
}) {
  const textures = useSolarSystemTextures();

  return (
    <group>
      <Sun
        radius={sunRadius}
        emissiveIntensity={sunEmissiveIntensity}
        lightIntensity={sunLightIntensity}
      />

      {showAsteroidBelts
        ? asteroidBelts.map((belt) => (
            <AsteroidBelt
              key={belt.name}
              color={belt.color}
              count={belt.count}
              innerRadius={belt.innerRadius}
              mode={belt.mode ?? asteroidMode}
              opacity={belt.opacity}
              outerRadius={belt.outerRadius}
              rotationSpeed={belt.rotationSpeed}
              scaleMax={belt.scaleMax}
              scaleMin={belt.scaleMin}
              seed={belt.seed}
              spriteCount={belt.spriteCount}
              spriteSize={belt.spriteSize}
              speedMultiplier={orbitSpeed}
              thickness={belt.thickness}
            />
          ))
        : null}

      {SOLAR_SYSTEM_PLANETS.map((planet) => (
        <SolarPlanet
          key={planet.name}
          config={planet}
          orbitColor={orbitColor}
          orbitOpacity={orbitOpacity}
          orbitSpeedMultiplier={orbitSpeed}
          rotationSpeedMultiplier={rotationSpeed}
          showOrbits={showOrbits}
          textures={textures}
        />
      ))}
    </group>
  );
}
