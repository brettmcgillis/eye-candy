# // All My Friends Are Ghosts

[Back to main TODO](../../../../../TODO.md)

## // Intent / Use Cases

- A single ghost (the shared `@elements/WebGPU/ghost` GhostCharacter) observing places and things you would never associate with a ghost — impossible locations.
- Each preset is a location; the ghost always stands at the world origin and the location is built around it.
- Slow cinematic camera drift per location (CameraRig spline paths in `utils/camera.js`), keeping the ghost and what it is watching in one frame.
- Locations reuse shared code: the black hole is `@modules/blackHole` (promoted from Aisle9), the ocean is `@modules/ifftOcean` (promoted from RowItAlone), the plane is `@elements/Boeing737`.

## // TODO:

- [ ] Campfire at night — on hold until a fire implementation is chosen in FireTest (FireAndSmoke vs VolumetricFire vs LowPolyFire).

## // Presets

- [ ] Black Hole — floating in deep space, watching a lensed black hole.
- [ ] Ocean: Day — hovering over open water, riding the real swell.
- [ ] Ocean: Night — moonlit ocean, glitter path, stars.
- [ ] Wing: Storm — on the 737's wing at night in rain and lightning, staring in the window.
- [ ] Wing: Above the Clouds — on the wing at sunset over a cloud sea.
- [ ] Tiny Moon — Little Prince style, standing on a small moon with Earth overhead.
- [ ] Lunar Surface — cratered regolith to the horizon, hard low sun, Earth in a black sky.
- [ ] Campfire — by a campfire at night.

## // Features

## // Interactivity

## // Bugs
