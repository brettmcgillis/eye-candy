import * as THREE from 'three';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const E = (x, y, z) => new THREE.Euler(x, y, z);

const P = (x, y, z) => ({
  position: V(x, y, z),
  rotation: E(0, 0, 0),
  scale: V(1, 1, 1),
});

// Points are at scene scale (1 unit ≈ 1 metre).
// Presets carry both smoke and fire splines so HotBox can display both types.
// FireTest silently skips the smoke spline via allowedTypes="fire" on SplineGroup.
const DEFAULT_FIRE_PRESET = {
  splines: [
    {
      name: 'Default Smoke',
      type: 'Smoke',
      smokeType: 'Particle',
      closed: false,
      tension: 0.7,
      points: [
        P(0, -1, 0),
        P(1.1, 1, 0.7),
        P(-0.4, 4, 1.4),
        P(-1.3, 7.2, -0.3),
        P(0.6, 10, -1.1),
      ],
    },
    {
      name: 'Default Fire',
      type: 'Fire',
      fireType: 'Classic',
      closed: false,
      tension: 0.7,
      points: [
        P(0.2, -1, 0.15),
        P(0.8, 1.2, 0.7),
        P(-0.4, 4, 1.4),
        P(-1.3, 7.2, -0.3),
        P(0.6, 10, -1.1),
      ],
    },
  ],
};

export default DEFAULT_FIRE_PRESET;
