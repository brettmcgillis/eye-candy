import { button, folder, useControls } from 'leva';

export default function useSceneControls(ghostRef) {
  const [controls] = useControls('Ghost Buster', () => ({
    Background: folder(
      {
        bgColor: { label: 'Color', value: '#1a1a2e' },
      },
      { collapsed: true }
    ),

    Lighting: folder(
      {
        ambientIntensity: {
          label: 'Ambient',
          value: 0.5,
          min: 0,
          max: 5,
          step: 0.1,
        },
        spotIntensity: {
          label: 'Spot',
          value: 0.2,
          min: 0,
          max: 10,
          step: 0.1,
        },
        spotHeight: {
          label: 'Spot Height',
          value: 5,
          min: 1,
          max: 15,
          step: 0.5,
        },
      },
      { collapsed: true }
    ),

    Floor: folder(
      {
        floorVisible: { label: 'Visible', value: true },
        gridSize: {
          label: 'Grid Size',
          value: 1,
          min: 0.1,
          max: 5,
          step: 0.1,
        },
        gridLineWidth: {
          label: 'Line Width',
          value: 0.03,
          min: 0.005,
          max: 0.1,
          step: 0.005,
        },
        floorColor: { label: 'Floor Color', value: '#3a3a4e' },
        gridLineColor: { label: 'Line Color', value: '#6a6a8e' },
      },
      { collapsed: true }
    ),

    Character: folder(
      {
        color: { label: 'Color', value: '#f5f0e8' },
        stiffness: {
          label: 'Stiffness',
          value: 0.16,
          min: 0.01,
          max: 0.5,
          step: 0.01,
        },
        dampening: {
          label: 'Dampening',
          value: 0.99,
          min: 0.9,
          max: 1,
          step: 0.001,
        },
        gravity: {
          label: 'Gravity',
          value: 0.00012,
          min: 0,
          max: 0.001,
          step: 0.00001,
        },
        windAmplitude: {
          label: 'Wind Amplitude',
          value: 0.0004,
          min: 0,
          max: 0.005,
          step: 0.0001,
        },
        maxVelocity: {
          label: 'Max Velocity',
          value: 0.01,
          min: 0.001,
          max: 0.05,
          step: 0.001,
        },
        holeAmount: {
          label: 'Holes',
          value: 0.2,
          min: 0,
          max: 1,
          step: 0.01,
        },
        edgeFade: {
          label: 'Edge Fade',
          value: 0.15,
          min: 0,
          max: 0.5,
          step: 0.01,
        },
        tatterEdge: {
          label: 'Tatter',
          value: 0,
          min: 0,
          max: 1,
          step: 0.01,
        },
        alphaScale: {
          label: 'Alpha Scale',
          value: 4,
          min: 0.5,
          max: 20,
          step: 0.5,
        },
        alphaSeed: {
          label: 'Alpha Seed',
          value: 42,
          min: 0,
          max: 200,
          step: 1,
        },
        roughness: {
          label: 'Roughness',
          value: 0.8,
          min: 0,
          max: 1,
          step: 0.01,
        },
        metalness: {
          label: 'Metalness',
          value: 0,
          min: 0,
          max: 1,
          step: 0.01,
        },
        opacity: {
          label: 'Opacity',
          value: 1,
          min: 0,
          max: 1,
          step: 0.01,
        },
        paused: { label: 'Paused', value: false },
        cursorCollider: { label: 'Cursor Collider', value: true },
        cursorRadius: {
          label: 'Cursor Radius',
          value: 0.12,
          min: 0.02,
          max: 0.3,
          step: 0.01,
        },
        collisionMargin: {
          label: 'Collision Margin',
          value: 0.02,
          min: 0,
          max: 0.1,
          step: 0.005,
        },
        clothSegments: {
          label: 'Cloth Segments',
          value: 28,
          min: 12,
          max: 60,
          step: 2,
        },
      },
      { collapsed: false }
    ),

    Hands: folder(
      {
        handSize: {
          label: 'Size',
          value: 0.05,
          min: 0.01,
          max: 0.15,
          step: 0.005,
        },
        handHeight: {
          label: 'Height',
          value: 0.3,
          min: 0.02,
          max: 0.3,
          step: 0.005,
        },
        handSpacing: {
          label: 'Spacing',
          value: 0.3,
          min: 0.05,
          max: 0.4,
          step: 0.01,
        },
        handSpring: {
          label: 'Spring',
          value: 8,
          min: 1,
          max: 20,
          step: 0.5,
        },
        handTrail: {
          label: 'Trail Distance',
          value: 0.15,
          min: 0,
          max: 0.5,
          step: 0.01,
        },
        debugColliders: { label: 'Show Colliders', value: true },
        debugColor: { label: 'Collider Color', value: '#ff4444' },
      },
      { collapsed: true }
    ),

    Camera: folder(
      {
        orbitEnabled: { label: 'Orbit Controls', value: true },
      },
      { collapsed: true }
    ),

    Eyes: folder(
      {
        eyeColor: { label: 'Color', value: '#88ccff' },
        eyeIntensity: {
          label: 'Intensity',
          value: 0.1,
          min: 0,
          max: 10,
          step: 0.1,
        },
      },
      { collapsed: true }
    ),

    Animation: folder(
      {
        bobAmplitude: {
          label: 'Bob Height',
          value: 0.03,
          min: 0,
          max: 0.1,
          step: 0.005,
        },
        bobSpeed: {
          label: 'Bob Speed',
          value: 0.5,
          min: 0,
          max: 5,
          step: 0.1,
        },
        swayAmplitude: {
          label: 'Sway',
          value: 0.02,
          min: 0,
          max: 0.1,
          step: 0.005,
        },
        tiltIntensity: {
          label: 'Tilt',
          value: 0.3,
          min: 0,
          max: 1,
          step: 0.01,
        },
        baseWind: {
          label: 'Base Wind',
          value: 0.3,
          min: 0,
          max: 2,
          step: 0.01,
        },
        windBoostMul: {
          label: 'Wind Boost',
          value: 2,
          min: 0,
          max: 5,
          step: 0.1,
        },
        squashIntensity: {
          label: 'Jump Squash',
          value: 0.3,
          min: 0,
          max: 0.5,
          step: 0.01,
        },
      },
      { collapsed: true }
    ),

    'Reset Cloth': button(() => {
      ghostRef.current?.resetSim();
    }),
  }));

  return controls;
}
