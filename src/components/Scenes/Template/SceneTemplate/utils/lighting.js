// Slot declaration consumed by useSceneLightingControls + LightingRig. Slot
// ids drive the flat `light<Slot><Prop>` preset keys (`key` -> lightKeyColor,
// lightKeyIntensity, ...), so renaming a slot is a preset migration.
//
// Delete this file and its wiring if your scene doesn't light anything —
// LightingRig is opt-in, not one of the three required items in
// docs/scene-conventions.md §13.
//
// A slot casts shadows only by declaring `shadow`, and the declaration is the
// map size: `shadow: 2048`, or `shadow: { mapSize, bias, normalBias, near,
// far, extent }` to tune. Absence means no shadow and no cost — each caster is
// an extra render pass, and a shadow-casting POINT light is a cube map (six).
//
// Position accepts raw XYZ (`position: [5, 8, 5]`) or spherical
// (`position: { azimuth, elevation, radius }`) — spherical is usually the
// better handle for aiming a sun or key light.
const LIGHTING = {
  ambient: { type: 'ambient', color: '#ffffff', intensity: 0.35 },
  key: {
    type: 'directional',
    color: '#fff4e0',
    intensity: 1.5,
    position: { azimuth: 45, elevation: 40, radius: 12 },
    shadow: 2048,
  },
};

export default LIGHTING;
