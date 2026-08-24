// Fake overhead cone that lights the drops. Nothing casts it — brightness is
// evaluated per particle in rainMaterial, so there is no volumetric pass.
export default function getLightControls(snapshot = {}) {
  return {
    lightX: {
      label: 'Center X',
      max: 100,
      min: -100,
      step: 0.5,
      value: snapshot.lightX ?? 0,
    },
    lightZ: {
      label: 'Center Z',
      max: 100,
      min: -100,
      step: 0.5,
      value: snapshot.lightZ ?? -6,
    },
    lightHeight: {
      label: 'Height',
      max: 200,
      min: 5,
      step: 1,
      value: snapshot.lightHeight ?? 62,
    },
    lightRadius: {
      label: 'Cone Radius',
      max: 60,
      min: 0.5,
      step: 0.5,
      value: snapshot.lightRadius ?? 9,
    },
    lightSpread: {
      label: 'Cone Spread',
      max: 2,
      min: 0,
      step: 0.01,
      value: snapshot.lightSpread ?? 0.42,
    },
    lightSoftness: {
      label: 'Edge Softness',
      max: 6,
      min: 0.1,
      step: 0.05,
      value: snapshot.lightSoftness ?? 1.8,
    },
    lightReach: {
      label: 'Reach',
      max: 300,
      min: 10,
      step: 1,
      value: snapshot.lightReach ?? 95,
    },
    lightIntensity: {
      label: 'Intensity',
      max: 8,
      min: 0,
      step: 0.05,
      value: snapshot.lightIntensity ?? 1.6,
    },
    lightAmbient: {
      label: 'Ambient',
      max: 1,
      min: 0,
      step: 0.005,
      value: snapshot.lightAmbient ?? 0.08,
    },
    lightDriftSpeed: {
      label: 'Drift Speed',
      max: 2,
      min: 0,
      step: 0.01,
      value: snapshot.lightDriftSpeed ?? 0.12,
    },
    lightDriftRadius: {
      label: 'Drift Radius',
      max: 40,
      min: 0,
      step: 0.5,
      value: snapshot.lightDriftRadius ?? 7,
    },
    lightPulse: {
      label: 'Pulse Amount',
      max: 1,
      min: 0,
      step: 0.01,
      value: snapshot.lightPulse ?? 0.22,
    },
  };
}
