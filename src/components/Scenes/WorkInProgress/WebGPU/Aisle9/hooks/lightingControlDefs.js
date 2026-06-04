import { folder } from 'leva';

const COLLAPSED = { collapsed: true };

export default function buildLightingControls(snapshot) {
  return {
    Ambient: folder(
      {
        ambientColor: { label: 'Color', value: snapshot.ambientColor },
        ambientIntensity: {
          label: 'Intensity',
          value: snapshot.ambientIntensity,
          min: 0,
          max: 5,
          step: 0.01,
        },
      },
      COLLAPSED
    ),
    Moon: folder(
      {
        moonColor: { label: 'Color', value: snapshot.moonColor },
        moonIntensity: {
          label: 'Intensity',
          value: snapshot.moonIntensity,
          min: 0,
          max: 2,
          step: 0.01,
        },
      },
      COLLAPSED
    ),
    'Outdoor Lights': folder(
      {
        outdoorEmissiveColor: {
          label: 'Emissive Color',
          value: snapshot.outdoorEmissiveColor,
        },
        outdoorEmissiveIntensity: {
          label: 'Emissive',
          value: snapshot.outdoorEmissiveIntensity ?? 0,
          min: 0,
          max: 10,
          step: 0.05,
        },
        outdoorLightColor: {
          label: 'Light Color',
          value: snapshot.outdoorLightColor,
        },
        outdoorLightIntensity: {
          label: 'Intensity',
          value: snapshot.outdoorLightIntensity ?? 0,
          min: 0,
          max: 10000,
          step: 50,
        },
      },
      COLLAPSED
    ),
    'Indoor Lights': folder(
      {
        indoorEmissiveColor: {
          label: 'Emissive Color',
          value: snapshot.indoorEmissiveColor,
        },
        indoorEmissiveIntensity: {
          label: 'Emissive',
          value: snapshot.indoorEmissiveIntensity ?? 0,
          min: 0,
          max: 10,
          step: 0.05,
        },
        indoorLightColor: {
          label: 'Light Color',
          value: snapshot.indoorLightColor,
        },
        indoorLightIntensity: {
          label: 'Intensity',
          value: snapshot.indoorLightIntensity ?? 0,
          min: 0,
          max: 10000,
          step: 50,
        },
      },
      COLLAPSED
    ),
    'Store Fill': folder(
      {
        storeFillColor: { label: 'Color', value: snapshot.storeFillColor },
        storeFillIntensity: {
          label: 'Intensity',
          value: snapshot.storeFillIntensity ?? 0,
          min: 0,
          max: 5000,
          step: 10,
        },
      },
      COLLAPSED
    ),
    Sign: folder(
      {
        signEmissiveColor: {
          label: 'Color',
          value: snapshot.signEmissiveColor,
        },
        signGlowIntensity: {
          label: 'Intensity',
          value: snapshot.signGlowIntensity ?? 0,
          min: 0,
          max: 5,
          step: 0.01,
        },
      },
      COLLAPSED
    ),
  };
}
