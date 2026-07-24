import { folder } from 'leva';

// Control schema for the curl-trail systems (CurlTrails). Flat,
// globally-unique keys (scene conventions §9); system on/off lives here so
// presets differentiate the looks (Curl Trails / Particle Bird / ...).
// `p` is the resolved initial-preset snapshot — see getParticleBirdControls.
//
// Three independent systems, each disabled via count 0:
// - Field Lines: unbounded curl-noise walkers that wander through and
//   around the bird (previously mislabeled "interior" — they were never
//   actually confined to the bird's volume, hence the rename).
// - Surface: geodesic walkers that ride the mesh surface (ported from
//   interactiveCurl/galacticSurface).
// - Volume Fill: genuinely bounded walkers — each has a fixed home point
//   inside the bird and is spring-pulled + shell-clamped around it (same
//   home/spring/shell math as the GPU particle sim's bound particles), so
//   it actually fills the bird's volume instead of escaping it.
export default function getTrailControls(p = {}) {
  return {
    Trails: folder(
      {
        trailsEnabled: { value: p.trailsEnabled ?? true, label: 'Enabled' },
        trailSpace: {
          value: p.trailSpace ?? 'world',
          options: { 'World Smear': 'world', 'Ride Surface': 'surface' },
          label: 'Trail Space',
        },
        trailFade: {
          value: p.trailFade ?? 4,
          min: 0.2,
          max: 20,
          label: 'Fade (s)',
        },
        pointerTrails: {
          value: p.pointerTrails ?? true,
          label: 'Pointer Trails',
        },
      },
      { collapsed: false }
    ),
    'Field Lines': folder(
      {
        fieldLineCount: {
          value: p.fieldLineCount ?? 400,
          min: 0,
          max: 1500,
          step: 50,
          label: 'Count',
        },
        fieldLineCurlScale: {
          value: p.fieldLineCurlScale ?? p.trailCurlScale ?? 1.2,
          min: 0.05,
          max: 6,
          label: 'Curl Scale',
        },
        fieldLineSpeed: {
          value: p.fieldLineSpeed ?? 0.4,
          min: 0,
          max: 4,
          label: 'Speed',
        },
        fieldLineRespawnRate: {
          value: p.fieldLineRespawnRate ?? 0.6,
          min: 0,
          max: 5,
          label: 'Respawn Rate',
        },
        fieldLineColor: {
          value: p.fieldLineColor ?? '#9fe8ff',
          label: 'Color',
        },
        fieldLineOpacity: {
          value: p.fieldLineOpacity ?? 0.2,
          min: 0,
          max: 1,
          label: 'Opacity',
        },
      },
      { collapsed: false }
    ),
    Surface: folder(
      {
        exteriorTrailCount: {
          value: p.exteriorTrailCount ?? 600,
          min: 0,
          max: 2000,
          step: 50,
          label: 'Count',
        },
        exteriorCurlScale: {
          value: p.exteriorCurlScale ?? p.trailCurlScale ?? 1.2,
          min: 0.05,
          max: 6,
          label: 'Curl Scale',
        },
        exteriorTrailSpeed: {
          value: p.exteriorTrailSpeed ?? 1,
          min: 0,
          max: 6,
          label: 'Speed',
        },
        exteriorTrailLife: {
          value: p.exteriorTrailLife ?? 4,
          min: 0.5,
          max: 15,
          label: 'Life (s)',
        },
        exteriorAmbient: {
          value: p.exteriorAmbient ?? true,
          label: 'Ambient',
        },
        exteriorTrailColor: {
          value: p.exteriorTrailColor ?? '#ffffff',
          label: 'Color',
        },
        exteriorTrailOpacity: {
          value: p.exteriorTrailOpacity ?? 0.5,
          min: 0,
          max: 1,
          label: 'Opacity',
        },
      },
      { collapsed: false }
    ),
    'Volume Fill': folder(
      {
        volumeFillCount: {
          value: p.volumeFillCount ?? 0,
          min: 0,
          max: 1500,
          step: 50,
          label: 'Count',
        },
        // Small-scale system — the shell radius sits well inside the
        // bird's body, so ranges/steps are tightened from the field-line
        // scale for usable drag precision (Leva's auto step on a wide
        // range rounds to ~0.01, too coarse here).
        volumeFillCurlScale: {
          value: p.volumeFillCurlScale ?? 1.5,
          min: 0.05,
          max: 8,
          step: 0.05,
          label: 'Curl Scale',
        },
        volumeFillEvolve: {
          value: p.volumeFillEvolve ?? 0.4,
          min: 0,
          max: 3,
          step: 0.01,
          label: 'Noise Evolve',
        },
        volumeFillFlow: {
          value: p.volumeFillFlow ?? 0.15,
          min: 0,
          max: 2,
          step: 0.005,
          label: 'Flow Speed',
        },
        volumeFillSpring: {
          value: p.volumeFillSpring ?? 8,
          min: 0,
          max: 20,
          step: 0.1,
          label: 'Home Pull',
        },
        volumeFillRadius: {
          value: p.volumeFillRadius ?? 0.05,
          min: 0.005,
          max: 0.4,
          step: 0.005,
          label: 'Shell Radius',
        },
        volumeFillColor: {
          value: p.volumeFillColor ?? '#9fe8ff',
          label: 'Color',
        },
        volumeFillOpacity: {
          value: p.volumeFillOpacity ?? 0.3,
          min: 0,
          max: 1,
          label: 'Opacity',
        },
      },
      { collapsed: false }
    ),
  };
}
