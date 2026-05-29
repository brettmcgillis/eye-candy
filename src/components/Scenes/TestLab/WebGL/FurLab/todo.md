# // FurLab (WebGL)

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

## Intent / Use Cases

- Fur Lab should stay the quickest way to compare shell fur and strand fur in the WebGL renderer.
- Scene should exercise both a static textured mesh and a skinned animated mesh so regressions are obvious.
- Scene should remain a compact parity harness for the shared Fur API before those techniques are used in larger compositions.

## Bugs / Parity

- [ ] Verify shell fur parity on the static specimen after any FurGL changes.
- [ ] Verify strand fur parity on the static specimen after any FurGL changes.
- [ ] Verify shell fur parity on the animated rabbit after any FurGL or skinned-mesh updates.
- [ ] Verify strand fur parity on the animated rabbit after any FurGL or skinned-mesh updates.
- [ ] Check pointer interaction and OrbitControls together so grooming interaction does not fight camera orbit.
- [ ] Check material and texture inheritance so fur color stays aligned with the source mesh under different lighting.

## Features / UX

- [ ] Add scene controls or presets for shell count, strand count, wind, and interaction strength.
- [ ] Add simple specimen labels so screenshots clearly show shell vs strand and static vs skinned comparisons.
- [ ] Add one darker or higher-contrast specimen material to make inheritance and silhouette issues easier to spot.

## Performance / Architecture

- [ ] Profile current shell and strand defaults in WebGL and tune them for stable frame rate on lower-end hardware.
- [ ] Exercise clamp limits from the Fur utilities with scene presets so the scene documents the supported operating range.
- [ ] Revisit whether the shared FurLab scene should stay unified once renderer-specific debug controls start to diverge.
