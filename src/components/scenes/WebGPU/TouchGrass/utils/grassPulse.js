import { time } from 'three/tsl';

// Keeps blade roots glued to the terrain's world-space pulse on every tile.
export default function createPulseLift(uniforms) {
  return ({ worldX, worldZ }) => {
    const pulseTime = time.mul(uniforms.terrainPulseSpeed);
    const primaryWave = worldX
      .mul(uniforms.terrainPulseScale.mul(2.6))
      .add(worldZ.mul(uniforms.terrainPulseScale.mul(1.6)))
      .add(pulseTime)
      .sin();
    const secondaryWave = worldX
      .mul(uniforms.terrainPulseScale.mul(1.15))
      .sub(worldZ.mul(uniforms.terrainPulseScale.mul(2.2)))
      .sub(pulseTime.mul(1.35))
      .sin();
    return primaryWave
      .mul(0.7)
      .add(secondaryWave.mul(0.45))
      .mul(uniforms.terrainPulseAmplitude);
  };
}
