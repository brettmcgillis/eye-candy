import { folder } from 'leva';

// Control schema for ParticleBird. Flat, globally-unique keys — presets
// apply these 1:1 (see docs/scene-conventions.md §9). `p` is the resolved
// initial-preset snapshot (from useSceneControls) — its values seed the
// schema so a `?preset=` URL is honored on first mount, not just after a
// dropdown change.
export default function getParticleBirdControls(p = {}) {
  return {
    Bird: folder(
      {
        birdVisible: {
          value: p.birdVisible ?? false,
          label: 'Show Source Bird',
        },
        ghostBody: { value: p.ghostBody ?? true, label: 'Ghost Body' },
        ghostOpacity: {
          value: p.ghostOpacity ?? 0.35,
          min: 0,
          max: 1,
          label: 'Ghost Opacity',
        },
        birdScale: {
          value: p.birdScale ?? 1,
          min: 0.05,
          max: 10,
          label: 'Scale',
        },
        birdYaw: {
          value: p.birdYaw ?? 0,
          min: -Math.PI,
          max: Math.PI,
          label: 'Yaw',
        },
        animationSpeed: {
          value: p.animationSpeed ?? 1,
          min: 0,
          max: 3,
          label: 'Flap Speed',
        },
      },
      { collapsed: true }
    ),
    Particles: folder(
      {
        particlesEnabled: {
          value: p.particlesEnabled ?? false,
          label: 'Enabled',
        },
        particleCount: {
          value: p.particleCount ?? 65536,
          min: 1024,
          max: 262144,
          step: 1024,
          label: 'Count',
        },
        surfaceRatio: {
          value: p.surfaceRatio ?? 0.7,
          min: 0,
          max: 1,
          label: 'Surface / Interior',
        },
        particleSize: {
          value: p.particleSize ?? 0.008,
          min: 0.0005,
          max: 0.1,
          label: 'Size',
        },
        boundFlow: {
          value: p.boundFlow ?? 0.6,
          min: 0,
          max: 5,
          label: 'Flow Speed',
        },
        boundFreq: {
          value: p.boundFreq ?? 2,
          min: 0.1,
          max: 10,
          label: 'Flow Frequency',
        },
        boundSpring: {
          value: p.boundSpring ?? 6,
          min: 0,
          max: 20,
          label: 'Home Pull',
        },
        shell: {
          value: p.shell ?? 0.05,
          min: 0.001,
          max: 1,
          label: 'Shell Thickness',
        },
        evolve: {
          value: p.evolve ?? 0.4,
          min: 0,
          max: 3,
          label: 'Noise Evolve',
        },
      },
      { collapsed: true }
    ),
    Emission: folder(
      {
        emissionEnabled: {
          value: p.emissionEnabled ?? true,
          label: 'Enabled',
        },
        emitRate: { value: p.emitRate ?? 3, min: 0, max: 30, label: 'Rate' },
        emitMinSpeed: {
          value: p.emitMinSpeed ?? 1.5,
          min: 0,
          max: 20,
          label: 'Min Wing Speed',
        },
        emitMaxSpeed: {
          value: p.emitMaxSpeed ?? 6,
          min: 0,
          max: 40,
          label: 'Max Wing Speed',
        },
        feathersOnly: {
          value: p.feathersOnly ?? true,
          label: 'Feathers Only',
        },
        inherit: {
          value: p.inherit ?? 0.35,
          min: 0,
          max: 1,
          label: 'Inherit Velocity',
        },
        kick: { value: p.kick ?? 0.4, min: 0, max: 5, label: 'Normal Kick' },
        lifeSpan: {
          value: p.lifeSpan ?? 1.6,
          min: 0.1,
          max: 8,
          label: 'Life (s)',
        },
        freeCurl: {
          value: p.freeCurl ?? 2.5,
          min: 0,
          max: 15,
          label: 'Free Curl',
        },
        freeFreq: {
          value: p.freeFreq ?? 1.2,
          min: 0.05,
          max: 8,
          label: 'Free Frequency',
        },
        freeDrag: {
          value: p.freeDrag ?? 1.2,
          min: 0,
          max: 8,
          label: 'Drag',
        },
        gravity: {
          value: p.gravity ?? 0,
          min: -5,
          max: 5,
          label: 'Gravity',
        },
      },
      { collapsed: true }
    ),
    Color: folder(
      {
        colorMode: {
          value: p.colorMode ?? 'velocity',
          options: ['solid', 'gradient', 'velocity'],
          label: 'Mode',
        },
        colorA: { value: p.colorA ?? '#7fe7ff', label: 'Color A' },
        colorB: { value: p.colorB ?? '#ff4fd8', label: 'Color B' },
        intensity: {
          value: p.intensity ?? 1.2,
          min: 0,
          max: 8,
          label: 'Intensity',
        },
        boundAlpha: {
          value: p.boundAlpha ?? 0.35,
          min: 0,
          max: 1,
          label: 'Bound Alpha',
        },
        freeAlpha: {
          value: p.freeAlpha ?? 0.8,
          min: 0,
          max: 1,
          label: 'Free Alpha',
        },
        speedMin: {
          value: p.speedMin ?? 0.2,
          min: 0,
          max: 10,
          label: 'Speed Map Min',
        },
        speedMax: {
          value: p.speedMax ?? 5,
          min: 0.1,
          max: 40,
          label: 'Speed Map Max',
        },
      },
      { collapsed: true }
    ),
  };
}
