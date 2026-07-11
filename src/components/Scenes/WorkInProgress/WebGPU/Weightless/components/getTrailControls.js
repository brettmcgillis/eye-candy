import { folder } from 'leva';

// Control schema for the curl-trail systems (CurlTrails). Flat,
// globally-unique keys (scene conventions §9); system on/off lives here so
// presets differentiate the looks (Curl Trails / Particle Bird / ...).
export default function getTrailControls() {
  return {
    Trails: folder(
      {
        trailsEnabled: { value: true, label: 'Enabled' },
        trailSpace: {
          value: 'world',
          options: { 'World Smear': 'world', 'Ride Surface': 'surface' },
          label: 'Trail Space',
        },
        interiorTrailCount: {
          value: 400,
          min: 0,
          max: 1500,
          step: 50,
          label: 'Interior Count',
        },
        exteriorTrailCount: {
          value: 600,
          min: 0,
          max: 2000,
          step: 50,
          label: 'Exterior Count',
        },
        trailFade: { value: 4, min: 0.2, max: 20, label: 'Fade (s)' },
        trailCurlScale: {
          value: 1.2,
          min: 0.05,
          max: 6,
          label: 'Curl Scale',
        },
        interiorTrailSpeed: {
          value: 0.4,
          min: 0,
          max: 4,
          label: 'Interior Speed',
        },
        exteriorTrailSpeed: {
          value: 1,
          min: 0,
          max: 6,
          label: 'Exterior Speed',
        },
        interiorRespawnRate: {
          value: 0.6,
          min: 0,
          max: 5,
          label: 'Interior Respawn',
        },
        exteriorTrailLife: {
          value: 4,
          min: 0.5,
          max: 15,
          label: 'Exterior Life (s)',
        },
        exteriorAmbient: { value: true, label: 'Ambient Exterior' },
        pointerTrails: { value: true, label: 'Pointer Trails' },
        interiorTrailColor: { value: '#9fe8ff', label: 'Interior Color' },
        exteriorTrailColor: { value: '#ffffff', label: 'Exterior Color' },
        interiorTrailOpacity: {
          value: 0.2,
          min: 0,
          max: 1,
          label: 'Interior Opacity',
        },
        exteriorTrailOpacity: {
          value: 0.5,
          min: 0,
          max: 1,
          label: 'Exterior Opacity',
        },
      },
      { collapsed: false }
    ),
  };
}
