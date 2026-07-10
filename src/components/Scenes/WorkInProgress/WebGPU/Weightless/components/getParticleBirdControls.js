import { folder } from 'leva';

// Control schema for ParticleBird. Flat, globally-unique keys — presets
// apply these 1:1 (see docs/scene-conventions.md §9).
export default function getParticleBirdControls() {
  return {
    Bird: folder(
      {
        birdVisible: { value: false, label: 'Show Source Bird' },
        birdScale: { value: 1, min: 0.05, max: 10, label: 'Scale' },
        birdYaw: { value: 0, min: -Math.PI, max: Math.PI, label: 'Yaw' },
        animationSpeed: { value: 1, min: 0, max: 3, label: 'Flap Speed' },
      },
      { collapsed: true }
    ),
    Particles: folder(
      {
        particleCount: {
          value: 65536,
          min: 1024,
          max: 262144,
          step: 1024,
          label: 'Count',
        },
        surfaceRatio: {
          value: 0.7,
          min: 0,
          max: 1,
          label: 'Surface / Interior',
        },
        particleSize: {
          value: 0.008,
          min: 0.0005,
          max: 0.1,
          label: 'Size',
        },
        boundFlow: { value: 0.6, min: 0, max: 5, label: 'Flow Speed' },
        boundFreq: { value: 2, min: 0.1, max: 10, label: 'Flow Frequency' },
        boundSpring: { value: 6, min: 0, max: 20, label: 'Home Pull' },
        shell: { value: 0.05, min: 0.001, max: 1, label: 'Shell Thickness' },
        evolve: { value: 0.4, min: 0, max: 3, label: 'Noise Evolve' },
      },
      { collapsed: true }
    ),
    Emission: folder(
      {
        emissionEnabled: { value: true, label: 'Enabled' },
        emitRate: { value: 3, min: 0, max: 30, label: 'Rate' },
        emitMinSpeed: { value: 1.5, min: 0, max: 20, label: 'Min Wing Speed' },
        emitMaxSpeed: { value: 6, min: 0, max: 40, label: 'Max Wing Speed' },
        feathersOnly: { value: true, label: 'Feathers Only' },
        inherit: { value: 0.35, min: 0, max: 1, label: 'Inherit Velocity' },
        kick: { value: 0.4, min: 0, max: 5, label: 'Normal Kick' },
        lifeSpan: { value: 1.6, min: 0.1, max: 8, label: 'Life (s)' },
        freeCurl: { value: 2.5, min: 0, max: 15, label: 'Free Curl' },
        freeFreq: { value: 1.2, min: 0.05, max: 8, label: 'Free Frequency' },
        freeDrag: { value: 1.2, min: 0, max: 8, label: 'Drag' },
        gravity: { value: 0, min: -5, max: 5, label: 'Gravity' },
      },
      { collapsed: true }
    ),
    Color: folder(
      {
        colorMode: {
          value: 'velocity',
          options: ['solid', 'gradient', 'velocity'],
          label: 'Mode',
        },
        colorA: { value: '#7fe7ff', label: 'Color A' },
        colorB: { value: '#ff4fd8', label: 'Color B' },
        intensity: { value: 1.2, min: 0, max: 8, label: 'Intensity' },
        boundAlpha: { value: 0.35, min: 0, max: 1, label: 'Bound Alpha' },
        freeAlpha: { value: 0.8, min: 0, max: 1, label: 'Free Alpha' },
        speedMin: { value: 0.2, min: 0, max: 10, label: 'Speed Map Min' },
        speedMax: { value: 5, min: 0.1, max: 40, label: 'Speed Map Max' },
      },
      { collapsed: true }
    ),
  };
}
